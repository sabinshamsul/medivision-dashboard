import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import RoleSelection from './components/RoleSelection';
import SplashPage from './components/SplashPage';
import LoginAsAdmin from './components/LoginAsAdmin';
import LoginAsStaff from './components/LoginAsStaff';
import LoginAsPatient from './components/LoginAsPatient';
import PatientRegistration from './components/PatientRegistration';
import AdminDashboard from './components/AdminDashboard';
import AdminPage from './components/AdminPage';
import ClinicianDashboard from './components/ClinicianDashboard';
import './index.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/" />;
    }

    let user;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        return <Navigate to="/" />;
      }
      user = JSON.parse(storedUser);
    } catch (e) {
      return <Navigate to="/" />;
    }

    if (!user || !user.role) {
      return <Navigate to="/" />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-admin" element={<LoginAsAdmin />} />
        <Route path="/login-staff" element={<LoginAsStaff />} />
        <Route path="/login-patient" element={<LoginAsPatient />} />
        
        <Route 
          path="/register" 
          element={<PatientRegistration />} 
        />

        <Route path="/admin-page" element={<AdminPage />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/clinician"
          element={
            <ProtectedRoute allowedRoles={['clinician']}>
              <ClinicianDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientRegistration />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
