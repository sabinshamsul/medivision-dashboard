# 🚀 QUICK START GUIDE - MediVision MVP

## ⚡ For Team Members - Get Running in 5 Minutes

### Prerequisites Check
```bash
# Check Node.js installed (should be v16+)
node --version

# Check npm installed
npm --version

# Check if MongoDB is running
# If not installed, download from: https://www.mongodb.com/try/download/community
```

---

## 🎯 Setup Steps (Do This Once)

### 1️⃣ Pull Latest Code
```bash
git checkout main
git pull origin main
```

### 2️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```

### 3️⃣ Install Frontend Dependencies
```bash
cd ../frontend
npm install
cd ..
```

### 4️⃣ Start MongoDB
**Windows:**
- Open MongoDB Compass (or search "MongoDB" in Start Menu)
- Or: `net start MongoDB` in Admin Command Prompt

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 5️⃣ Create Demo Users (First Time Only)
```bash
cd backend
node createUsers.js
```

You should see:
```
✅ Demo users created successfully!
👤 Admin:     admin / admin123
👨‍⚕️  Clinician: doctor / doctor123
🏥 Patient:   patient / patient123
```

---

## 🏃‍♂️ Daily Workflow - Starting the App

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Wait for: `Server running on http://localhost:5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Wait for: `Local: http://localhost:5173/`

### Access App
Open browser: **http://localhost:5173**

---

## 🎭 Testing the MVP

### Test Flow 1: Register Patient
1. Go to http://localhost:5173/register
2. Fill form with test data:
   - Name: John Doe
   - Age: 35
   - Gender: Male
   - Contact: +60123456789
   - Address: 123 Test Street, Selangor
   - Chief Complaint: Chest pain
   - BP: 120/80
   - HR: 75
   - Temp: 36.5
   - SpO2: 98
3. Click "Register Patient"
4. Should see green success message

### Test Flow 2: Admin Dashboard
1. Login with: `admin` / `admin123`
2. You should see:
   - Statistics cards (Total, Waiting, In Treatment, Discharged)
   - Pie chart (Triage Distribution)
   - Bar chart (Patient Status)
   - Patient table with all registered patients
3. Try changing a patient status in the dropdown

### Test Flow 3: Clinician Dashboard
1. Login with: `doctor` / `doctor123`
2. You should see:
   - Quick stats cards
   - Waiting Queue tab
   - In Treatment tab
3. Click "Start Treatment" on a waiting patient
4. Patient moves to "In Treatment" tab
5. Click "Discharge Patient" to complete

---

## 🐛 Common Issues & Fixes

### ❌ "Port 5000 already in use"
**Fix:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <number> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### ❌ "Cannot connect to MongoDB"
**Fix 1 - Check if MongoDB is running:**
- Windows: Open Task Manager → Services → Look for MongoDB
- Mac: `brew services list`
- Linux: `sudo systemctl status mongod`

**Fix 2 - Restart MongoDB:**
- Windows: `net stop MongoDB` then `net start MongoDB`
- Mac: `brew services restart mongodb-community`
- Linux: `sudo systemctl restart mongod`

### ❌ Frontend shows blank page
**Fix:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### ❌ "Invalid credentials" when logging in
**Fix:**
```bash
cd backend
node createUsers.js
```

### ❌ Backend won't start after `npm install`
**Fix:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📱 Screenshots to Verify It's Working

### Login Page ✅
- Blue gradient background
- MediVision logo with Activity icon
- Username and Password fields
- Demo accounts shown at bottom

### Patient Registration ✅
- Form with personal info section
- Medical info section
- Vital signs fields
- Blue "Register Patient" button

### Admin Dashboard ✅
- 4 stat cards at top
- 2 charts (Pie + Bar)
- Patient table below
- Status dropdowns working

### Clinician Dashboard ✅
- 3 colored stat cards
- Tabs: "Waiting Queue" and "In Treatment"
- Patient cards with vital signs
- Action buttons (Start Treatment / Discharge)

---

## 👥 Who Does What

### Syahmi (System Integrator)
- ✅ Backend API working
- ✅ Patient tracking endpoints
- ✅ MongoDB connection
- 🔄 Next: Real-time updates with WebSocket

### Asfa (Frontend)
- ✅ All pages coded and styled
- ✅ Forms working
- ✅ API integration complete
- 🔄 Next: Refine UI/UX based on Jerry's designs

### Jerry (UI/UX)
- ✅ Basic styling implemented
- 🔄 Next: Create detailed Figma designs
- 🔄 Next: Design system documentation

### Kelvin (Database)
- ✅ Patient schema working
- ✅ User schema working
- 🔄 Next: Add more schemas (Beds, Departments)
- 🔄 Next: Data analytics views

### Hasri (AI)
- 🔄 Next: Prepare dataset
- 🔄 Next: Train triage model
- 🔄 Next: Create Flask API
- 🔄 Next: Integrate ChatGPT API

---

## 📊 Features Status

| Feature | Status | Owner |
|---------|--------|-------|
| Patient Registration | ✅ Done | Asfa |
| Admin Dashboard | ✅ Done | Asfa |
| Clinician Dashboard | ✅ Done | Asfa |
| Login/Auth | ✅ Done | Syahmi |
| Backend API | ✅ Done | Syahmi |
| MongoDB Schemas | ✅ Done | Kelvin |
| Charts/Visualizations | ✅ Done | Asfa |
| AI Triage | 🔄 In Progress | Hasri |
| Chatbot | 🔄 Not Started | Hasri |
| Real-time Updates | 🔄 Not Started | Syahmi |

---

## 🎯 Next Steps for Each Member

### This Week (Week 7):

**Syahmi:**
1. Test all API endpoints
2. Document API in Postman
3. Start planning WebSocket integration

**Asfa:**
1. Test all pages thoroughly
2. Fix any UI bugs
3. Improve mobile responsiveness

**Jerry:**
1. Create Figma designs for all pages
2. Share with team for feedback
3. Create design system document

**Kelvin:**
1. Add sample data (10-20 patients)
2. Design additional schemas (Beds, Departments)
3. Plan analytics queries

**Hasri:**
1. Download and preprocess dataset
2. Start training triage model
3. Set up Flask app structure

---

## 📞 Need Help?

1. **Check this guide first**
2. **Check browser console (F12)** for frontend errors
3. **Check terminal** for backend errors
4. **Check MongoDB** is running
5. **Ask in group chat** with:
   - What you were trying to do
   - Error message screenshot
   - Which step you're stuck on

---

## ✅ Daily Checklist

Before starting work:
- [ ] Pull latest code: `git pull origin main`
- [ ] MongoDB is running
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Can login with demo accounts

After finishing work:
- [ ] Test your changes
- [ ] Commit with clear message
- [ ] Push to your branch
- [ ] Create Pull Request if feature complete

---

**Last Updated:** February 2026
**MVP Version:** 1.0.0

🚀 Ready to code? Start backend and frontend, then open http://localhost:5173!
