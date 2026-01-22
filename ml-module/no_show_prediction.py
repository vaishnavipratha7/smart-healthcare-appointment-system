"""
Appointment No-Show Prediction Module

Implements a simple, interpretable machine learning model to predict
appointment no-shows for a Smart Healthcare Appointment System.

Scope:
- Academic / internship-level project
- Focus on ML fundamentals and explainability
"""

import pandas as pd
import random
import joblib
import os
from datetime import datetime, timedelta

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score


# --------------------------------------------------
# Generate synthetic appointment data
# --------------------------------------------------
def generate_synthetic_data(num_samples=1000):
    data = []

    for _ in range(num_samples):
        booking_date = datetime.now() - timedelta(days=random.randint(1, 60))
        appointment_date = booking_date + timedelta(days=random.randint(1, 30))
        appointment_time = f"{random.randint(8, 17)}:{random.choice(['00', '30'])}"

        days_gap = (appointment_date - booking_date).days
        no_show_prob = 0.3 if days_gap < 7 else 0.1
        appointment_status = "no-show" if random.random() < no_show_prob else "show"

        data.append({
            "booking_date": booking_date,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "appointment_status": appointment_status
        })

    return pd.DataFrame(data)


# --------------------------------------------------
# Feature engineering and label creation
# --------------------------------------------------
def preprocess_data(df):
    df["booking_date"] = pd.to_datetime(df["booking_date"])
    df["appointment_date"] = pd.to_datetime(df["appointment_date"])

    df["days_until_appointment"] = (
        df["appointment_date"] - df["booking_date"]
    ).dt.days

    df["appointment_hour"] = df["appointment_time"].apply(
        lambda x: int(x.split(":")[0])
    )

    # Label: 1 = no-show, 0 = show
    df["no_show"] = df["appointment_status"].apply(
        lambda x: 1 if x == "no-show" else 0
    )

    X = df[["days_until_appointment", "appointment_hour"]]
    y = df["no_show"]

    return X, y


# --------------------------------------------------
# Train and evaluate models
# --------------------------------------------------
def train_and_evaluate(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Logistic Regression (primary model)
    lr_model = LogisticRegression()
    lr_model.fit(X_train, y_train)
    lr_pred = lr_model.predict(X_test)

    print("\nLogistic Regression Evaluation")
    print("Accuracy :", accuracy_score(y_test, lr_pred))
    print("Precision:", precision_score(y_test, lr_pred))
    print("Recall   :", recall_score(y_test, lr_pred))

    # Decision Tree (comparison)
    dt_model = DecisionTreeClassifier(random_state=42)
    dt_model.fit(X_train, y_train)
    dt_pred = dt_model.predict(X_test)

    print("\nDecision Tree Evaluation")
    print("Accuracy :", accuracy_score(y_test, dt_pred))
    print("Precision:", precision_score(y_test, dt_pred))
    print("Recall   :", recall_score(y_test, dt_pred))

    # Logistic Regression chosen for interpretability
    return lr_model


# --------------------------------------------------
# Save / load model
# --------------------------------------------------
def save_model(model, filename="no_show_model.joblib"):
    joblib.dump(model, filename)
    print(f"\nModel saved as {filename}")


def load_model(filename="no_show_model.joblib"):
    if not os.path.exists(filename):
        raise FileNotFoundError("Model file not found")
    return joblib.load(filename)


# --------------------------------------------------
# Prediction function
# --------------------------------------------------
def predict_no_show(model, appointment_date, appointment_time, booking_date):
    appointment_date = pd.to_datetime(appointment_date)
    booking_date = pd.to_datetime(booking_date)

    days_until_appointment = (appointment_date - booking_date).days
    appointment_hour = int(appointment_time.split(":")[0])

    input_data = pd.DataFrame(
        [[days_until_appointment, appointment_hour]],
        columns=["days_until_appointment", "appointment_hour"]
    )

    return model.predict_proba(input_data)[0][1]


# --------------------------------------------------
# Main execution
# --------------------------------------------------
if __name__ == "__main__":
    df = generate_synthetic_data(1000)
    X, y = preprocess_data(df)

    model = train_and_evaluate(X, y)
    save_model(model)

    loaded_model = load_model()
    probability = predict_no_show(
        loaded_model,
        appointment_date="2024-07-15",
        appointment_time="10:30",
        booking_date="2024-07-01"
    )

    print(f"\nPredicted no-show probability: {probability:.2f}")
