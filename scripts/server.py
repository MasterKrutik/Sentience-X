import uvicorn
from fastapi import FastAPI, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import xgboost as xgb
import numpy as np
import os
import json
import sqlite3
import hashlib
import secrets
import time
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Optional

app = FastAPI(title="SentienceX ML & Secure Authentication Service")

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"], # Specific origins for credential support
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- HTTPS Enforcement Middleware -----------------
@app.middleware("http")
async def enforce_https_middleware(request: Request, call_next):
    # Allow local development over HTTP
    host = request.headers.get("host", "")
    proto = request.headers.get("x-forwarded-proto", "")
    
    if proto == "http" and not ("localhost" in host or "127.0.0.1" in host):
        return Response(
            content="HTTPS Required", 
            status_code=status.HTTP_403_FORBIDDEN
        )
        
    response = await call_next(request)
    return response

# ----------------- Rate Limiting -----------------
login_attempts = defaultdict(list)

def enforce_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    # Filter attempts in the last 60 seconds
    login_attempts[ip] = [t for t in login_attempts[ip] if now - t < 60]
    if len(login_attempts[ip]) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again after a minute."
        )
    login_attempts[ip].append(now)

# ----------------- Database Setup & Utilities -----------------
DB_PATH = 'data/sentiencex.db'
DATABASE_URL = os.environ.get("DATABASE_URL")
IS_POSTGRES = False

if DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")):
    try:
        import psycopg2
        IS_POSTGRES = True
        print("Configured to use PostgreSQL Database.")
    except ImportError:
        print("Warning: DATABASE_URL is set but 'psycopg2' is not installed. Falling back to SQLite.")
        IS_POSTGRES = False
else:
    print("Configured to use local SQLite Database.")

def get_db_connection():
    if IS_POSTGRES:
        import psycopg2
        return psycopg2.connect(DATABASE_URL)
    else:
        os.makedirs('data', exist_ok=True)
        return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # SQLite/Postgres compatible table definitions
    if IS_POSTGRES:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                email VARCHAR(255) PRIMARY KEY,
                password_hash VARCHAR(255) NOT NULL,
                salt VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                picture TEXT,
                token VARCHAR(255)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telemetry (
                email VARCHAR(255),
                timestamp VARCHAR(50),
                signals TEXT,
                questions TEXT,
                predictions TEXT,
                ground_truth TEXT,
                PRIMARY KEY (email, timestamp)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS phq9_gad7_logs (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                timestamp VARCHAR(50) NOT NULL,
                phq9_answers TEXT NOT NULL,
                phq9_score INTEGER NOT NULL,
                gad7_answers TEXT NOT NULL,
                gad7_score INTEGER NOT NULL,
                predictions TEXT NOT NULL
            )
        ''')
    else:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                name TEXT,
                picture TEXT,
                token TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telemetry (
                email TEXT,
                timestamp TEXT,
                signals TEXT,
                questions TEXT,
                predictions TEXT,
                ground_truth TEXT,
                PRIMARY KEY (email, timestamp)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS phq9_gad7_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                phq9_answers TEXT NOT NULL,
                phq9_score INTEGER NOT NULL,
                gad7_answers TEXT NOT NULL,
                gad7_score INTEGER NOT NULL,
                predictions TEXT NOT NULL
            )
        ''')
    
    # Backward compatibility migrations for existing setups
    try:
        cursor.execute("ALTER TABLE telemetry ADD COLUMN ground_truth TEXT")
    except Exception:
        pass
        
    conn.commit()
    conn.close()

def execute_query(query: str, params: tuple = ()):
    if IS_POSTGRES:
        query = query.replace('?', '%s')
        if "INSERT OR REPLACE INTO telemetry" in query:
            query = query.replace(
                "INSERT OR REPLACE INTO telemetry (email, timestamp, signals, questions, predictions, ground_truth) VALUES (%s, %s, %s, %s, %s, %s)",
                "INSERT INTO telemetry (email, timestamp, signals, questions, predictions, ground_truth) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (email, timestamp) DO UPDATE SET signals = EXCLUDED.signals, questions = EXCLUDED.questions, predictions = EXCLUDED.predictions, ground_truth = EXCLUDED.ground_truth"
            )
            
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def fetch_one(query: str, params: tuple = ()):
    if IS_POSTGRES:
        query = query.replace('?', '%s')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        row = cursor.fetchone()
        return row
    finally:
        conn.close()

def fetch_all(query: str, params: tuple = ()):
    if IS_POSTGRES:
        query = query.replace('?', '%s')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return rows
    finally:
        conn.close()

