# How to Start the Application

## Quick Start Guide

### Prerequisites
- Node.js installed
- MongoDB installed and running
- npm packages installed (run `npm install` in both backend and frontend folders)

---

## Method 1: Manual Start (Two Terminals)

### Terminal 1 - Backend Server

```bash
cd c:\Projects\Smart-Healthcare-Appointment-System\backend
npm start
```

**Wait for this message:**
```
🚀 Server is running on port 5000
✅ MongoDB Connected: localhost
```

### Terminal 2 - Frontend Server

```bash
cd c:\Projects\Smart-Healthcare-Appointment-System\frontend
npm start
```

**Wait for:**
```
Compiled successfully!
```

**Then open browser:** http://localhost:3000

---

## Method 2: PowerShell Script (Single Command)

Create a file `start-dev.ps1` in the project root:

```powershell
# Start MongoDB (if not running)
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -ne 'Running') {
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    Start-Service MongoDB
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "`nServers starting..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in each window to stop servers" -ForegroundColor Yellow
```

**Run it:**
```powershell
.\start-dev.ps1
```

---

## Method 3: VS Code Tasks (Recommended)

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "npm start",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^(.*)$",
          "file": 1
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "Starting",
          "endsPattern": "Server is running"
        }
      }
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm start",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^(.*)$",
          "file": 1
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "Starting",
          "endsPattern": "Compiled successfully"
        }
      }
    },
    {
      "label": "Start All",
      "dependsOn": ["Start Backend", "Start Frontend"],
      "problemMatcher": []
    }
  ]
}
```

**Then:** Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Start All`

---

## Current Status

✅ **Backend is running** on http://localhost:5000  
⚠️ **Frontend needs to be started** on http://localhost:3000

---

## Verify Servers are Running

### Check Backend
Open browser: http://localhost:5000/api/health

**Expected response:**
```json
{"status":"ok","message":"Server is running"}
```

### Check Frontend
Open browser: http://localhost:3000

**Expected:** Smart Healthcare home page

---

## Next Steps

1. **Register a new account:**
   - Go to http://localhost:3000/register
   - Fill in the form
   - Choose role (patient, doctor, or admin)

2. **Login:**
   - Go to http://localhost:3000/login
   - Use your credentials

3. **Test features:**
   - Search for doctors: http://localhost:3000/doctors/search
   - View analytics: http://localhost:3000/analytics
   - Book appointments
   - Leave reviews

---

## Stop Servers

**Method 1:** Press `Ctrl+C` in each terminal window

**Method 2:** Close the terminal windows

**Method 3:** Kill processes by port
```powershell
# Find and kill backend (port 5000)
$backend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backend) { Stop-Process -Id $backend.OwningProcess -Force }

# Find and kill frontend (port 3000)
$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontend) { Stop-Process -Id $frontend.OwningProcess -Force }
```

---

## Troubleshooting

If you encounter issues, see `TROUBLESHOOTING.md` for detailed solutions.

**Common issues:**
- MongoDB not running → Start MongoDB service
- Port already in use → Kill process or use different port
- Network errors → Check `.env` files have correct URLs
- CORS errors → Verify FRONTEND_URL in backend/.env

---

## Environment Files

**Frontend (`.env`):**
```
REACT_APP_API_URL=http://localhost:5000
```

**Backend (`.env`):**
```
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/smarthealthcare
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

---

**Ready to start!** 🚀
