import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`admin-container ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <img src="/medivision-logo.png" alt="MediVision" className="sidebar-logo-img" />
          {!sidebarCollapsed && <span className="sidebar-logo-text">MEDIVISION</span>}
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className="nav-item active">
              <span className="nav-icon">🏠</span>
              {!sidebarCollapsed && <span className="nav-label">Dashboard</span>}
            </li>
            <li className="nav-item">
              <span className="nav-icon">👥</span>
              {!sidebarCollapsed && <span className="nav-label">Patients</span>}
            </li>
            <li className="nav-item">
              <span className="nav-icon">🩺</span>
              {!sidebarCollapsed && <span className="nav-label">Doctors</span>}
            </li>
            <li className="nav-item">
              <span className="nav-icon">📅</span>
              {!sidebarCollapsed && <span className="nav-label">Appointments</span>}
            </li>
            <li className="nav-item">
              <span className="nav-icon">🏥</span>
              {!sidebarCollapsed && <span className="nav-label">Departments</span>}
            </li>
            <li className="nav-item">
              <span className="nav-icon">📊</span>
              {!sidebarCollapsed && <span className="nav-label">Reports</span>}
            </li>
            <li className="nav-item">
              <span className="nav-icon">⚙️</span>
              {!sidebarCollapsed && <span className="nav-label">Settings</span>}
            </li>
          </ul>
        </nav>

        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Navbar */}
        <header className="admin-navbar">
          <div className="navbar-left">
            <button className="navbar-btn" onClick={() => navigate(-1)}>
              <span>‹</span> Return Back
            </button>
            <button className="navbar-btn active">Home</button>
            <span className="navbar-title">Admin Portal</span>
          </div>

          <div className="navbar-right">
            <button className="navbar-icon-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
              🌙
            </button>
            <button className="navbar-icon-btn">
              <span className="navbar-user-icon">👤</span>
              <span>Admin</span>
            </button>
            <button className="navbar-icon-btn">💬</button>
            <button className="navbar-icon-btn">⚙️</button>
            <button className="navbar-btn logout-btn" onClick={() => navigate('/login')}>
              🚪 Log Out
            </button>
          </div>
        </header>

        {/* Page Content - Empty area ready for future content */}
        <div className="admin-content">
          <div className="admin-welcome-card">
            <h2>Welcome, Admin</h2>
            <p>Select an option from the sidebar to get started.</p>
          </div>
        </div>
      </div>

      {/* Feedback Button */}
      <button className="admin-feedback-btn">Feedback</button>

      {/* Help Button */}
      <div className="admin-help">
        <button className="admin-help-btn">🤖</button>
        <span className="help-label">Need Help?</span>
      </div>
    </div>
  );
};

export default AdminPage;