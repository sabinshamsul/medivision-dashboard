import { useState } from "react";
import { useNavigate } from "react-router-dom";
import medivisionLogo from "../assets/MediVision Logo.png";
import "./AdminPage.css";

const newsArticles = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80",
    text: "The Malaysian Hospital Market is expected to reach $19.13b by 2034 at a Compound Annual Growth rate of 5.20%.",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&q=80",
    text: "Malaysia is Set to Adopt the Diagnosis-Related Group (DRG)-Based Hospital Payment System in a Bid to make Healthcare more Efficient, Transparent, and Sustainable.",
  },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="admin-container">
      {/* Navbar */}
      <header className="admin-navbar">
        <div className="navbar-left">
          {/* Square MediVision Logo */}
          <div className="navbar-logo-box">
            <img src={medivisionLogo} alt="MediVision" className="navbar-logo-img" />
          </div>

          {/* Return Back */}
          <button className="navbar-pill-btn" onClick={() => navigate(-1)}>
            <span className="btn-arrow">‹</span> Return Back
          </button>

          {/* Divider */}
          <div className="navbar-divider" />

          {/* Home */}
          <button className="navbar-pill-btn">Home</button>

          <span className="navbar-dashboard-title">Admin Dashboard</span>
        </div>

        <div className="navbar-right">
          {/* Dark/Light Mode Toggle */}
          <button
            className="navbar-circle-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>

          {/* Notification */}
          <button className="navbar-circle-btn" title="Notifications">
            💬
          </button>

          {/* Log Out */}
          <button
            className="navbar-pill-btn logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/");
            }}
          >
            ⏻ Log Out
          </button>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="admin-body">
        {/* Sidebar - empty blue strip */}
        <div className="admin-sidebar" />

        {/* Content */}
        <main className={`admin-content ${darkMode ? "" : "light"}`}>
          {/* Welcome heading */}
          <h2 className="welcome-heading">
            WELCOME TO <span className="text-blue">MEDI</span>
            <span className="text-red">VISION</span>
          </h2>

          {/* Big Logo on white card */}
          <div className="welcome-logo-card">
            <img src={medivisionLogo} alt="MediVision Logo" className="welcome-logo" />
          </div>

          {/* News Cards */}
          <div className="news-cards">
            {newsArticles.map((article) => (
              <div key={article.id} className={`news-card ${darkMode ? "" : "light"}`}>
                <img src={article.image} alt="news" className="news-card-img" />
                <div className="news-card-body">
                  <p className="news-card-text">{article.text}</p>
                  <div className="news-card-action">
                    <button className="read-more-btn">Read More</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
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
