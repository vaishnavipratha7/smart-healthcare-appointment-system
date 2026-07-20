# AI-Powered Appointment Assistant

## Python ML Service for Symptom-Based Specialization Recommendation

This module uses Natural Language Processing (NLP) to analyze patient symptom descriptions and recommend appropriate medical specializations.

### Features
- Text preprocessing (lowercase, punctuation removal, tokenization, stopword removal)
- TF-IDF vectorization
- Logistic Regression classifier
- Confidence scoring
- Flask API for real-time predictions

### Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Train the model:
```bash
python train.py
```

This will:
- Generate synthetic training data
- Preprocess text
- Train the classifier
- Save model artifacts (model.pkl, vectorizer.pkl)

3. Start the Flask API:
```bash
python app.py
```

The service will run on `http://localhost:5001`

### API Endpoint

**POST** `/predict`

Request:
```json
{
  "symptoms": "I have severe headache and dizziness"
}
```

Response:
```json
{
  "specialization": "Neurology",
  "confidence": 0.92
}
```

### Safety

⚠️ **Important:** This system does NOT diagnose diseases. It only recommends an appropriate medical specialization to help patients find the right doctor.

### Model

- **Algorithm:** Logistic Regression (baseline)
- **Vectorization:** TF-IDF
- **Features:** Symptom text
- **Labels:** Medical specializations

### Files

- `train.py` - Data generation, preprocessing, model training
- `predict.py` - Prediction utilities
- `app.py` - Flask API service
- `data/symptoms_dataset.csv` - Training data
- `models/model.pkl` - Trained model
- `models/vectorizer.pkl` - TF-IDF vectorizer