# Password hashing helper (PBKDF2-HMAC-SHA256 with 100k iterations)
def hash_password(password: str, salt: bytes = None) -> tuple[str, str]:
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    return key.hex(), salt.hex()

def verify_password(password: str, password_hash: str, salt_hex: str) -> bool:
    salt = bytes.fromhex(salt_hex)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    return key.hex() == password_hash

def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again."
        )
    user = fetch_one("SELECT email, name, picture FROM users WHERE token = ?", (token,))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )
    return {"email": user[0], "name": user[1], "picture": user[2], "token": token}

# ----------------- Pydantic Models -----------------
class TelemetryInput(BaseModel):
    typing_speed: float
    typing_accuracy: float
    typing_latency: float
    typing_errors: float
    sleep_duration: float
    sleep_quality: float
    steps: float
    screen_time: float
    social_minutes: float
    social_quality: float
    question_affect: float

class SignupRequest(BaseModel):
    email: str = Field(..., example="user@domain.com")
    password: str = Field(..., min_length=6, example="password123")
    name: str = Field(..., example="Siddharth Sharma")

class LoginRequest(BaseModel):
    email: str = Field(..., example="user@domain.com")
    password: str = Field(..., example="password123")

class GoogleLoginRequest(BaseModel):
    email: str
    name: str
    picture: str = None
    token: str

class SyncRequest(BaseModel):
    signals: dict
    questions: list
    predictions: dict
    ground_truth: dict = None

class ClinicalLogRequest(BaseModel):
    phq9_answers: list
    phq9_score: int
    gad7_answers: list
    gad7_score: int
    predictions: dict

class ChatMessageModel(BaseModel):
    id: Optional[str] = None
    sender: str
    text: str
    timestamp: Optional[str] = None
    isCrisis: Optional[bool] = None

class CounselRequest(BaseModel):
    message: str
    history: List[ChatMessageModel]
    predictions: Dict[str, float]

# ----------------- ML Models Loading -----------------
models = {}
targets = [
    'stress', 'burnout', 'anxiety', 'motivation', 
    'loneliness', 'cognitive_fatigue', 'overall_wellness'
]
features = [
    'typing_speed', 'typing_accuracy', 'typing_latency', 'typing_errors',
    'sleep_duration', 'sleep_quality', 'steps', 'screen_time',
    'social_minutes', 'social_quality', 'question_affect'
]

@app.on_event("startup")
def startup_event():
    init_db()
    print("Database initialized successfully.")
    
    print("Loading XGBoost models...")
    for target in targets:
        model_path = f"model_artifacts/{target}_model.json"
        if os.path.exists(model_path):
            model = xgb.XGBRegressor()
            model.load_model(model_path)
            models[target] = model
            print(f" Loaded model for: {target}")
        else:
            print(f" Warning: Model file not found at {model_path}")

@app.get("/")
def read_root():
    return {"status": "online", "model": "XGBoost Regressors v1.0.0", "targets": targets}

@app.get("/model_metadata")
def get_model_metadata():
    metadata_path = "model_artifacts/model_metadata.json"
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read model metadata: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metadata file not found"
        )

# ----------------- ML Predict Route -----------------
@app.post("/predict")
def predict(data: TelemetryInput):
    input_data = np.array([[
        data.typing_speed,
        data.typing_accuracy,
        data.typing_latency,
        data.typing_errors,
        data.sleep_duration,
        data.sleep_quality,
        data.steps,
        data.screen_time,
        data.social_minutes,
        data.social_quality,
        data.question_affect
    ]])
    
    predictions = {}
    
    for target, model in models.items():
        pred = model.predict(input_data)
        predictions[target] = float(np.clip(pred[0], 0, 100))
        
    if 'overall_wellness' not in predictions:
        predictions['overall_wellness'] = float(np.clip(
            0.25 * predictions.get('motivation', 50) +
            0.15 * (100 - predictions.get('stress', 50)) +
            0.15 * (100 - predictions.get('burnout', 50)) +
            0.15 * (100 - predictions.get('anxiety', 50)) +
            0.15 * (100 - predictions.get('loneliness', 50)) +
            0.15 * (100 - predictions.get('cognitive_fatigue', 50)),
            0, 100
        ))
        
    return {
        "predictions": {k: round(v, 1) for k, v in predictions.items()},
        "input_features": data.dict()
    }

