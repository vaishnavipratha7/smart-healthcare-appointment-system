# Troubleshooting Guide

## Network Error on Login/Register

### Issue
Getting network errors when trying to login or register.

### Root Causes
1. **Backend server not running**
2. **Frontend API URL misconfigured**
3. **MongoDB not running**
4. **Port conflicts**

---

## ✅ SOLUTION

### 1. Fix Frontend API URL
The `.env` file was pointing to the wrong URL.

**File:** `frontend/.env`

**BEFORE (Wrong):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

**AFTER (Correct):**
```
REACT_APP_API_URL=http://localhost:5000
```

**Note:** The routes already include `/api`, so we don't need it in the base URL.

---

### 2. Start Backend Server

Open a terminal and run:
```bash
cd backend
npm start
```

**Expected output:**
```
✅ Environment variables validated successfully.
✨ Socket.io initialized successfully
🚀 Server is running on port 5000
✅ MongoDB Connected: localhost
```

**If you see errors:**
- MongoDB not running? Start MongoDB service
- Port 5000 already in use? Kill the process or change PORT in `.env`

---

### 3. Start Frontend Server

Open another terminal and run:
```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view smart-healthcare-frontend in the browser.
Local: http://localhost:3000
```

**If port 3000 is in use:**
- Press `Y` to run on another port (e.g., 3001)
- Or kill the process using port 3000

---

### 4. Update Frontend URL (if using different port)

If frontend runs on a different port (e.g., 3001), update backend CORS:

**File:** `backend/.env`
```
FRONTEND_URL=http://localhost:3001
```

Restart backend server after changing.

---

## Quick Start Commands

### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd c:\Projects\Smart-Healthcare-Appointment-System\backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd c:\Projects\Smart-Healthcare-Appointment-System\frontend
npm start
```

### Option 2: Using npm scripts (if configured)

From project root:
```bash
npm run dev
```

---

## Verify Backend is Running

Open browser and visit:
```
http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Verify Frontend is Running

Open browser and visit:
```
http://localhost:3000
```

You should see the Smart Healthcare home page.

---

## Common Errors & Fixes

### Error: "ECONNREFUSED"
**Cause:** Backend is not running  
**Fix:** Start backend server

### Error: "Network Error"
**Cause:** Wrong API URL in frontend  
**Fix:** Check `frontend/.env` has `REACT_APP_API_URL=http://localhost:5000`

### Error: "MongoNetworkError"
**Cause:** MongoDB is not running  
**Fix:** Start MongoDB service:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Error: "Port 5000 already in use"
**Cause:** Another process using port 5000  
**Fix:** 
```bash
# Find process
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

### Error: "Port 3000 already in use"
**Fix:** Press `Y` when prompted to use another port

---

## MongoDB Check

### Verify MongoDB is Running

**Windows:**
```bash
sc query MongoDB
```

**Mac/Linux:**
```bash
systemctl status mongod
```

### Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
```

### Test MongoDB Connection

```bash
mongosh
# or
mongo
```

Then:
```javascript
show dbs
use smarthealthcare
show collections
```

---

## Browser Console Check

Open browser DevTools (F12) and check:

1. **Network Tab**
   - Look for failed requests
   - Check request URL (should be http://localhost:5000/api/auth/register)
   - Check status code

2. **Console Tab**
   - Look for error messages
   - Check for CORS errors

---

## CORS Issues

If you see CORS errors:

**Check backend server.js has:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**And backend/.env has:**
```
FRONTEND_URL=http://localhost:3000
```

---

## After Fixing

1. **Stop all servers** (Ctrl+C in terminals)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Restart backend** (`npm start` in backend/)
4. **Restart frontend** (`npm start` in frontend/)
5. **Try login/register again**

---

## Test Credentials

### Register a New User
1. Go to http://localhost:3000/register
2. Fill in form:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
   - Role: patient

### Or Use Seeded Data (if you ran seed script)
```bash
cd backend
node seed.js
```

**Admin:**
- Email: admin@example.com
- Password: admin123

**Doctor:**
- Email: doctor@example.com
- Password: doctor123

**Patient:**
- Email: patient@example.com
- Password: patient123

---

## Still Having Issues?

### Check All Services
```bash
# Backend running?
curl http://localhost:5000/api/health

# Frontend running?
# Open browser to http://localhost:3000

# MongoDB running?
mongosh
```

### Enable Debug Logs

**Backend (.env):**
```
NODE_ENV=development
```

**Frontend:**
Check browser console for detailed error messages

### Verify Environment Variables

**Backend:**
```bash
cd backend
cat .env  # Mac/Linux
type .env # Windows
```

**Frontend:**
```bash
cd frontend
cat .env  # Mac/Linux
type .env # Windows
```

---

## Contact Support

If none of these solutions work:
1. Note the exact error message
2. Check browser console (F12)
3. Check backend terminal output
4. Include all error details when asking for help

---

## ✅ Quick Checklist

Before testing:
- [ ] MongoDB is running
- [ ] Backend server is running (port 5000)
- [ ] Frontend is running (port 3000)
- [ ] `frontend/.env` has correct API_URL
- [ ] `backend/.env` has correct FRONTEND_URL
- [ ] Browser cache cleared
- [ ] No firewall blocking localhost

---

**Status:** Issue identified and fixed ✅  
**Required Action:** Restart servers with corrected configuration
