import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import logoSrc from "../assets/MediVision Logo.png";
import NeedHelpIcon from "../assets/NeedHelpIcon.jpeg";
import FAQOverlay from "./FAQOverlay";

const roles = [
  { id: "admin", label: "Admin" },
  { id: "staff", label: "Staff (Doctor & Nurse)" },
  { id: "patient", label: "Patient" },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const navigate = useNavigate();

  const handleBackgroundClick = () => {
    if (isFaqOpen) return;
    setSelectedRole(null);
  };

  return (
    <div 
      className="min-h-screen flex flex-col select-none" 
      style={{ fontFamily: "'Zen Kaku Gothic Antique', sans-serif", backgroundColor: "#ffffff" }}
      onClick={handleBackgroundClick}
    >

      {/* Top Navigation */}
      <nav className="w-full py-9 flex items-center">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigate('/');
          }}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors ml-[580px]" 
          style={{ fontSize: "12.8px" }}
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          <span>Return Back</span>
        </button>
        <p className="text-gray-500 ml-auto mr-12" style={{ fontSize: "12.8px" }}>
          Haven't become a Member?{" "}
          <button 
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-gray-800 hover:text-blue-700 tracking-wide transition-colors underline" 
            style={{ fontSize: "12.8px" }}
          >
            SIGN UP NOW
          </button>
        </p>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pl-28 px-6 py-8">
        <div className="flex flex-row items-center justify-center gap-16 lg:gap-28 w-full max-w-3xl">

          {/* LEFT: Logo */}
          <div className="flex-shrink-0" style={{ transform: "translateX(-200px)" }}>
            <img
              src={logoSrc}
              alt="MediVision"
              className="w-80 h-80 md:w-72 md:h-72 object-contain"
              style={{ backgroundColor: "#ffffff"}}
            />
          </div>

          {/* RIGHT: Role Selection */}
          <div className="w-full max-w-xs md:max-w-sm">
            <div className="text-center mb-6">
              <h1 className="font-bold text-gray-800 tracking-wide" style={{ fontSize: "25px" }}>
                WELCOME TO{" "}
                <span style={{ color: "#1a5caa" }}>MEDI</span>
                <span style={{ color: "#cc2229" }}>VISION</span>
              </h1>
              <p className="text-gray-500 mt-1 font-medium uppercase" style={{ fontSize: "16px", letterSpacing: "0px" }}>
                SELECT YOUR ROLE
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRole(role.id);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-5 py-4 border text-left
                    transition-all duration-150 bg-white rounded-none
                    ${selectedRole === role.id
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }
                  `}
                >
                  <User
                    size={17}
                    strokeWidth={1.6}
                    className={selectedRole === role.id ? "text-blue-500" : "text-gray-400"}
                  />
                  <span className="font-normal" style={{ fontSize: "16px", color: selectedRole === role.id ? "" : "#424242" }}>{role.label}</span>
                </button>
              ))}
            </div>

            <button
              disabled={!selectedRole}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedRole === 'admin') {
                  navigate('/login-admin');
                } else if (selectedRole === 'staff') {
                  navigate('/login-staff');
                } else if (selectedRole === 'patient') {
                  navigate('/login-patient');
                }
                // Add navigation for other roles later
              }}
              className={`
                w-full flex items-center justify-between px-6 py-4 rounded-none text-white font-semibold
                transition-all duration-150
                ${selectedRole ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
              `}
              style={{ backgroundColor: selectedRole ? "#2D5EA4" : "#7aaad4" }}
            >
              <span className="text-sm tracking-wide">Enter</span>
              <ArrowRight size={18} strokeWidth={2} />
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-9 flex items-center">
        <p className="text-gray-400 ml-[580px]" style={{ fontSize: "12.8px" }}>
          Copyright 2025 - 2026 MediVision Inc. All rights Reserved.
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFaqOpen(true);
          }}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors ml-auto mr-12" 
          style={{ fontSize: "12.8px" }}
        >
          <img src={NeedHelpIcon} alt="Need Help" className="w-4 h-4 object-contain" />
          <span>Need Help?</span>
        </button>
      </footer>

      <FAQOverlay isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
    </div>
  );
}