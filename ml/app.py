"""
AI-Powered Appointment Assistant - Flask API Service

Exposes a REST API endpoint for symptom-based specialization prediction.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import string

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Load model and vectorizer at startup
MODEL_PATH = 'models/model.pkl'
VECTORIZER_PATH = 'models/vectorizer.pkl'

model = None
vectorizer = None

def load_models():
    """Load the trained model and vectorizer."""
    global model, vectorizer
    
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        raise FileNotFoundError(
            "Model files not found. Please run 'python train.py' first."
        )
    
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✓ Model and vectorizer loaded successfully")

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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Appointment Assistant',
        'model_loaded': model is not None and vectorizer is not None
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict medical specialization based on symptom description.
    
    Expected JSON payload:
    {
        "symptoms": "I have severe chest pain and shortness of breath"
    }
    
    Returns:
    {
        "specialization": "Cardiology",
        "confidence": 0.92,
        "success": true
    }
    """
    try:
        # Get symptoms from request
        data = request.get_json()
        
        if not data or 'symptoms' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing "symptoms" field in request'
            }), 400
        
        symptoms = data['symptoms']
        
        if not symptoms or len(symptoms.strip()) == 0:
            return jsonify({
                'success': False,
                'error': 'Symptoms cannot be empty'
            }), 400
        
        # Preprocess symptoms
        clean_symptoms = preprocess_text(symptoms)
        
        # Vectorize
        symptoms_tfidf = vectorizer.transform([clean_symptoms])
        
        # Predict
        specialization = model.predict(symptoms_tfidf)[0]
        confidence = float(model.predict_proba(symptoms_tfidf).max())
        
        # Get top 3 predictions with probabilities
        all_proba = model.predict_proba(symptoms_tfidf)[0]
        top_3_indices = all_proba.argsort()[-3:][::-1]
        top_3_predictions = [
            {
                'specialization': model.classes_[idx],
                'confidence': float(all_proba[idx])
            }
            for idx in top_3_indices
        ]
        
        return jsonify({
            'success': True,
            'specialization': specialization,
            'confidence': confidence,
            'top_predictions': top_3_predictions
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("AI-POWERED APPOINTMENT ASSISTANT - FLASK API")
    print("="*60)
    
    # Load models
    try:
        load_models()
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease run 'python train.py' first to train the model.")
        exit(1)
    
    print("\nStarting Flask server on http://localhost:5001")
    print("\nAvailable endpoints:")
    print("  GET  /health  - Health check")
    print("  POST /predict - Predict specialization from symptoms")
    print("\n" + "="*60 + "\n")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5001, debug=False)
