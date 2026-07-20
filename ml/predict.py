"""
AI-Powered Appointment Assistant - Prediction Utilities

Utility module for loading models and making predictions.
Can be imported by other Python modules.
"""

import joblib
import os
import string

MODEL_PATH = 'models/model.pkl'
VECTORIZER_PATH = 'models/vectorizer.pkl'

class SymptomPredictor:
    """Wrapper class for symptom-based specialization prediction."""
    
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.load_models()
    
    def load_models(self):
        """Load the trained model and vectorizer."""
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            raise FileNotFoundError(
                "Model files not found. Please run 'python train.py' first."
            )
        
        self.model = joblib.load(MODEL_PATH)
        self.vectorizer = joblib.load(VECTORIZER_PATH)
    
    def preprocess_text(self, text):
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
    
    def predict(self, symptoms):
        """
        Predict specialization from symptoms.
        
        Args:
            symptoms (str): Patient symptom description
        
        Returns:
            dict: {
                'specialization': str,
                'confidence': float,
                'top_predictions': list of dicts
            }
        """
        # Preprocess
        clean_symptoms = self.preprocess_text(symptoms)
        
        # Vectorize
        symptoms_tfidf = self.vectorizer.transform([clean_symptoms])
        
        # Predict
        specialization = self.model.predict(symptoms_tfidf)[0]
        confidence = float(self.model.predict_proba(symptoms_tfidf).max())
        
        # Get top 3 predictions
        all_proba = self.model.predict_proba(symptoms_tfidf)[0]
        top_3_indices = all_proba.argsort()[-3:][::-1]
        top_3_predictions = [
            {
                'specialization': self.model.classes_[idx],
                'confidence': float(all_proba[idx])
            }
            for idx in top_3_indices
        ]
        
        return {
            'specialization': specialization,
            'confidence': confidence,
            'top_predictions': top_3_predictions
        }


# Standalone function for quick predictions
def predict_specialization(symptoms):
    """
    Quick prediction function.
    
    Args:
        symptoms (str): Patient symptom description
    
    Returns:
        dict: Prediction results
    """
    predictor = SymptomPredictor()
    return predictor.predict(symptoms)


# CLI for testing
if __name__ == "__main__":
    print("\n" + "="*60)
    print("AI-POWERED APPOINTMENT ASSISTANT - PREDICTION TEST")
    print("="*60)
    
    predictor = SymptomPredictor()
    
    test_symptoms = [
        "I have severe chest pain and shortness of breath",
        "My skin is itchy and has red rashes",
        "I experience frequent headaches and dizziness",
        "My knee hurts when I walk",
        "My child has high fever and cough",
        "I have severe stomach pain and nausea",
    ]
    
    for symptom in test_symptoms:
        result = predictor.predict(symptom)
        print(f"\nSymptom: {symptom}")
        print(f"→ Specialization: {result['specialization']}")
        print(f"→ Confidence: {result['confidence']:.2%}")
        print(f"→ Top 3: {[p['specialization'] for p in result['top_predictions']]}")
    
    print("\n" + "="*60 + "\n")
