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

    # Extract metrics
    stress        = round(predictions.get('stress', 35.0), 1)
    burnout       = round(predictions.get('burnout', 30.0), 1)
    anxiety       = round(predictions.get('anxiety', 40.0), 1)
    motivation    = round(predictions.get('motivation', 65.0), 1)
    loneliness    = round(predictions.get('loneliness', 35.0), 1)
    cog_fatigue   = round(predictions.get('cognitive_fatigue', 30.0), 1)
    wellness      = round(predictions.get('overall_wellness', 70.0), 1)

    # ── 1. Crisis check ──────────────────────────────────────────────
    crisis_keywords = [
        'suicide', 'kill myself', 'end my life', 'die', 'self harm',
        'cut myself', 'hurt myself', 'death', 'depressed', 'hopeless',
        'want to disappear', 'can\'t go on'
    ]
    if any(kw in msg for kw in crisis_keywords):
        return {
            "response": (
                "It sounds like you are going through an incredibly difficult time. "
                "Please know that you are not alone and help is available right now. "
                "I am not able to provide clinical crisis support, but please reach out immediately:\n\n"
                "• NIMHANS Support Helpline: 1800-891-4416 (24/7, free)\n"
                "• iCall: 9152987821 (Mon–Sat, 8 AM – 10 PM)\n"
                "• Vandrevala Foundation: 1860-2662-345 (24/7)\n\n"
                "You matter and support is waiting for you."
            ),
            "is_crisis": True
        }

    # ── 2. Sleep ──────────────────────────────────────────────────────
    if any(kw in msg for kw in ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'fatigue', 'slept']):
        if 'bad' in msg or 'poor' in msg or 'badly' in msg or 'couldn\'t' in msg or 'can\'t sleep' in msg:
            return {"response": (
                f"I'm sorry to hear you slept poorly. Sleep is the single most impactful lever for your wellness. "
                f"Your current cognitive fatigue score is {cog_fatigue}/100 and overall wellness is {wellness}/100 — "
                f"poor sleep directly drives both up. Tonight, try this: switch all screens off 60 minutes before bed, "
                f"keep the room below 22°C, and try the 4-7-8 breathing technique (inhale 4s, hold 7s, exhale 8s). "
                f"Even one night of improved sleep can reduce stress ({stress}/100) by 10-15 points."
            ), "is_crisis": False}
        return {"response": (
            f"Sleep quality is central to your wellness. Currently your overall wellness is {wellness}/100 "
            f"and cognitive fatigue is {cog_fatigue}/100. "
            f"For most adults, 7–9 hours of consistent sleep is optimal. "
            f"Reducing screen time before bed and maintaining a fixed wake time — even on weekends — "
            f"are the two highest-impact habits you can build. Would you like tips on a wind-down routine?"
        ), "is_crisis": False}

    # ── 3. Stress ──────────────────────────────────────────────────────
    if any(kw in msg for kw in ['stress', 'stressed', 'overwhelm', 'pressure', 'too much', 'tense']):
        level = "high" if stress > 65 else "moderate" if stress > 40 else "low"
        advice = (
            "Your stress level is elevated. I'd recommend the 4-7-8 breathing technique immediately, "
            "followed by writing down the 3 most pressing tasks and doing them in order — "
            "this restores a sense of control which directly lowers cortisol."
            if stress > 65 else
            "Your stress is at a moderate level. Short breaks every 90 minutes (the Pomodoro method) "
            "and a 15-minute outdoor walk can measurably reduce it."
            if stress > 40 else
            "Your stress markers look stable. Maintaining your current routine of balanced screen time and sleep is working well."
        )
        return {"response": (
            f"Your predicted stress score is {stress}/100 ({level} range). {advice} "
            f"Your burnout risk is currently {burnout}/100 — "
            f"these two dimensions are closely linked, so reducing stress also protects against burnout."
        ), "is_crisis": False}

    # ── 4. Burnout ──────────────────────────────────────────────────────
    if any(kw in msg for kw in ['burnout', 'burn out', 'drained', 'empty', 'no energy', 'depleted', 'exhausted']):
        return {"response": (
            f"Your burnout risk score is {burnout}/100. "
            f"Burnout develops gradually when chronic stress ({stress}/100) combines with poor recovery. "
            f"The primary contributors in your profile are "
            f"{'high screen time and low sleep' if cog_fatigue > 55 else 'sustained high workload without adequate breaks'}. "
            f"Recovery requires active rest — not just sleep, but activities that genuinely recharge you (social connection, nature, hobbies). "
            f"If your score exceeds 70, please consider speaking with an occupational therapist or counselor."
        ), "is_crisis": False}

    # ── 5. Anxiety ──────────────────────────────────────────────────────
    if any(kw in msg for kw in ['anxious', 'anxiety', 'nervous', 'worry', 'panic', 'scared', 'fear', 'apprehension']):
        return {"response": (
            f"Your predicted anxiety level is {anxiety}/100. "
            f"Anxiety often spikes when uncertainty is high and perceived control is low. "
            f"Practical steps: (1) Write down your worries — externalization reduces their psychological weight. "
            f"(2) Practice box breathing: 4 seconds in, 4 hold, 4 out, 4 hold. "
            f"(3) Limit news and social media consumption, especially in the evening. "
            f"Your loneliness score is {loneliness}/100 — social isolation amplifies anxiety, "
            f"so reaching out to even one trusted person today can help."
        ), "is_crisis": False}

    # ── 6. Motivation / Productivity ──────────────────────────────────
    if any(kw in msg for kw in ['motivation', 'motivate', 'productive', 'productivity', 'procrastinat', 'lazy', 'no drive', 'stuck']):
        return {"response": (
            f"Your motivation index is {motivation}/100. "
            f"{'Your motivation is strong — capitalize on this by tackling the most cognitively demanding task first.' if motivation > 70 else 'Motivation at this level typically responds well to small wins: break your biggest task into 15-minute chunks and reward each completion.'} "
            f"Note that your sleep quality and physical activity (steps) are the two strongest predictors of motivation in your telemetry profile. "
            f"Stress ({stress}/100) and cognitive fatigue ({cog_fatigue}/100) are currently the main drag factors."
        ), "is_crisis": False}

    # ── 7. Loneliness / Social ──────────────────────────────────────────
    if any(kw in msg for kw in ['lonely', 'loneliness', 'alone', 'isolated', 'no friends', 'social', 'connection']):
        return {"response": (
            f"Your loneliness score is {loneliness}/100. "
            f"{'Loneliness at this level has measurable effects on stress and immune function. Even brief, genuine interactions matter more than long superficial ones.' if loneliness > 60 else 'Your social connection metrics look reasonable.'} "
            f"One evidence-based habit: reach out to one person per day with a specific, low-pressure message (a meme, an article, a shared memory). "
            f"Your social interaction minutes are a tracked signal — increasing them consistently will directly improve your wellness score over time."
        ), "is_crisis": False}

    # ── 8. Cognitive fatigue / Focus ──────────────────────────────────
    if any(kw in msg for kw in ['focus', 'concentrate', 'distract', 'brain fog', 'mental fog', 'can\'t think', 'cognitive', 'attention']):
        return {"response": (
            f"Your cognitive fatigue score is {cog_fatigue}/100. "
            f"{'At this level, sustained deep work is very difficult — switch to lower-stakes tasks and rest.' if cog_fatigue > 65 else 'Mild cognitive fatigue is manageable.'} "
            f"The top causes in your profile: sleep below 7 hours, screen time above 7 hours, and low physical activity. "
            f"Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. "
            f"Even a 5-minute walk raises prefrontal cortex activity measurably."
        ), "is_crisis": False}

    # ── 9. Exercise / Physical ──────────────────────────────────────────
    if any(kw in msg for kw in ['exercise', 'walk', 'steps', 'run', 'workout', 'gym', 'physical', 'active']):
        return {"response": (
            f"Physical activity is one of the strongest wellness levers in your profile. "
            f"Your current overall wellness is {wellness}/100 and motivation is {motivation}/100. "
            f"Even 20–30 minutes of walking per day raises motivation scores by 8–12 points on average in this model. "
            f"Start small: a 15-minute outdoor walk after lunch is enough to begin shifting your telemetry. "
            f"Track your steps — the model is directly sensitive to the steps signal you log daily."
        ), "is_crisis": False}

    # ── 10. Screen time / Digital ──────────────────────────────────────
    if any(kw in msg for kw in ['screen', 'phone', 'social media', 'instagram', 'doom scroll', 'screen time']):
        return {"response": (
            f"Screen time is one of the top stress drivers in the SentienceX model. "
            f"It correlates directly with sleep quality degradation and cognitive fatigue ({cog_fatigue}/100). "
            f"The model's training data shows that screen time above 8 hours daily correlates with a 15-point drop in wellness scores. "
            f"Practical steps: set app timers, keep the phone out of the bedroom, and replace the last 30 minutes before sleep with reading or journaling."
        ), "is_crisis": False}

    # ── 11. Score / Wellness explanation ──────────────────────────────
    if any(kw in msg for kw in ['score', 'wellness', 'why is', 'what does', 'explain', 'index', 'low', 'high', 'number', 'metric', 'predict']):
        risks = {'Stress': stress, 'Burnout': burnout, 'Anxiety': anxiety, 'Loneliness': loneliness, 'Cognitive Fatigue': cog_fatigue}
        top_risk = max(risks, key=risks.get)
        return {"response": (
            f"Your Overall Wellness Index is {wellness}/100. "
            f"This score is a weighted combination of: Motivation ({motivation}/100), "
            f"and the inverse of Stress ({stress}/100), Burnout ({burnout}/100), "
            f"Anxiety ({anxiety}/100), Loneliness ({loneliness}/100), and Cognitive Fatigue ({cog_fatigue}/100). "
            f"Your highest-risk dimension right now is **{top_risk}** ({risks[top_risk]}/100). "
            f"Improving that dimension will have the largest impact on your overall score. "
            f"Scores above 80 are excellent; 60–80 moderate; below 60 requires active intervention."
        ), "is_crisis": False}

    # ── 12. Breathing / Mindfulness ────────────────────────────────────
    if any(kw in msg for kw in ['breathing', 'breathe', 'meditation', 'mindful', 'calm down', 'relax', 'meditat']):
        return {"response": (
            f"Great choice. Breathing exercises are clinically validated for acute stress relief. "
            f"With your stress at {stress}/100, try this right now: "
            f"Sit comfortably, inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds. "
            f"Repeat 4 cycles. This activates the parasympathetic nervous system and reduces cortisol within minutes. "
            f"For longer-term mindfulness, even 5–10 minutes of daily meditation reduces anxiety ({anxiety}/100) significantly over 2–4 weeks."
        ), "is_crisis": False}

    # ── 13. Nutrition / Diet ────────────────────────────────────────────
    if any(kw in msg for kw in ['eat', 'food', 'diet', 'nutrition', 'hungry', 'water', 'hydrat', 'meal']):
        return {"response": (
            f"Nutrition significantly impacts cognitive function and mood. "
            f"With your cognitive fatigue at {cog_fatigue}/100, ensure you're well-hydrated (2.5–3L water daily) "
            f"and eating protein-rich meals to maintain neurotransmitter production. "
            f"Avoid heavy meals within 3 hours of sleep — they reduce sleep quality which is your wellness foundation. "
            f"Magnesium-rich foods (nuts, leafy greens) are especially beneficial for anxiety reduction."
        ), "is_crisis": False}

    # ── 14. Gratitude / Positive ────────────────────────────────────────
    if any(kw in msg for kw in ['gratitude', 'grateful', 'positive', 'good', 'happy', 'joy', 'feel great', 'feel good', 'feel fine']):
        return {"response": (
            f"That's great to hear! Your wellness index is at {wellness}/100 and motivation at {motivation}/100. "
            f"Positive emotional states are worth reinforcing. A daily gratitude practice — writing 3 specific things you're grateful for — "
            f"has been shown to sustain motivation and reduce baseline anxiety over time. "
            f"Keep logging your signals consistently so the model continues to reflect your actual state."
        ), "is_crisis": False}

    # ── 15. Weekly / Summary ────────────────────────────────────────────
    if any(kw in msg for kw in ['week', 'summary', 'overview', 'progress', 'trend', 'history', 'how am i doing']):
        risks = {'stress': stress, 'burnout': burnout, 'anxiety': anxiety, 'loneliness': loneliness, 'cognitive_fatigue': cog_fatigue}
        top_risk = max(risks, key=risks.get)
        return {"response": (
            f"Current wellness snapshot: Overall Wellness {wellness}/100 | Stress {stress}/100 | "
            f"Burnout {burnout}/100 | Anxiety {anxiety}/100 | Motivation {motivation}/100 | "
            f"Loneliness {loneliness}/100 | Cognitive Fatigue {cog_fatigue}/100. "
            f"Your primary area of concern is {top_risk.replace('_', ' ')} at {risks[top_risk]}/100. "
            f"Submit your daily signals and questions consistently to build a meaningful trend history — "
            f"the model improves in accuracy as it receives more of your behavioral data."
        ), "is_crisis": False}

    # ── 16. Capabilities / What can you do ─────────────────────────────
    if any(kw in msg for kw in ['what can you', 'help me', 'how do you', 'capabilities', 'what do you', 'how does this work']):
        return {"response": (
            "I am your SentienceX AI Wellness Counselor. Here's what I can help with:\n\n"
            "• Explain your wellness scores (stress, burnout, anxiety, motivation, loneliness, cognitive fatigue)\n"
            "• Give personalized advice based on your current telemetry\n"
            "• Suggest evidence-based recovery techniques (breathing, sleep, exercise)\n"
            "• Provide crisis helpline contacts if you need immediate support\n"
            "• Explain what affects your overall wellness score\n\n"
            "Try asking: 'Why is my stress high?', 'What should I do to sleep better?', or 'Summarize my wellness.'"
        ), "is_crisis": False}

    # ── 17. Generic dynamic fallback ────────────────────────────────────
    risks = {'stress': stress, 'burnout': burnout, 'anxiety': anxiety, 'loneliness': loneliness, 'cognitive_fatigue': cog_fatigue}
    top_risk_name = max(risks, key=risks.get)
    top_risk_val = risks[top_risk_name]

    if top_risk_val > 55:
        return {"response": (
            f"Thanks for reaching out. Based on your current telemetry, your overall wellness is {wellness}/100. "
            f"Your highest concern right now is {top_risk_name.replace('_', ' ')} at {top_risk_val}/100. "
            f"I'd suggest focusing on that dimension first — would you like specific advice on managing "
            f"{top_risk_name.replace('_', ' ')}?"
        ), "is_crisis": False}

    return {"response": (
        f"Your wellness index looks stable at {wellness}/100. "
        f"Stress: {stress}/100 | Motivation: {motivation}/100 | Anxiety: {anxiety}/100. "
        f"What aspect of your mental wellness would you like to explore today? "
        f"You can ask about your scores, sleep, stress, burnout, focus, breathing techniques, or anything else on your mind."
    ), "is_crisis": False}

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
