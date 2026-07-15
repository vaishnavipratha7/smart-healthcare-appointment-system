# Smart Healthcare Appointment System

A full-stack MERN web application for booking and managing medical appointments, with role-based access for patients, doctors, and admins.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios, Recharts |
| Backend | Node.js, Express.js, MongoDB (Mongoose), Socket.io |
| Auth | JWT, bcryptjs |
| Email | Nodemailer |
| File Uploads | Multer |
| Scheduling | node-cron |
| Validation | express-validator |
| Security | Helmet, express-rate-limit |
| ML Module | Python, scikit-learn |

---

## Features

### Patients
- Register, login, and manage profile
- Search and filter doctors by specialization, hospital, fee, experience, and availability
- Book appointments by selecting date and time slots
- View appointment history and cancel pending appointments
- Upload medical records
- Leave ratings and reviews for completed appointments

### Doctors
- Manage profile and availability (days + time slots)
- View, approve, reject, and complete appointment requests
- Respond to patient reviews
- Upload certificates
- Receive real-time notifications

### Admins
- View system-wide statistics
- Manage users (activate / deactivate / delete)
- Create and manage doctor profiles
- View all appointments
- Manually trigger scheduled jobs

### System
- Real-time notifications via Socket.io
- Email notifications (confirmations, reminders, status updates)
- Scheduled jobs (daily reminders, auto-complete, weekly summaries)
- No-show risk prediction via ML module
- Rate limiting and security headers

---

## Project Structure

```
smart-healthcare-appointment-system/
├── backend/
│   ├── config/          # Database connection, env validation
│   ├── controllers/     # Route handlers (auth, appointments, doctors, reviews, uploads, admin)
│   ├── middleware/       # Auth, role checks, validation, upload, rate limiting, error handling
│   ├── models/          # Mongoose models (User, Doctor, Appointment, Review)
│   ├── routes/          # Express routers
│   ├── services/        # Email, Socket.io, scheduled jobs
│   ├── uploads/         # Stored files (certificates, medical-records, profile-pictures)
│   ├── seed.js          # Database seeder
│   └── server.js        # Entry point
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth and Toast context providers
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Page-level components
│       └── services/    # Axios API client, Socket.io client
│
└── ml-module/
    ├── no_show_prediction.py   # Prediction logic
    ├── no_show_model.joblib    # Trained model
    └── test_load.py
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.8+ (for ML module)

### Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in the values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthealthcare
JWT_SECRET=your_secret_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Start the server:

```bash
npm run dev     # development (nodemon)
npm start       # production
```

Optionally seed the database with sample data:

```bash
node seed.js
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```
REACT_APP_API_URL=http://localhost:5000
```

Start the app:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Default Seed Accounts

After running `node seed.js`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Doctor | doctor@example.com | doctor123 |
| Patient | patient@example.com | patient123 |

---

## ML Module

The ML module predicts the likelihood of appointment no-shows based on historical patterns. It outputs a probability score that maps to a risk level (LOW / MEDIUM / HIGH), surfaced in the doctor and admin dashboards.

```bash
cd ml-module
python no_show_prediction.py
```

---

## API Overview

| Group | Base Path |
|---|---|
| Auth | `/api/auth` |
| Doctors | `/api/doctor` |
| Appointments | `/api/appointments` |
| Reviews | `/api/reviews` |
| Uploads | `/api/upload` |
| Admin | `/api/admin` |

Health check: `GET /api/health`
