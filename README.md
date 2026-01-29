# 🎓 Study Abroad App - Quick Start Guide

## The Problem
Opening `index.html` directly (file:// protocol) causes CORS errors when trying to connect to the backend API.

## The Solution
Use the **START-APP.bat** file to run both servers properly!

---

## 🚀 How to Start the App

### Simple Way (Recommended)
1. **Double-click** `START-APP.bat` in the main folder
2. Wait for both servers to start (2-3 seconds)
3. Browser will open automatically to `http://localhost:8080`

### Manual Way
If you prefer to start servers separately:

**Terminal 1 - Backend:**
```cmd
cd backend
npm start
```

**Terminal 2 - Frontend:**
```cmd
node serve-frontend.js
```

Then open: `http://localhost:8080`

---

## 📍 Server Ports

| Server | URL | Purpose |
|--------|-----|---------|
| **Frontend** | http://localhost:8080 | Your app interface |
| **Backend** | http://localhost:3001 | University data API |

---

## ✅ What Should Work Now

- ✅ Universities page shows real universities (Stanford, MIT, etc.)
- ✅ AI Counsellor recommends verified universities
- ✅ Search by country (USA, Germany, Italy, France, etc.)
- ✅ Search by field (Artificial Intelligence, ML, etc.)
- ✅ All 100 universities across 20 countries

---

## 🔧 Troubleshooting

### "No universities found"
- Make sure BOTH servers are running
- Backend should show: `🎓 University API running on http://localhost:3001`
- Frontend should show: `🌐 Frontend server running at http://localhost:8080/`

### Port already in use
- If port 8080 is busy, edit `serve-frontend.js` and change `PORT = 8080` to `PORT = 8081`

### Backend won't start
```cmd
cd backend
npm install
npm start
```

---

## 🛑 How to Stop

Press `Ctrl+C` in each terminal window to stop the servers.

---

## 📝 First Time Setup (Already Done)

If starting fresh on a new computer:
```cmd
cd backend
npm install
```
