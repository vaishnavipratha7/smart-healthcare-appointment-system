"""
AI-Powered Appointment Assistant - Training Module

Generates synthetic symptom data, preprocesses text using NLP,
trains a Logistic Regression classifier, and saves model artifacts.
"""

import pandas as pd
import numpy as np
import joblib
import os
import re
import string
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# Create directories if they don't exist
os.makedirs('data', exist_ok=True)
os.makedirs('models', exist_ok=True)

# ============================================================================
# STEP 1: Generate Synthetic Training Dataset
# ============================================================================

def generate_symptom_dataset():
    """
    Generate 1000 synthetic symptom descriptions mapped to specializations.
    
    Specializations covered:
    - Cardiology
    - Dermatology
    - Neurology
    - Orthopedics
    - Pediatrics
    - Gastroenterology
    - Ophthalmology
    - ENT (Ear, Nose, Throat)
    - Psychiatry
    - General Medicine
    """
    
    # Cardiology symptoms
    cardiology_symptoms = [
        "I have chest pain when I exercise",
        "My heart beats irregularly sometimes",
        "I feel pressure in my chest",
        "I get short of breath while climbing stairs",
        "I have pain in my left arm and chest",
        "I experience palpitations and dizziness",
        "My heart rate is very fast",
        "I have high blood pressure symptoms",
        "I feel tightness in my chest area",
        "I get breathless even at rest",
        "I have swelling in my ankles and feet",
        "I experience chest discomfort after eating",
        "My pulse is irregular and rapid",
        "I have pain radiating to my jaw",
        "I feel fatigued and have chest pressure",
        "I have difficulty breathing when lying down",
        "My legs swell and I feel chest tightness",
        "I experience rapid heartbeat and sweating",
        "I have chest pain that worsens with activity",
        "I feel dizzy and my heart races",
    ]
    
    # Dermatology symptoms
    dermatology_symptoms = [
        "I have itchy skin and rashes",
        "My skin is very dry and flaky",
        "I have red patches on my arms",
        "I notice acne breakouts on my face",
        "I have a skin rash that won't go away",
        "My skin is peeling and irritated",
        "I have small bumps on my skin",
        "I notice dark spots on my face",
        "I have hives and itching all over",
        "My skin feels hot and inflamed",
        "I have painful blisters on my body",
        "I notice unusual moles on my skin",
        "I have eczema on my hands",
        "My scalp is itchy and flaky",
        "I have psoriasis patches",
        "I experience severe acne and scarring",
        "I have skin discoloration and pigmentation",
        "My skin is sensitive and burns easily",
        "I have fungal infection on my feet",
        "I notice warts on my hands",
    ]
    
    # Neurology symptoms
    neurology_symptoms = [
        "I have frequent severe headaches",
        "I experience dizziness and vertigo",
        "I have numbness in my hands and feet",
        "I suffer from migraines regularly",
        "I have tremors in my hands",
        "I experience memory loss and confusion",
        "I have trouble with balance and coordination",
        "I get seizures occasionally",
        "I have tingling sensations in my limbs",
        "I experience chronic headaches and light sensitivity",
        "I have weakness on one side of my body",
        "I suffer from persistent dizziness",
        "I have difficulty speaking clearly",
        "I experience vision problems and headaches",
        "I have nerve pain in my legs",
        "I suffer from chronic migraines with aura",
        "I have muscle weakness and fatigue",
        "I experience blackouts and confusion",
        "I have severe head pain and nausea",
        "I notice hand tremors and stiffness",
    ]
    
    # Orthopedics symptoms
    orthopedics_symptoms = [
        "I have knee pain when walking",
        "My back hurts constantly",
        "I have joint pain in my shoulders",
        "I experience lower back pain",
        "My ankle is swollen and painful",
        "I have arthritis in my hands",
        "I feel stiffness in my joints",
        "I have neck pain and limited movement",
        "I experience hip pain while sitting",
        "I have pain in my wrist and fingers",
        "My spine hurts when I bend",
        "I have shoulder pain and can't lift my arm",
        "I twisted my ankle and it's very painful",
        "I have chronic lower back ache",
        "My knees crack and hurt when climbing stairs",
        "I have elbow pain and stiffness",
        "I suffer from sciatica and leg pain",
        "I have sports injury in my knee",
        "My joints are swollen and inflamed",
        "I have heel pain and can't walk properly",
    ]
    
    # Pediatrics symptoms
    pediatrics_symptoms = [
        "My child has high fever and cough",
        "My baby is not feeding well",
        "My child has rash all over the body",
        "My toddler has diarrhea and vomiting",
        "My child complains of ear pain",
        "My baby has trouble breathing",
        "My child has developmental delays",
        "My child has persistent cough and cold",
        "My baby cries constantly and won't sleep",
        "My child has stomach pain and fever",
        "My toddler has skin rashes and itching",
        "My child is not gaining weight properly",
        "My baby has jaundice symptoms",
        "My child has allergies and sneezing",
        "My toddler has frequent infections",
        "My child refuses to eat anything",
        "My baby has colic and gas problems",
        "My child has chicken pox symptoms",
        "My toddler has diaper rash",
        "My child has asthma and wheezing",
    ]
    
    # Gastroenterology symptoms
    gastroenterology_symptoms = [
        "I have severe stomach pain",
        "I experience acid reflux and heartburn",
        "I have chronic constipation",
        "I suffer from diarrhea frequently",
        "I have abdominal bloating and gas",
        "I experience nausea and vomiting",
        "I have blood in my stool",
        "I feel burning sensation in my stomach",
        "I have difficulty swallowing food",
        "I experience indigestion after eating",
        "I have irritable bowel syndrome symptoms",
        "I suffer from chronic stomach ulcers",
        "I have persistent abdominal cramps",
        "I experience loss of appetite and nausea",
        "I have gallbladder pain after meals",
        "I suffer from chronic acid reflux",
        "I have liver problems and jaundice",
        "I experience frequent stomach upset",
        "I have inflammatory bowel disease",
        "I suffer from food intolerance issues",
    ]
    
    # Ophthalmology symptoms
    ophthalmology_symptoms = [
        "I have blurry vision",
        "My eyes are red and itchy",
        "I experience eye pain and sensitivity",
        "I have double vision problems",
        "I see floaters in my vision",
        "I have dry eyes and discomfort",
        "I notice halos around lights",
        "I have watery eyes constantly",
        "I experience sudden vision loss",
        "I have eye strain and headaches",
        "I notice yellow discharge from my eyes",
        "I have difficulty seeing at night",
        "I experience burning sensation in eyes",
        "I have cataracts affecting my vision",
        "I notice dark spots in my vision",
        "I have swollen eyelids and pain",
        "I experience light sensitivity and pain",
        "I have pink eye symptoms",
        "I notice gradual vision deterioration",
        "I have pressure in my eyes",
    ]
    
    # ENT (Ear, Nose, Throat) symptoms
    ent_symptoms = [
        "I have ear pain and hearing loss",
        "I have chronic sore throat",
        "I experience ringing in my ears",
        "I have nasal congestion and sinusitis",
        "I have difficulty hearing",
        "I experience frequent nosebleeds",
        "I have throat infection and fever",
        "I suffer from tonsillitis",
        "I have voice hoarseness",
        "I experience vertigo and ear problems",
        "I have sinus pressure and headache",
        "I suffer from chronic allergic rhinitis",
        "I have ear discharge and pain",
        "I experience difficulty swallowing",
        "I have swollen lymph nodes in neck",
        "I suffer from sleep apnea symptoms",
        "I have persistent cough and throat irritation",
        "I experience loss of smell and taste",
        "I have ear infection symptoms",
        "I suffer from chronic sinusitis",
    ]
    
    # Psychiatry symptoms
    psychiatry_symptoms = [
        "I feel depressed and hopeless",
        "I have severe anxiety attacks",
        "I can't sleep at night",
        "I have panic attacks frequently",
        "I experience mood swings",
        "I have difficulty concentrating",
        "I feel stressed all the time",
        "I have obsessive thoughts",
        "I experience social anxiety",
        "I have trouble managing anger",
        "I feel extremely anxious in public",
        "I have post-traumatic stress symptoms",
        "I experience chronic fatigue and sadness",
        "I have bipolar disorder symptoms",
        "I suffer from severe insomnia",
        "I experience hallucinations and delusions",
        "I have eating disorder symptoms",
        "I feel suicidal thoughts",
        "I have attention deficit symptoms",
        "I experience phobias and fears",
    ]
    
    # General Medicine symptoms
    general_medicine_symptoms = [
        "I have general body weakness",
        "I experience fever and chills",
        "I have persistent cough and cold",
        "I feel tired all the time",
        "I have flu-like symptoms",
        "I experience unexplained weight loss",
        "I have thyroid problems",
        "I suffer from diabetes symptoms",
        "I have high blood sugar levels",
        "I experience frequent urination",
        "I have vitamin deficiency symptoms",
        "I suffer from chronic fatigue",
        "I have anemia and weakness",
        "I experience dehydration symptoms",
        "I have viral infection symptoms",
        "I suffer from chronic pain",
        "I have hormonal imbalance issues",
        "I experience malaise and body aches",
        "I have respiratory infection",
        "I suffer from metabolic syndrome",
    ]
    
    # Create dataset by combining all symptoms with their specializations
    dataset = []
    
    # Add variations and duplicates to reach 1000 examples
    specializations_data = [
        (cardiology_symptoms, 'Cardiology'),
        (dermatology_symptoms, 'Dermatology'),
        (neurology_symptoms, 'Neurology'),
        (orthopedics_symptoms, 'Orthopedics'),
        (pediatrics_symptoms, 'Pediatrics'),
        (gastroenterology_symptoms, 'Gastroenterology'),
        (ophthalmology_symptoms, 'Ophthalmology'),
        (ent_symptoms, 'ENT'),
        (psychiatry_symptoms, 'Psychiatry'),
        (general_medicine_symptoms, 'General Medicine'),
    ]
    
    # Add all base examples
    for symptoms_list, specialization in specializations_data:
        for symptom in symptoms_list:
            dataset.append({
                'symptom': symptom,
                'specialization': specialization
            })
    
    # Create variations to reach 1000 examples
    variations = [
        lambda s: s.replace("I have", "I am experiencing"),
        lambda s: s.replace("I have", "I suffer from"),
        lambda s: s.replace("I feel", "I am feeling"),
        lambda s: s.replace("My", "I notice my"),
        lambda s: s + " for several days",
        lambda s: s + " and it's getting worse",
    ]
    
    original_count = len(dataset)
    current_count = original_count
    
    # Add variations until we reach 1000 examples
    import random
    while current_count < 1000:
        # Randomly pick an original example
        idx = random.randint(0, original_count - 1)
        original = dataset[idx]
        
        # Apply a random variation
        variation_func = random.choice(variations)
        new_symptom = variation_func(original['symptom'])
        
        dataset.append({
            'symptom': new_symptom,
            'specialization': original['specialization']
        })
        current_count += 1
    
    # Convert to DataFrame
    df = pd.DataFrame(dataset)
    
    # Shuffle the dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Save to CSV
    df.to_csv('data/symptoms_dataset.csv', index=False)
    print(f"✓ Generated {len(df)} symptom examples")
    print(f"✓ Saved to data/symptoms_dataset.csv")
    print(f"\nSpecialization distribution:")
    print(df['specialization'].value_counts())
    
    return df


