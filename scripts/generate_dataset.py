import numpy as np
import pandas as pd
import os

def generate_wellness_dataset(num_samples=50000, seed=42):
    np.random.seed(seed)
    
    # 1. Define Persona Archetypes with probabilities
    # Personas:
    # 0: Corporate Workaholic (20%)
    # 1: Active & Balanced (20%)
    # 2: Social / Extrovert (15%)
    # 3: Night Owl / Gamer (15%)
    # 4: Sedentary / Lonely / Depressed (10%)
    # 5: Average / Standard User (20%)
    
    personas = np.random.choice(
        [0, 1, 2, 3, 4, 5],
        size=num_samples,
        p=[0.20, 0.20, 0.15, 0.15, 0.10, 0.20]
    )
    
    # Day of week: 0 to 6 (5 & 6 are weekends)
    day_of_week = np.random.randint(0, 7, size=num_samples)
    
    # Initialize arrays
    sleep_duration = np.zeros(num_samples)
    sleep_quality = np.zeros(num_samples)
    steps = np.zeros(num_samples)
    screen_time = np.zeros(num_samples)
    social_minutes = np.zeros(num_samples)
    social_quality = np.zeros(num_samples)
    typing_speed = np.zeros(num_samples)
    typing_accuracy = np.zeros(num_samples)
    typing_latency = np.zeros(num_samples)
    typing_errors = np.zeros(num_samples)
    question_affect = np.zeros(num_samples)
    
    # Define parameters per persona: (mean, std)
    sleep_dur_params = {0: (5.8, 0.7), 1: (8.2, 0.4), 2: (7.0, 0.8), 3: (4.5, 0.5), 4: (5.0, 0.6), 5: (7.2, 0.9)}
    sleep_qual_params = {0: (62.0, 8.0), 1: (92.0, 3.0), 2: (73.0, 8.0), 3: (35.0, 5.0), 4: (38.0, 5.5), 5: (70.0, 9.0)}
    steps_params = {0: (3500.0, 1200.0), 1: (17000.0, 2000.0), 2: (7000.0, 2000.0), 3: (1500.0, 300.0), 4: (1200.0, 200.0), 5: (6500.0, 1800.0)}
    screen_time_params = {0: (9.5, 1.2), 1: (2.2, 0.6), 2: (6.0, 1.2), 3: (13.2, 0.8), 4: (10.0, 1.2), 5: (5.5, 1.5)}
    social_min_params = {0: (40.0, 20.0), 1: (120.0, 25.0), 2: (210.0, 50.0), 3: (30.0, 15.0), 4: (15.0, 8.0), 5: (90.0, 30.0)}
    social_qual_params = {0: (2.2, 0.6), 1: (4.7, 0.3), 2: (4.4, 0.5), 3: (1.5, 0.4), 4: (1.2, 0.3), 5: (3.2, 0.7)}
    typing_speed_params = {0: (78.0, 8.0), 1: (75.0, 5.0), 2: (70.0, 9.0), 3: (50.0, 8.0), 4: (45.0, 7.0), 5: (63.0, 8.0)}
    typing_acc_params = {0: (94.0, 2.5), 1: (96.0, 1.5), 2: (92.0, 3.5), 3: (82.0, 4.0), 4: (80.0, 4.0), 5: (92.0, 3.5)}
    typing_lat_params = {0: (105.0, 12.0), 1: (90.0, 8.0), 2: (120.0, 18.0), 3: (180.0, 15.0), 4: (200.0, 18.0), 5: (125.0, 18.0)}
    typing_err_params = {0: 2.2, 1: 0.8, 2: 2.8, 3: 5.5, 4: 4.8, 5: 2.8} # Poisson means
    question_aff_params = {0: (3.1, 0.5), 1: (4.7, 0.2), 2: (3.8, 0.5), 3: (1.8, 0.4), 4: (1.5, 0.3), 5: (3.2, 0.5)}
    
    # Generate based on personas
    for p in range(6):
        mask = (personas == p)
        n_p = np.sum(mask)
        if n_p == 0:
            continue
            
        sleep_duration[mask] = np.random.normal(sleep_dur_params[p][0], sleep_dur_params[p][1], n_p)
        sleep_quality[mask] = np.random.normal(sleep_qual_params[p][0], sleep_qual_params[p][1], n_p)
        steps[mask] = np.random.normal(steps_params[p][0], steps_params[p][1], n_p)
        screen_time[mask] = np.random.normal(screen_time_params[p][0], screen_time_params[p][1], n_p)
        social_minutes[mask] = np.random.normal(social_min_params[p][0], social_min_params[p][1], n_p)
        social_quality[mask] = np.random.normal(social_qual_params[p][0], social_qual_params[p][1], n_p)
        typing_speed[mask] = np.random.normal(typing_speed_params[p][0], typing_speed_params[p][1], n_p)
        typing_accuracy[mask] = np.random.normal(typing_acc_params[p][0], typing_acc_params[p][1], n_p)
        typing_latency[mask] = np.random.normal(typing_lat_params[p][0], typing_lat_params[p][1], n_p)
        typing_errors[mask] = np.random.poisson(typing_err_params[p], n_p)
        question_affect[mask] = np.random.normal(question_aff_params[p][0], question_aff_params[p][1], n_p)

    # 2. Apply Day of Week (Weekend) adjustments
    is_weekend = (day_of_week >= 5)
    
    # Sleep duration increase on weekends
    sleep_duration[is_weekend] += np.random.uniform(0.5, 1.5, np.sum(is_weekend))
    # Sleep quality increase on weekends
    sleep_quality[is_weekend] += np.random.uniform(3.0, 8.0, np.sum(is_weekend))
    # Steps adjust on weekends
    steps[is_weekend] += np.random.uniform(500, 2000, np.sum(is_weekend))
    # Screen time decrease on weekends (except night owls / gamers who increase it)
    is_gamer = (personas == 3)
    weekend_gamer = is_weekend & is_gamer
    weekend_other = is_weekend & (~is_gamer)
    screen_time[weekend_gamer] += np.random.uniform(0.5, 1.5, np.sum(weekend_gamer))
    screen_time[weekend_other] -= np.random.uniform(0.5, 2.5, np.sum(weekend_other))
    
    # Social minutes boost on weekends
    social_minutes[is_weekend] += np.random.uniform(20, 80, np.sum(is_weekend))
    # Social quality boost on weekends
    social_quality[is_weekend] += np.random.uniform(0.2, 0.6, np.sum(is_weekend))
    # Typing speed decrease on weekends (casual typing)
    typing_speed[is_weekend] -= np.random.uniform(5, 15, np.sum(is_weekend))
    # Typing latency increase on weekends
    typing_latency[is_weekend] += np.random.uniform(5, 15, np.sum(is_weekend))
    # Affect boost on weekends
    question_affect[is_weekend] += np.random.uniform(0.1, 0.4, np.sum(is_weekend))

    # 3. Apply Multi-variable Interdependencies (Realistic correlations)
    # A. Sleep deprivation -> higher typing latency, more errors, lower accuracy
    deprived_mask = (sleep_duration < 6.0)
    deprived_count = np.sum(deprived_mask)
    if deprived_count > 0:
        typing_latency[deprived_mask] += (6.0 - sleep_duration[deprived_mask]) * 15.0
        typing_errors[deprived_mask] += np.random.poisson(1.5, deprived_count)
        typing_accuracy[deprived_mask] -= (6.0 - sleep_duration[deprived_mask]) * 2.0

    # B. High screen time -> lower sleep quality
    high_screen_mask = (screen_time > 8.0)
    high_screen_count = np.sum(high_screen_mask)
    if high_screen_count > 0:
        sleep_quality[high_screen_mask] -= (screen_time[high_screen_mask] - 8.0) * 3.0

    # C. High steps -> higher sleep quality
    high_steps_mask = (steps > 10000)
    high_steps_count = np.sum(high_steps_mask)
    if high_steps_count > 0:
        sleep_quality[high_steps_mask] += np.minimum(10.0, (steps[high_steps_mask] - 10000) / 1000.0)

    # D. Speed-Accuracy Tradeoff: High typing speed -> slightly lower accuracy
    accuracy_penalty = np.maximum(0, (typing_speed - 65.0) * 0.15)
    typing_accuracy -= accuracy_penalty

    # E. Social Minutes vs Social Quality correlation
    low_social_mask = (social_minutes < 20.0)
    social_quality[low_social_mask] = np.maximum(1.0, social_quality[low_social_mask] - 0.8)

    # Clean & Clip features to realistic bounds
    typing_speed = np.clip(typing_speed, 25, 120)
    typing_accuracy = np.clip(typing_accuracy, 70, 100)
    typing_latency = np.clip(typing_latency, 50, 300)
    typing_errors = np.clip(typing_errors, 0, 20)
    sleep_duration = np.clip(sleep_duration, 4, 11)
    sleep_quality = np.clip(sleep_quality, 30, 100)
    steps = np.clip(steps, 1000, 22000)
    screen_time = np.clip(screen_time, 0.5, 14)
    social_minutes = np.clip(social_minutes, 0, 360)
    social_quality = np.clip(np.round(social_quality), 1, 5)
    question_affect = np.clip(question_affect, 1.0, 5.0)

    # 4. Build Targets with Non-Linear Compounds
    # Normalizing helpers
    norm_screen = (screen_time / 14.0 * 100)
    norm_latency = (typing_latency / 300.0 * 100)
    norm_sleep_dur = ((11.0 - sleep_duration) / 7.0 * 100)
    norm_social_qual = ((6.0 - social_quality) / 5.0 * 100)
    norm_affect = ((5.0 - question_affect) / 4.0 * 100)
    norm_errors = (typing_errors / 20.0 * 100)
    norm_steps = ((22000.0 - steps) / 21000.0 * 100)
    norm_social_min = ((360.0 - social_minutes) / 360.0 * 100)
    norm_sleep_qual = ((100.0 - sleep_quality) / 70.0 * 100)

    # A. Stress
    stress_base = (
        0.30 * norm_screen +
        0.20 * norm_latency +
        0.20 * norm_sleep_dur +
        0.15 * norm_social_qual +
        0.15 * norm_affect
    )
    # Compound: Workaholic pattern (high screen time & low sleep duration)
    stress_compound = np.zeros(num_samples)
    stress_compound[(screen_time > 8.5) & (sleep_duration < 6.0)] = 12.0
    
    stress = stress_base + stress_compound + np.random.normal(0, 4, num_samples)
    stress = np.clip(stress, 0, 100)

    # B. Burnout
    burnout_base = (
        0.40 * stress +
        0.20 * norm_screen +
        0.15 * norm_sleep_dur +
        0.15 * norm_errors +
        0.10 * norm_steps
    )
    # Compound: Burnout risk spikes heavily with high stress + poor sleep
    burnout_compound = np.zeros(num_samples)
    burnout_compound[(stress > 70.0) & (sleep_quality < 50.0)] = 15.0
    
    burnout = burnout_base + burnout_compound + np.random.normal(0, 4, num_samples)
    burnout = np.clip(burnout, 0, 100)

    # C. Anxiety
    anxiety_base = (
        0.40 * stress +
        0.20 * norm_latency +
        0.20 * norm_social_min +
        0.20 * norm_sleep_qual
    )
    # Compound: Low sleep quality combined with isolation (low social minutes) spikes anxiety
    anxiety_compound = np.zeros(num_samples)
    anxiety_compound[(sleep_quality < 55.0) & (social_minutes < 30.0)] = 15.0
    
    anxiety = anxiety_base + anxiety_compound + np.random.normal(0, 5, num_samples)
    anxiety = np.clip(anxiety, 0, 100)

    # D. Motivation (higher is better)
    motivation_base = (
        0.25 * (steps / 22000.0 * 100) +
        0.25 * (social_quality / 5.0 * 100) +
        0.20 * (sleep_quality / 100.0 * 100) +
        0.20 * (question_affect / 5.0 * 100) +
        0.10 * ((14.0 - screen_time) / 13.5 * 100)
    )
    # Compound: Exercise (steps > 12000) and good sleep quality (> 80) synergistically boost motivation
    motivation_compound = np.zeros(num_samples)
    motivation_compound[(steps > 12000) & (sleep_quality > 80.0)] = 10.0
    
    motivation = motivation_base + motivation_compound + np.random.normal(0, 4, num_samples)
    motivation = np.clip(motivation, 0, 100)

    # E. Loneliness
    loneliness_base = (
        0.35 * norm_social_min +
        0.35 * norm_social_qual +
        0.20 * norm_affect +
        0.10 * norm_screen
    )
    # Compound: Low social minutes + low social quality leads to severe loneliness
    loneliness_compound = np.zeros(num_samples)
    loneliness_compound[(social_minutes < 20.0) & (social_quality < 2.0)] = 18.0
    
    loneliness = loneliness_base + loneliness_compound + np.random.normal(0, 4, num_samples)
    loneliness = np.clip(loneliness, 0, 100)

    # F. Cognitive Fatigue
    cognitive_fatigue_base = (
        0.30 * norm_sleep_dur +
        0.25 * norm_errors +
        0.20 * norm_latency +
        0.15 * norm_screen +
        0.10 * norm_steps
    )
    # Compound: Low sleep duration and high screen time synergistically increase cognitive fatigue
    cognitive_fatigue_compound = np.zeros(num_samples)
    cognitive_fatigue_compound[(sleep_duration < 5.0) & (screen_time > 10.0)] = 15.0
    
    cognitive_fatigue = cognitive_fatigue_base + cognitive_fatigue_compound + np.random.normal(0, 4, num_samples)
    cognitive_fatigue = np.clip(cognitive_fatigue, 0, 100)

    # G. Overall Wellness (higher is better)
    overall_wellness_raw = (
        0.25 * motivation +
        0.15 * (100.0 - stress) +
        0.15 * (100.0 - burnout) +
        0.15 * (100.0 - anxiety) +
        0.15 * (100.0 - loneliness) +
        0.15 * (100.0 - cognitive_fatigue)
    )
    # Scale raw values to span the full [0, 100] range to prevent central limit theorem compression
    raw_min = overall_wellness_raw.min()
    raw_max = overall_wellness_raw.max()
    overall_wellness = ((overall_wellness_raw - raw_min) / (raw_max - raw_min)) * 100.0
    overall_wellness = np.clip(overall_wellness + np.random.normal(0, 1.0, num_samples), 0, 100)

    # Create DataFrame
    df = pd.DataFrame({
        'typing_speed': typing_speed,
        'typing_accuracy': typing_accuracy,
        'typing_latency': typing_latency,
        'typing_errors': typing_errors,
        'sleep_duration': sleep_duration,
        'sleep_quality': sleep_quality,
        'steps': steps,
        'screen_time': screen_time,
        'social_minutes': social_minutes,
        'social_quality': social_quality,
        'question_affect': question_affect,
        'stress': stress,
        'burnout': burnout,
        'anxiety': anxiety,
        'motivation': motivation,
        'loneliness': loneliness,
        'cognitive_fatigue': cognitive_fatigue,
        'overall_wellness': overall_wellness
    })

    # Round columns to look clean
    decimals = {
        'typing_speed': 1, 'typing_accuracy': 1, 'typing_latency': 1,
        'sleep_duration': 1, 'sleep_quality': 1, 'steps': 0, 'screen_time': 1,
        'social_minutes': 1, 'question_affect': 2,
        'stress': 1, 'burnout': 1, 'anxiety': 1, 'motivation': 1,
        'loneliness': 1, 'cognitive_fatigue': 1, 'overall_wellness': 1
    }
    df = df.round(decimals)
    
    return df

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    print("Generating advanced real-world-like dataset with 50,000 samples...")
    df = generate_wellness_dataset(num_samples=50000)
    df.to_csv('data/wellness_dataset.csv', index=False)
    print(f"Generated synthetic dataset with {len(df)} samples and saved to data/wellness_dataset.csv.")
    print(df.head())
