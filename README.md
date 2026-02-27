# MediVision - Patient Flow Management System MVP

A comprehensive hospital emergency department management system with patient registration, admin dashboard, and clinician views.

## 🚀 Features

### 1. Patient Registration
- Complete patient information capture
- Vital signs recording
- Chief complaint documentation
- Automatic patient ID generation

### 2. Admin Dashboard
- Real-time patient statistics
- Triage distribution visualization (Pie Chart)
- Patient status overview (Bar Chart)
- Complete patient list with status management
- Update patient status (Waiting → In Treatment → Discharged)

### 3. Clinician Dashboard
- Waiting queue view
- In-treatment patients view
- Quick patient assignment
- Vital signs display
- Triage category indicators (1-5)
- One-click patient status updates

## 📋 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18
- Vite
- React Router DOM v6
- Tailwind CSS
- Recharts (Charts & Visualizations)
- Lucide React (Icons)
- Axios

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Git

### Step 1: Clone & Navigate
```bash
# If from GitHub (replace with your repo URL)
git clone <your-repo-url>
cd medivision-mvp

# OR if using these files directly
# Just navigate to the medivision-mvp folder
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (already created, but verify these values)
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/medivision
# JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Start MongoDB (if running locally)
# Windows: Open MongoDB Compass or run mongod
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Run backend server
npm run dev
```

**You should see:**
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

### Step 3: Frontend Setup

Open a NEW terminal (keep backend running):

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 4: Create Demo Users

Open a third terminal and run this script to create demo users:

```bash
cd backend

# Create a file: createUsers.js
```

**Create `backend/createUsers.js`:**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Create demo users
    const users = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        name: 'Admin User',
        email: 'admin@medivision.com'
      },
      {
        username: 'doctor',
        password: await bcrypt.hash('doctor123', 10),
        role: 'clinician',
        name: 'Dr. Sarah Johnson',
        email: 'doctor@medivision.com'
      },
      {
        username: 'patient',
        password: await bcrypt.hash('patient123', 10),
        role: 'patient',
        name: 'Patient User',
        email: 'patient@medivision.com'
      }
    ];

    await User.deleteMany({}); // Clear existing users
    await User.insertMany(users);
    
    console.log('✅ Demo users created!');
    console.log('Admin: admin / admin123');
    console.log('Clinician: doctor / doctor123');
    console.log('Patient: patient / patient123');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
```

> Note: This script is already included in the repository at `backend/createUsers.js`.  
> The code above is provided for reference; you do **not** need to recreate the file manually.

**Run it:**
```bash
cd backend
node createUsers.js
```

## 🎯 Usage Guide

### Access the Application

1. **Open browser:** http://localhost:5173

2. **Login with demo accounts:**
   - **Admin:** username: `admin`, password: `admin123`
   - **Clinician:** username: `doctor`, password: `doctor123`
   - **Patient:** username: `patient`, password: `patient123`

### Workflow Example

1. **Register a Patient:**
   - Login as patient or go directly to http://localhost:5173/register
   - Fill in all required fields
   - Submit to create patient

2. **View as Admin:**
   - Login as admin
   - See dashboard with statistics
   - View all patients in table
   - Update patient status using dropdown

3. **Manage as Clinician:**
   - Login as clinician
   - View waiting queue
   - Click "Start Treatment" to assign yourself
   - View patient details and vital signs
   - Click "Discharge Patient" when done

## 📊 Triage Categories

- **Category 1 (Red):** Critical - Immediate attention
- **Category 2 (Orange):** Emergency - 10 minutes
- **Category 3 (Yellow):** Urgent - 30 minutes
- **Category 4 (Green):** Semi-urgent - 60 minutes
- **Category 5 (Blue):** Non-urgent - 120 minutes

## 🗂️ Project Structure

```
medivision-mvp/
├── backend/
│   ├── models/
│   │   ├── Patient.js        # Patient schema
│   │   └── User.js           # User schema
│   ├── routes/
│   │   ├── patients.js       # Patient CRUD routes
│   │   └── auth.js           # Authentication routes
│   ├── server.js             # Express server
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx              # Login page
│   │   │   ├── PatientRegistration.jsx # Patient form
│   │   │   ├── AdminDashboard.jsx      # Admin view
│   │   │   └── ClinicianDashboard.jsx  # Clinician view
│   │   ├── services/
│   │   │   └── api.js                  # API calls
│   │   ├── App.jsx                     # Main app with routing
│   │   ├── main.jsx                    # Entry point
│   │   └── index.css                   # Tailwind styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PATCH /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/stats/overview` - Get statistics

## 🚧 Known Limitations (MVP)

- No AI triage implementation (placeholder category)
- No chatbot integration
- No real-time updates (uses polling)
- Basic authentication (no refresh tokens)
- No image upload for patient documents
- No email notifications
- No appointment scheduling
- No bed management

## 🔜 Future Enhancements

1. **AI Integration (Hasri)**
   - Implement AI triage using scikit-learn
   - Integrate ChatGPT API for chatbot

2. **Real-time Updates (Syahmi)**
   - Implement WebSocket for live updates
   - Real-time patient tracking

3. **Enhanced UI (Jerry + Asfa)**
   - More interactive charts
   - Better mobile responsiveness
   - Patient portal view

4. **Database Improvements (Kelvin)**
   - Add more schemas (Beds, Departments, etc.)
   - Implement data analytics pipelines

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
# Windows: Check Task Manager
# Mac: brew services list
# Linux: sudo systemctl status mongod

# Check port 5000 is not in use
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -ti:5000
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Can't login
```bash
# Recreate demo users
cd backend
node createUsers.js
```

### MongoDB connection error
```bash
# If using local MongoDB:
# Make sure MongoDB is installed and running

# OR use MongoDB Atlas (cloud):
# 1. Go to mongodb.com/cloud/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Update MONGO_URI in backend/.env
```

## 👥 Team Members & Roles

- **Syahmi** - System Integrator (Backend, API, Integration)
- **Asfa** - Frontend Developer (UI implementation)
- **Jerry** - UI/UX Designer (Design system, components)
- **Kelvin** - Database Designer (MongoDB schemas, data flow)
- **Hasri** - AI Developer (Future: AI triage, chatbot)

## 📝 License

This project is for educational purposes (Capstone Project).

## 🆘 Support

For issues or questions:
1. Check this README first
2. Check browser console (F12) for errors
3. Check backend terminal for errors
4. Ask team members in group chat

---

**Last Updated:** February 2026
**Version:** 1.0.0 (MVP)
