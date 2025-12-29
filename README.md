# Smart Healthcare Appointment App

A full-stack MERN web application that allows patients to book doctor appointments, doctors to manage availability, and admins to manage the system.

This project was built to understand real-world backend logic, authentication, and role-based access used in production web applications.

---

## Tech Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Authentication: JWT
- Security: bcrypt

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

### Admin
- View system statistics
- Manage users (activate/deactivate/delete)
- Create and manage doctor profiles
- View all appointments in the system

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

---

## Why this project

This project was created to practice:
- Full-stack MERN development
- REST API design
- Authentication and authorization
- Database relationships
- Realistic appointment-booking workflows

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
Future improvements may include payments, notifications, and deployment.