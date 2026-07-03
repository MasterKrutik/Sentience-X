import modelMetadata from '../../model_artifacts/model_metadata.json';
import { API_BASE_URL } from './config';

let cachedMetadata: any = modelMetadata;

if (typeof window !== 'undefined') {
  try {
    const local = window.localStorage.getItem('sentiencex_cached_metadata');
    if (local) {
      cachedMetadata = JSON.parse(local);
    }
  } catch (e) {
    console.error("Failed to load cached metadata from localStorage", e);
  }
}

export async function fetchAndCacheMetadata(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/model_metadata`);
    if (response.ok) {
      const data = await response.json();
      cachedMetadata = data;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sentiencex_cached_metadata', JSON.stringify(data));
      }
      console.log("Model metadata synchronized at runtime from server.");
    }
  } catch (err) {
    console.log("FastAPI backend offline, using cached or bundled model metadata.");
  }
}

export interface WellnessSignals {
  typing_speed: number;      // 25 - 120 WPM
  typing_accuracy: number;   // 70 - 100 %
  typing_latency: number;    // 50 - 300 ms
  typing_errors: number;     // 0 - 20
  sleep_duration: number;    // 4 - 11 hours
  sleep_quality: number;     // 30 - 100 %
  steps: number;             // 1000 - 22000
  screen_time: number;       // 0.5 - 14 hours
  social_minutes: number;    // 0 - 360 mins
  social_quality: number;    // 1 - 5 Likert
}

export interface PredictionResult {
  predictions: {
    stress: number;
    burnout: number;
    anxiety: number;
    motivation: number;
    loneliness: number;
    cognitive_fatigue: number;
    overall_wellness: number;
  };
  source: 'xgboost_server' | 'local_approx';
}

const BACKEND_URL = `${API_BASE_URL}/predict`;

/**
 * Gets wellness predictions from the FastAPI server,
 * falling back to local client-side inference if the server is down.
 */
export async function getWellnessPredictions(
  signals: WellnessSignals,
  questionAffect: number // 1.0 to 5.0
): Promise<PredictionResult> {
  const payload = {
    ...signals,
    question_affect: questionAffect
  };

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2s timeout for fast response

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(id);

    if (response.ok) {
      const data = await response.json();
      return {
        predictions: data.predictions,
        source: 'xgboost_server'
      };
    }
  } catch (err) {
    console.log("FastAPI backend is offline, running local client-side prediction fallback.");
  }

  // Fallback local client-side approximation matching the trained XGBoost correlations
  return {
    predictions: calculateLocalPredictions(signals, questionAffect),
    source: 'local_approx'
  };
}

/**
 * Normalizes a telemetry signal to a [0, 100] scale, inverting the direction
 * based on whether we are predicting a positive wellness target (e.g. Motivation)
 * or a negative distress target (e.g. Stress).
 */
function getNormalizedFeature(featName: string, signals: WellnessSignals, questionAffect: number, isPositiveTarget: boolean): number {
  switch (featName) {
    case 'typing_speed':
      // 25 to 120 WPM. Higher is better (positive correlation with wellness)
      return isPositiveTarget 
        ? ((signals.typing_speed - 25) / 95) * 100 
        : ((120 - signals.typing_speed) / 95) * 100;
    case 'typing_accuracy':
      // 70 to 100 %. Higher is better
      return isPositiveTarget 
        ? ((signals.typing_accuracy - 70) / 30) * 100 
        : ((100 - signals.typing_accuracy) / 30) * 100;
    case 'typing_latency':
      // 50 to 300 ms. Lower is better (negative correlation with wellness)
      return isPositiveTarget 
        ? ((300 - signals.typing_latency) / 250) * 100 
        : ((signals.typing_latency - 50) / 250) * 100;
    case 'typing_errors':
      // 0 to 20. Lower is better
      return isPositiveTarget 
        ? ((20 - signals.typing_errors) / 20) * 100 
        : (signals.typing_errors / 20) * 100;
    case 'sleep_duration':
      // 4 to 11 hours. Higher is better
      return isPositiveTarget 
        ? ((signals.sleep_duration - 4) / 7) * 100 
        : ((11 - signals.sleep_duration) / 7) * 100;
    case 'sleep_quality':
      // 30 to 100 %. Higher is better
      return isPositiveTarget 
        ? ((signals.sleep_quality - 30) / 70) * 100 
        : ((100 - signals.sleep_quality) / 70) * 100;
    case 'steps':
      // 1000 to 22000. Higher is better
      return isPositiveTarget 
        ? ((signals.steps - 1000) / 21000) * 100 
        : ((22000 - signals.steps) / 21000) * 100;
    case 'screen_time':
      // 0.5 to 14 hours. Lower is better
      return isPositiveTarget 
        ? ((14 - signals.screen_time) / 13.5) * 100 
        : ((signals.screen_time - 0.5) / 13.5) * 100;
    case 'social_minutes':
      // 0 to 360 mins. Higher is better
      return isPositiveTarget 
        ? (signals.social_minutes / 360) * 100 
        : ((360 - signals.social_minutes) / 360) * 100;
    case 'social_quality':
      // 1 to 5. Higher is better
      return isPositiveTarget 
        ? ((signals.social_quality - 1) / 4) * 100 
        : ((5 - signals.social_quality) / 4) * 100;
    case 'question_affect':
      // 1 to 5. Higher is better
      return isPositiveTarget 
        ? ((questionAffect - 1) / 4) * 100 
        : ((5 - questionAffect) / 4) * 100;
    default:
      return 50;
  }
}

/**
 * Math approximation of the XGBoost regressors using dynamic feature importances
 */
function calculateLocalPredictions(signals: WellnessSignals, questionAffect: number) {
  const roundTo1 = (num: number) => Math.round(num * 10) / 10;
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const importances = (cachedMetadata?.importances || modelMetadata.importances) as Record<string, Record<string, number>>;
  
  const getPredictTarget = (targetName: string): number => {
    const targetImp = importances[targetName];
    if (!targetImp) return 50;
    
    const isPositiveTarget = targetName === 'motivation' || targetName === 'overall_wellness';
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [feat, weight] of Object.entries(targetImp)) {
      const normVal = getNormalizedFeature(feat, signals, questionAffect, isPositiveTarget);
      weightedSum += normVal * weight;
      totalWeight += weight;
    }
    
    const rawVal = totalWeight > 0 ? weightedSum / totalWeight : 50;
    
    const observed_min = cachedMetadata?.observed_min?.[targetName] ?? (modelMetadata as any).observed_min?.[targetName] ?? 0;
    const observed_max = cachedMetadata?.observed_max?.[targetName] ?? (modelMetadata as any).observed_max?.[targetName] ?? 100;
    
    if (observed_max - observed_min > 0) {
      const normalized_score = clamp(((rawVal - observed_min) / (observed_max - observed_min)) * 100, 0, 100);
      return roundTo1(normalized_score);
    }
    
    return roundTo1(clamp(rawVal, 0, 100));
  };

  return {
    stress: getPredictTarget('stress'),
    burnout: getPredictTarget('burnout'),
    anxiety: getPredictTarget('anxiety'),
    motivation: getPredictTarget('motivation'),
    loneliness: getPredictTarget('loneliness'),
    cognitive_fatigue: getPredictTarget('cognitive_fatigue'),
    overall_wellness: getPredictTarget('overall_wellness')
  };
}
