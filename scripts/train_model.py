import pandas as pd
import numpy as np
import os
import json
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def train_and_evaluate():
    # Ensure directories exist
    os.makedirs('model_artifacts', exist_ok=True)
    
    # Check if dataset exists
    dataset_path = 'data/wellness_dataset.csv'
    if not os.path.exists(dataset_path):
        print(f"Error: {dataset_path} does not exist. Please run generate_dataset.py first.")
        return
        
    df = pd.read_csv(dataset_path)
    
    # Define features and targets
    features = [
        'typing_speed', 'typing_accuracy', 'typing_latency', 'typing_errors',
        'sleep_duration', 'sleep_quality', 'steps', 'screen_time',
        'social_minutes', 'social_quality', 'question_affect'
    ]
    
    targets = [
        'stress', 'burnout', 'anxiety', 'motivation', 
        'loneliness', 'cognitive_fatigue', 'overall_wellness'
    ]
    
    X = df[features]
    
    # Store performance statistics and feature importances
    stats = {}
    importances = {}
    
    print("Training XGBoost Regressors...")
    
    for target in targets:
        y = df[target]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model with tuned parameters for larger data
        model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            objective='reg:squarederror'
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        preds = model.predict(X_test)
        r2 = r2_score(y_test, preds)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        
        stats[target] = {
            'r2': float(r2),
            'mae': float(mae),
            'rmse': float(rmse)
        }
        
        print(f"Target: {target:18s} | R^2: {r2:.4f} | MAE: {mae:.4f} | RMSE: {rmse:.4f}")
        
        # Save model
        model_file = f"model_artifacts/{target}_model.json"
        model.save_model(model_file)
        
        # Extract feature importances (gain-based, normalized to sum to 1.0)
        feature_importance_scores = model.feature_importances_
        feature_importance_dict = {
            features[i]: float(feature_importance_scores[i])
            for i in range(len(features))
        }
        # Sort by importance descending
        sorted_importance = dict(sorted(feature_importance_dict.items(), key=lambda item: item[1], reverse=True))
        importances[target] = sorted_importance
        
        # Calculate observed min/max of predictions across the entire dataset
        all_preds = model.predict(X)
        if 'observed_min' not in locals():
            observed_min = {}
            observed_max = {}
        observed_min[target] = float(np.min(all_preds))
        observed_max[target] = float(np.max(all_preds))
        
    # Save statistics & importances as JSON for frontend integration
    with open('model_artifacts/model_metadata.json', 'w') as f:
        json.dump({
            'features': features,
            'targets': targets,
            'metrics': stats,
            'importances': importances,
            'observed_min': observed_min,
            'observed_max': observed_max
        }, f, indent=2)
        
    # Generate MODEL_CARD.md
    generate_model_card(stats, importances, len(df))
    print("Training complete! Model artifacts and MODEL_CARD.md written to model_artifacts/")

def generate_model_card(stats, importances, num_samples):
    card_content = f"""# Model Card: SentienceX Mental Wellness Predictors

This document describes the design, training setup, and evaluation metrics for the machine learning models running in SentienceX.

## Model Details
- **Developer:** SentienceX AI Team
- **Model Date:** July 2026
- **Model Version:** v1.0.0 (MVP)
- **Model Type:** XGBoost Regressor (Gradient Boosting Trees)
- **Objective:** Regress daily behavioral telemetry and questionnaire scores into 6 clinical-adjacent wellness dimensions and 1 overall wellness index.
- **Features Used:** 11 behavioral and physiological inputs.
- **Targets Evaluated:**
  1. Stress Severity (0-100)
  2. Burnout Risk (0-100)
  3. Anxiety Level (0-100)
  4. Motivation Score (0-100)
  5. Loneliness Score (0-100)
  6. Cognitive Fatigue (0-100)
  7. Overall Wellness Index (0-100, higher is better)

---

## Intended Use
- **Primary Use Case:** Passive and active behavioral signal classification to assist in personal mental health self-tracking.
- **Out of Scope / Restrictions:** NOT clinically validated. This model must not be used as a medical diagnostic tool or as a replacement for clinical psychiatric assessment.

---

## Training Dataset
- **Size:** {num_samples} daily logs (synthetic)
- **Features Breakdown:**
  - `typing_speed` (WPM): Mean 65, Std 12
  - `typing_accuracy` (%): Mean 92, Std 5
  - `typing_latency` (ms): Mean 120, Std 25
  - `typing_errors` (count): Poisson mean 3
  - `sleep_duration` (hours): Mean 7.2, Std 1.2
  - `sleep_quality` (%): Mean 70, Std 12
  - `steps`: Mean ~15,000
  - `screen_time` (hours): Mean 5.5, Std 2.0
  - `social_minutes` (minutes): Mean 90, Std 45
  - `social_quality` (1-5): Categorical Likert
  - `question_affect` (1-5): Combined questionnaire affect score

---

## Performance Metrics (80/20 Train/Test Split)

| Target Dimension | R² (Coefficient of Determination) | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) |
|---|---|---|---|
"""
    for target, metrics in stats.items():
        card_content += f"| **{target.replace('_', ' ').title()}** | {metrics['r2']:.4f} | {metrics['mae']:.4f} | {metrics['rmse']:.4f} |\n"
        
    card_content += """
---

## Feature Importances (Top 3 Predictors per Dimension)

This data is derived from XGBoost's gain-based feature importances and is utilized by the Intelligent Intervention Engine to generate explainable recommendations.

"""
    for target, imp in importances.items():
        card_content += f"### {target.replace('_', ' ').title()}\n"
        top_3 = list(imp.items())[:3]
        for idx, (feat, score) in enumerate(top_3):
            card_content += f"{idx+1}. **{feat}** ({score:.1%})\n"
        card_content += "\n"
        
    card_content += """
---

## Caveats and Limitations
- **Synthetic Data Bias:** The model is trained on a synthetic dataset generated with mathematical correlation rules. While it models human behavior correlations (e.g. low sleep increasing stress), its predictions reflect the generative assumptions, not real clinical studies.
- **Explainability:** Feature importances represent global tree weights and should be treated as correlations rather than causal explanations.
"""
    
    with open('model_artifacts/MODEL_CARD.md', 'w') as f:
        f.write(card_content)

if __name__ == '__main__':
    train_and_evaluate()
