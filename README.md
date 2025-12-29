# Smart Healthcare Appointment System

A professional, resume-worthy MERN stack application for managing healthcare appointments with role-based access control.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, React Router, Axios, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Local/Atlas ready)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt

### Project Structure
```
/app/
├── backend/                 # Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth & role-based middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── server.js           # Entry point
│   ├── seed.js             # Database seeding
│   └── .env                # Environment variables
│
└── frontend/               # React frontend
    ├── public/             # Static files
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── context/        # Auth context
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── App.js          # Main app component
    │   └── index.js        # Entry point
    ├── tailwind.config.js  # Tailwind configuration
    └── .env                # Environment variables
```

## 🚀 Features

### Phase 1 (Completed)
✅ Proper MERN architecture with separated backend/frontend
✅ MongoDB connection with environment variables (Atlas-ready)
✅ JWT authentication system
✅ Role-based access control (Patient, Doctor, Admin)
✅ User registration and login
✅ Protected routes
✅ Professional UI with TailwindCSS
✅ API services layer
✅ Error handling middleware
✅ Password hashing with bcrypt

### Upcoming Features (Phase 2-4)
- Patient Dashboard (book appointments, view history)
- Doctor Dashboard (manage appointments, approve/reject)
- Admin Dashboard (user & doctor management)
- Appointment booking system
- Real-time availability checking
- Email notifications
- Profile management

## 🔐 User Roles

### Patient
- Register and login
- Book appointments with doctors
- View appointment history
- Cancel appointments

### Doctor
- Login (account created by admin)
- View appointment requests
- Approve/Reject appointments
- Manage availability
- Complete appointments

### Admin
- Manage all users
- Approve/Reject doctor registrations
- View all appointments
- System statistics

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or Atlas URI)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install  # or yarn install
```

Create `.env` file in backend folder:
```env
MONGO_URI=mongodb://localhost:27017/smarthealthcare
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend Setup
```bash
cd frontend
npm install  # or yarn install
```

Create `.env` file in frontend folder:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Seed Database (Optional)
```bash
cd backend
node seed.js
```

## 🏃 Running the Application

### Start Backend
```bash
cd backend
node server.js
```
Backend runs on: http://localhost:5000

### Start Frontend
```bash
cd frontend
npm start  # or yarn start
```
Frontend runs on: http://localhost:3000

## 🔑 Test Credentials

After running seed script:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@healthcare.com   | admin123   |
| Patient | patient@test.com       | patient123 |
| Doctor  | doctor@test.com        | doctor123  |

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Appointments (Patient)
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/my-appointments` - Get patient's appointments
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments/check-availability` - Check slot availability

### Doctor Routes
- `GET /api/doctor/list` - Get all approved doctors
- `GET /api/doctor/appointments` - Get doctor's appointments (protected)
- `PUT /api/doctor/appointments/:id/approve` - Approve appointment (protected)
- `PUT /api/doctor/appointments/:id/reject` - Reject appointment (protected)
- `PUT /api/doctor/appointments/:id/complete` - Complete appointment (protected)
- `GET /api/doctor/profile` - Get doctor profile (protected)
- `PUT /api/doctor/profile` - Update doctor profile (protected)

### Admin Routes
- `GET /api/admin/stats` - Dashboard statistics (protected)
- `GET /api/admin/users` - Get all users (protected)
- `PUT /api/admin/users/:id/toggle-status` - Activate/Deactivate user (protected)
- `DELETE /api/admin/users/:id` - Delete user (protected)
- `GET /api/admin/doctors` - Get all doctors (protected)
- `POST /api/admin/doctors` - Create doctor profile (protected)
- `PUT /api/admin/doctors/:id/approve` - Approve doctor (protected)
- `PUT /api/admin/doctors/:id/reject` - Reject doctor (protected)
- `DELETE /api/admin/doctors/:id` - Delete doctor (protected)
- `GET /api/admin/appointments` - Get all appointments (protected)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 salt rounds)
- Role-based access control middleware
- Protected routes on both frontend and backend
- Token expiration (30 days)
- Input validation on models
- CORS configuration

## 🎨 Frontend Features

- Responsive design with TailwindCSS
- Protected routes using React Router
- Authentication context for global state management
- Axios interceptors for automatic token injection
- Error handling and loading states
- Clean, modern UI

## 📝 Database Models

### User
- name, email, phone, password (hashed)
- role (patient/doctor/admin)
- isActive status
- timestamps

### Doctor
- userId (reference to User)
- specialization, hospital, qualification
- experience, consultationFee
- availableSlots array
- status (pending/approved/rejected)
- timestamps

### Appointment
- patientId, doctorId (references)
- appointmentDate, timeSlot
- reason, notes
- status (pending/approved/rejected/completed/cancelled)
- rejectionReason
- timestamps

## 🔄 Migration to MongoDB Atlas

To migrate to MongoDB Atlas:

1. Create MongoDB Atlas account
2. Create a cluster
3. Get connection string
4. Update `MONGO_URI` in backend `.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smarthealthcare?retryWrites=true&w=majority
   ```
5. Restart backend server

## 📚 Development Notes

- Backend uses ES6 modules and async/await
- Frontend uses functional components and React Hooks
- Clean separation of concerns
- RESTful API design
- Error handling middleware
- Validation on both frontend and backend

## 🚀 Deployment Ready

This application is structured for easy deployment:
- Environment variables for configuration
- Production-ready build scripts
- CORS properly configured
- Error handling in place
- Security best practices followed

## 📄 License

ISC

## 👨‍💻 Author

Smart Healthcare Team