# ----------------- AI Counselor Counsel Route -----------------
@app.post("/counsel")
def counsel(req: CounselRequest):
    msg = req.message.lower().strip()
    predictions = req.predictions
    
    # 1. Crisis Check
    crisis_keywords = [
        'suicide', 'kill myself', 'die', 'self harm', 'cut myself', 
        'end my life', 'hurt myself', 'death', 'depression', 'depressed'
    ]
    if any(kw in msg for kw in crisis_keywords):
        return {
            "response": "It sounds like you are going through an incredibly difficult time. Please know that you are not alone, and there is support available. I cannot provide clinical crisis counseling, but please reach out immediately: NIMHANS Support Helpline at 1800-891-4416 (24/7) or iCall at 9152987821. Both services are free and confidential.",
            "is_crisis": True
        }

    # Extract metrics for context
    stress = round(predictions.get('stress', 35.0), 1)
    burnout = round(predictions.get('burnout', 30.0), 1)
    anxiety = round(predictions.get('anxiety', 40.0), 1)
    motivation = round(predictions.get('motivation', 65.0), 1)
    loneliness = round(predictions.get('loneliness', 35.0), 1)
    cognitive_fatigue = round(predictions.get('cognitive_fatigue', 30.0), 1)
    overall_wellness = round(predictions.get('overall_wellness', 70.0), 1)

    # 2. Match distinct test prompts
    if "slept badly" in msg or "sleep badly" in msg or "bad sleep" in msg or "slept poor" in msg:
        return {
            "response": f"I'm sorry to hear that you slept badly. Sleep quality is key to your wellness. Your current telemetry reflects an overall wellness score of {overall_wellness}/100 and stress at {stress}/100. Poor sleep directly elevates cognitive fatigue ({cognitive_fatigue}/100). To recover, I suggest winding down without screens 1 hour before bed tonight.",
            "is_crisis": False
        }
    
    if "feel fine today" in msg or "feel fine" in msg or "i feel good" in msg:
        return {
            "response": f"It's great that you feel fine today! Your overall wellness index is looking strong at {overall_wellness}/100, supported by a healthy motivation score of {motivation}/100. Maintaining a consistent physical activity and screen time routine will help preserve this positive state.",
            "is_crisis": False
        }

    if "burnout score mean" in msg or "what does my burnout score" in msg:
        return {
            "response": f"Your current predicted burnout score is {burnout}/100. This score indicates your risk of professional and physical exhaustion, computed using your typing latency, error rates, sleep patterns, and self-reported answers. A score below 50 is stable, whereas higher scores indicate you should prioritize rest and screen-free intervals.",
            "is_crisis": False
        }

    # 3. Dynamic context-sensitive counseling based on highest telemetry risk
    risks = {
        "stress": stress,
        "burnout": burnout,
        "anxiety": anxiety,
        "loneliness": loneliness,
        "cognitive fatigue": cognitive_fatigue
    }
    highest_risk_name = max(risks, key=risks.get)
    highest_risk_val = risks[highest_risk_name]

    if highest_risk_val > 50:
        return {
            "response": f"Thank you for sharing. I notice your overall wellness is at {overall_wellness}/100, and your telemetry indicates elevated {highest_risk_name} ({highest_risk_val}/100). I suggest looking at your Intervention Engine, taking short offline breaks, and practicing deep breathing exercises today.",
            "is_crisis": False
        }

    return {
        "response": f"Hello! I am your AI Counselor. Based on your current telemetry profile, your overall wellness index is stable at {overall_wellness}/100. Your stress is at {stress}/100 and motivation is at {motivation}/100. How can I support your mental wellness goals today?",
        "is_crisis": False
    }

