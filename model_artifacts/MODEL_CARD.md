# Model Card: SentienceX Mental Wellness Predictors

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
- **Size:** 50000 daily logs (synthetic)
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
| **Stress** | 0.9766 | 3.1923 | 4.0408 |
| **Burnout** | 0.9745 | 3.3943 | 4.4109 |
| **Anxiety** | 0.9600 | 3.8322 | 4.9769 |
| **Motivation** | 0.9800 | 2.8553 | 3.7467 |
| **Loneliness** | 0.9749 | 2.9807 | 3.8772 |
| **Cognitive Fatigue** | 0.9620 | 3.2718 | 4.1160 |
| **Overall Wellness** | 0.9920 | 1.9261 | 2.4305 |

---

## Feature Importances (Top 3 Predictors per Dimension)

This data is derived from XGBoost's gain-based feature importances and is utilized by the Intelligent Intervention Engine to generate explainable recommendations.

### Stress
1. **screen_time** (53.6%)
2. **sleep_duration** (15.8%)
3. **social_quality** (8.3%)

### Burnout
1. **sleep_quality** (62.4%)
2. **screen_time** (21.7%)
3. **sleep_duration** (6.2%)

### Anxiety
1. **sleep_quality** (58.7%)
2. **social_quality** (20.8%)
3. **typing_latency** (8.8%)

### Motivation
1. **social_quality** (63.8%)
2. **steps** (17.0%)
3. **sleep_quality** (13.2%)

### Loneliness
1. **social_quality** (84.9%)
2. **screen_time** (7.2%)
3. **social_minutes** (3.9%)

### Cognitive Fatigue
1. **sleep_quality** (50.6%)
2. **sleep_duration** (26.0%)
3. **steps** (8.9%)

### Overall Wellness
1. **social_quality** (45.4%)
2. **screen_time** (23.0%)
3. **sleep_quality** (11.9%)


---

## Caveats and Limitations
- **Synthetic Data Bias:** The model is trained on a synthetic dataset generated with mathematical correlation rules. While it models human behavior correlations (e.g. low sleep increasing stress), its predictions reflect the generative assumptions, not real clinical studies.
- **Explainability:** Feature importances represent global tree weights and should be treated as correlations rather than causal explanations.