# ============================================================================
# STEP 2: Text Preprocessing
# ============================================================================

def preprocess_text(text):
    """
    Preprocess symptom text:
    1. Convert to lowercase
    2. Remove punctuation
    3. Remove extra whitespace
    """
    # Lowercase
    text = text.lower()
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


# ============================================================================
# STEP 3: Train Model
# ============================================================================

def train_model(df):
    """
    Train Logistic Regression classifier with TF-IDF features.
    """
    print("\n" + "="*60)
    print("TRAINING MODEL")
    print("="*60)
    
    # Preprocess all symptom texts
    df['symptom_clean'] = df['symptom'].apply(preprocess_text)
    
    # Prepare features and labels
    X = df['symptom_clean']
    y = df['specialization']
    
    # Split into train and test sets (80-20 split)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nTraining set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    # Create TF-IDF vectorizer
    # Remove common English stopwords, use 1-2 word n-grams
    vectorizer = TfidfVectorizer(
        max_features=500,
        ngram_range=(1, 2),
        stop_words='english'
    )
    
    # Fit and transform training data
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    
    print(f"TF-IDF feature dimensions: {X_train_tfidf.shape}")
    
    # Train Logistic Regression classifier
    model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        multi_class='multinomial',
        solver='lbfgs'
    )
    
    print("\nTraining Logistic Regression model...")
    model.fit(X_train_tfidf, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_tfidf)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    
    # Print evaluation results
    print("\n" + "="*60)
    print("MODEL EVALUATION RESULTS")
    print("="*60)
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(y_test, y_pred))
    
    # Save model and vectorizer
    joblib.dump(model, 'models/model.pkl')
    joblib.dump(vectorizer, 'models/vectorizer.pkl')
    
    print("\n✓ Model saved to models/model.pkl")
    print("✓ Vectorizer saved to models/vectorizer.pkl")
    
    return model, vectorizer