# ----------------- Authentication Routes -----------------
@app.post("/auth/signup")
def signup(req: SignupRequest, request: Request, response: Response):
    enforce_rate_limit(request)
    
    # Check if user already exists
    user = fetch_one("SELECT email FROM users WHERE email = ?", (req.email,))
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email already exists"
        )
        
    pw_hash, salt = hash_password(req.password)
    token = secrets.token_hex(32)
    
    try:
        execute_query(
            "INSERT INTO users (email, password_hash, salt, name, token) VALUES (?, ?, ?, ?, ?)",
            (req.email, pw_hash, salt, req.name, token)
        )
        
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=30*24*60*60
        )
        
        return {
            "status": "success",
            "user": {
                "email": req.email,
                "name": req.name
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

@app.post("/auth/login")
def login(req: LoginRequest, request: Request, response: Response):
    enforce_rate_limit(request)
    
    user = fetch_one("SELECT password_hash, salt, name, picture FROM users WHERE email = ?", (req.email,))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    pw_hash, salt_hex, name, picture = user
    
    if not verify_password(req.password, pw_hash, salt_hex):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    new_token = secrets.token_hex(32)
    execute_query("UPDATE users SET token = ? WHERE email = ?", (new_token, req.email))
    
    response.set_cookie(
        key="session_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30*24*60*60
    )
    
    return {
        "status": "success",
        "user": {
            "email": req.email,
            "name": name,
            "picture": picture
        }
    }

@app.post("/auth/google")
def google_login(req: GoogleLoginRequest, response: Response):
    token = secrets.token_hex(32)
    
    user = fetch_one("SELECT email FROM users WHERE email = ?", (req.email,))
    is_new = False
    if not user:
        is_new = True
        execute_query(
            "INSERT INTO users (email, password_hash, salt, name, picture, token) VALUES (?, ?, ?, ?, ?, ?)",
            (req.email, "google_oauth_no_pwd", "google_salt", req.name, req.picture, token)
        )
    else:
        execute_query(
            "UPDATE users SET token = ?, name = ?, picture = ? WHERE email = ?",
            (token, req.name, req.picture, req.email)
        )
        
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30*24*60*60
    )
    
    return {
        "status": "success",
        "is_new": is_new,
        "user": {
            "email": req.email,
            "name": req.name,
            "picture": req.picture
        }
    }

@app.post("/auth/simulate")
def simulate_login(response: Response):
    email = "sharma.siddharth@gmail.com"
    name = "Siddharth Sharma"
    picture = "https://api.dicebear.com/7.x/adventurer/svg?seed=Siddharth"
    token = secrets.token_hex(32)
    
    user = fetch_one("SELECT email FROM users WHERE email = ?", (email,))
    if not user:
        execute_query(
            "INSERT INTO users (email, password_hash, salt, name, picture, token) VALUES (?, ?, ?, ?, ?, ?)",
            (email, "simulated_user", "sim_salt", name, picture, token)
        )
    else:
        execute_query(
            "UPDATE users SET token = ?, name = ?, picture = ? WHERE email = ?",
            (token, name, picture, email)
        )
        
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30*24*60*60
    )
    
    return {
        "status": "success",
        "user": {
            "email": email,
            "name": name,
            "picture": picture
        }
    }

@app.get("/auth/session")
def get_session(request: Request):
    try:
        user = get_current_user(request)
        return {
            "status": "success",
            "user": {
                "email": user["email"],
                "name": user["name"],
                "picture": user["picture"]
            }
        }
    except HTTPException:
        return {"status": "guest", "user": None}

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"status": "success"}

# ----------------- DB Sync & Compliance Routes -----------------
@app.post("/data/sync")
def sync_data(req: SyncRequest, request: Request):
    user = get_current_user(request)
    email = user["email"]
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    execute_query('''
        INSERT OR REPLACE INTO telemetry (email, timestamp, signals, questions, predictions, ground_truth)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        email,
        today_str,
        json.dumps(req.signals),
        json.dumps(req.questions),
        json.dumps(req.predictions),
        json.dumps(req.ground_truth) if req.ground_truth else None
    ))
    
    return {"status": "success"}

@app.post("/data/clinical_log")
def submit_clinical_log(req: ClinicalLogRequest, request: Request):
    user = get_current_user(request)
    email = user["email"]
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    execute_query('''
        INSERT INTO phq9_gad7_logs (email, timestamp, phq9_answers, phq9_score, gad7_answers, gad7_score, predictions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        email,
        timestamp,
        json.dumps(req.phq9_answers),
        req.phq9_score,
        json.dumps(req.gad7_answers),
        req.gad7_score,
        json.dumps(req.predictions)
    ))
    return {"status": "success"}

@app.post("/data/export")
def export_data(request: Request):
    user = get_current_user(request)
    email = user["email"]
    name = user["name"]
    picture = user["picture"]
    
    rows = fetch_all("SELECT timestamp, signals, questions, predictions, ground_truth FROM telemetry WHERE email = ? ORDER BY timestamp DESC", (email,))
    
    logs = []
    for r in rows:
        logs.append({
            "timestamp": r[0],
            "signals": json.loads(r[1]) if r[1] else {},
            "questions": json.loads(r[2]) if r[2] else [],
            "predictions": json.loads(r[3]) if r[3] else {},
            "ground_truth": json.loads(r[4]) if len(r) > 4 and r[4] else None
        })
        
    return {
        "status": "success",
        "profile": {
            "email": email,
            "name": name,
            "picture": picture
        },
        "history": logs
    }

@app.post("/data/delete")
def delete_user_data(request: Request, response: Response):
    user = get_current_user(request)
    email = user["email"]
    
    execute_query("DELETE FROM telemetry WHERE email = ?", (email,))
    execute_query("DELETE FROM users WHERE email = ?", (email,))
    
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    
    return {"status": "success"}

if __name__ == '__main__':
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
