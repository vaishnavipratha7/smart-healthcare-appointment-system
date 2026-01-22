import joblib

model = joblib.load("no_show_model.joblib")
print("Model loaded successfully:", type(model))