# ============================================================================
# STEP 4: Test Predictions
# ============================================================================

def test_predictions(model, vectorizer):
    """
    Test the model with sample symptoms.
    """
    print("\n" + "="*60)
    print("TESTING PREDICTIONS")
    print("="*60)
    
    test_symptoms = [
        "I have severe chest pain and shortness of breath",
        "My skin is itchy and has red rashes",
        "I experience frequent headaches and dizziness",
        "My knee hurts when I walk",
        "My child has high fever and cough",
        "I have severe stomach pain and nausea",
        "My vision is blurry and I see floaters",
        "I have ear pain and hearing problems",
        "I feel depressed and anxious all the time",
        "I have general weakness and fever"
    ]
    
    for symptom in test_symptoms:
        # Preprocess
        clean_symptom = preprocess_text(symptom)
        
        # Vectorize
        symptom_tfidf = vectorizer.transform([clean_symptom])
        
        # Predict
        prediction = model.predict(symptom_tfidf)[0]
        confidence = model.predict_proba(symptom_tfidf).max()
        
        print(f"\nSymptom: {symptom}")
        print(f"→ Specialization: {prediction}")
        print(f"→ Confidence: {confidence:.2%}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("AI-POWERED APPOINTMENT ASSISTANT - TRAINING")
    print("="*60)
    
    # Step 1: Generate dataset
    print("\nStep 1: Generating synthetic symptom dataset...")
    df = generate_symptom_dataset()
    
    # Step 2 & 3: Preprocess and train
    print("\nStep 2: Preprocessing text and training model...")
    model, vectorizer = train_model(df)
    
    # Step 4: Test predictions
    test_predictions(model, vectorizer)
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Run 'python app.py' to start the Flask API")
    print("2. Test the API with POST requests to http://localhost:5001/predict")
    print("\n")
