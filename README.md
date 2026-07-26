# Smart Healthcare Appointment System

A personal full-stack project for simplifying doctor appointment booking and management. The app lets patients book visits, while doctors and admins can manage schedules, approvals, and updates through role-based dashboards.

## Live demo

Deployment link coming soon.

## Screenshot

![App preview placeholder](https://via.placeholder.com/1200x600?text=Smart+Healthcare+Appointment+System)

## Key features

- Patient registration and authentication
- Doctor search and appointment booking
- Role-based dashboards for patients, doctors, and admins
- AI-assisted symptom analysis and specialist recommendations
- Email notifications and real-time updates

## Tech stack

- Frontend: React, Tailwind CSS, React Router
- Backend: Node.js, Express, MongoDB, JWT
- AI service: Python, Flask, scikit-learn
- Real-time: Socket.io

## Project structure

- backend/: API and database logic
- frontend/: React interface
- ml/: Python AI service and model scripts



## Configuration

### Backend `.env`
```env
MONGO_URI=mongodb://localhost:27017/smarthealthcare
JWT_SECRET=your_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

> **Gmail Setup:** Enable 2FA → [Generate App Password](https://myaccount.google.com/apppasswords)  
> **⚠️ Use port 587** (not 465) for better cloud platform compatibility

## Troubleshooting

**Email not working / Connection timeout**  
→ Use **port 587** instead of 465  
→ Use Gmail App Password (not regular password)  
→ Check spam folder

**MongoDB connection failed**  
→ Ensure MongoDB is running: `mongod`

**Port already in use**  
→ `npx kill-port 5000`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed troubleshooting.

## License

MIT
