import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import PatientRegistration from './components/PatientRegistration';
import PatientWaitingScreen from './components/PatientWaitingScreen';
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
        <Route path="/" element={<Login />} />
        
        <Route
          path="/register"
          element={<PatientRegistration />}
        />

        <Route
          path="/waiting/:id"
          element={<PatientWaitingScreen />}
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
          element={<Navigate to="/register" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
