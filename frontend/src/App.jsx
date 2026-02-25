import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import PatientRegistration from './components/PatientRegistration';
import AdminDashboard from './components/AdminDashboard';
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

    const user = JSON.parse(localStorage.getItem('user'));
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route 
          path="/register" 
          element={<PatientRegistration />} 
        />
        
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
