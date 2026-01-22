# Smart Healthcare Appointment App

A full-stack MERN web application that allows patients to book doctor appointments,
doctors to manage availability, and admins to manage the system.

This project was built to understand real-world backend logic, authentication,
role-based access control, and how machine learning can be integrated into
production-style web applications.

---

## Tech Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Authentication: JWT
- Security: bcrypt
- Machine Learning: Python, scikit-learn

---

## Features

### Authentication & Roles
- User registration and login
- JWT-based authentication
- Role-based access control (Patient, Doctor, Admin)
- Protected routes on frontend and backend

### Patient
- View list of available doctors
- Book appointments based on doctor availability
- Select date and time slots
- View appointment history
- Cancel pending appointments

### Doctor
- Manage profile details
- Set availability using day and time slots
- View appointment requests
- Approve, reject, or complete appointments
- View no-show risk indicator for scheduled appointments

### Admin
- View system statistics
- Manage users (activate/deactivate/delete)
- Create and manage doctor profiles
- View all appointments in the system

---

## Machine Learning Integration

The project includes a machine learning module that predicts the likelihood of
appointment no-shows using historical appointment patterns.

- The ML module outputs a probability score for each appointment
- The backend can map this score to a risk level (LOW / MEDIUM / HIGH)
- This information can be displayed in the doctor or admin dashboard
  to help identify potentially risky appointments

The ML logic is implemented separately to keep the system modular and maintainable.

---

## Project Structure

backend/
├── controllers
├── models
├── routes
├── middleware
└── server.js

frontend/
├── components
├── pages
├── context
├── services
└── App.js

ml-module/
├── no_show_prediction.py
├── no_show_model.joblib
└── README.md

---

## Why this project

This project was created to practice:
- Full-stack MERN development
- REST API design
- Authentication and authorization
- Database relationships
- Realistic appointment-booking workflows
- Practical machine learning integration into a web system

---

## Running the project locally

### Backend

cd backend  
npm install  
node server.js  

### Frontend

cd frontend  
npm install  
npm start  

---

## Current Status

Core functionality is complete.  
Future improvements may include payments, notifications, deployment,
and tighter backend–ML automation.
