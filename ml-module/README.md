## Appointment No-Show Prediction Module

This module adds a machine learning component to the Smart Healthcare Appointment System
to predict the likelihood of appointment no-shows based on historical appointment data.

### Model
- Logistic Regression (chosen for simplicity and interpretability)

### Features Used
- Booking lead time (days between booking and appointment)
- Appointment time (hour of the day)

### Approach
- Supervised binary classification (show vs no-show)
- Synthetic historical data used for training
- Train–test split for evaluation
- Model evaluation using accuracy, precision, and recall

### Integration
The backend can send appointment details to this module and receive a probability score
indicating the likelihood of a no-show.  
This score can be mapped to a simple risk label (LOW / MEDIUM / HIGH) and displayed
in the doctor or admin dashboard.

### Limitations
- Uses synthetic data for demonstration
- Designed for academic and internship-level learning, not production deployment
