Smart Healthcare Appointment App

A full-stack web application to manage doctor appointments with separate roles for patients, doctors, and admins.

Built to practice real-world MERN stack development concepts like authentication, role-based access, and REST APIs.


What this project does

Users can register and log in

Patients can book appointments with doctors

Doctors can manage their availability and appointments

Admin can manage users, doctors, and view system data

Appointments follow a proper status flow (pending → approved → completed)


Tech Stack

Frontend

React

React Router

Tailwind CSS

Axios


Backend

Node.js

Express.js

MongoDB

JWT Authentication

bcrypt for password hashing


User Roles & Features
Patient

Register & login

View doctors

Book appointments

View appointment history

Cancel pending appointments

Doctor

Login

Edit profile & availability

View appointment requests

Approve / reject appointments

Mark appointments as completed

Admin

View dashboard stats

Manage users

Create & approve doctor profiles

View all appointments

Project Structure
smart-healthcare-appointment-system/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   └── App.js
│
└── README.md

How to run locally
Backend
cd backend
npm install
node server.js

Frontend
cd frontend
npm install
npm start

Database Models

User (patient / doctor / admin)

Doctor (profile, specialization, availability)

Appointment (date, time slot, status)

Why this project

This project helped me understand:

How frontend and backend communicate

JWT authentication and protected routes

Role-based access control

Designing real-world REST APIs

Managing state and forms in React
