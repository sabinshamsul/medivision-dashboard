import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoSrc from "../assets/MediVision Logo.png";
import NeedHelpIcon from "../assets/NeedHelpIcon.jpeg";
import "../password-field.css";
import FAQOverlay from "./FAQOverlay";

export default function LoginAsAdmin() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const navigate = useNavigate();

  const handlePasswordBlur = () => {
    if (password.trim() === "") {
      setPasswordError(true);
    } else {
      setPasswordError(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (e.target.value.trim() !== "") {
      setPasswordError(false);
    }
  };

  const isFormValid = username.trim() !== "" && email.trim() !== "" && password.trim() !== "";

  return (
    <div 
      className="min-h-screen flex flex-col select-none" 
      style={{ fontFamily: "'Zen Kaku Gothic Antique', sans-serif", backgroundColor: "#ffffff" }}
    >

      {/* Top Navigation */}
      <nav className="w-full py-9 flex items-center">
        <button 
          onClick={() => navigate('/role-selection')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors ml-[580px]" 
          style={{ fontSize: "12.8px" }}
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          <span>Return Back</span>
        </button>
        <p className="text-gray-500 ml-auto mr-12" style={{ fontSize: "12.8px" }}>
          Haven't become a Member?{" "}
          <button 
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

          {/* RIGHT: Login Form */}
          <div className="w-full max-w-xs md:max-w-sm">
            <div className="text-center mb-6">
              <h1 className="font-bold text-gray-800 tracking-wide" style={{ fontSize: "25px" }}>
                WELCOME TO{" "}
                <span style={{ color: "#1a5caa" }}>MEDI</span>
                <span style={{ color: "#cc2229" }}>VISION</span>
              </h1>
              <p className="text-gray-500 mt-1 font-medium uppercase" style={{ fontSize: "16px", letterSpacing: "0px" }}>
                LOG IN AS ADMIN
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {/* Username Field */}
              <div className="relative">
                <div className="w-full flex items-center gap-3 px-5 py-4 border border-gray-300 bg-white rounded-none">
                  <User size={17} strokeWidth={1.6} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type Here"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 outline-none bg-transparent font-normal placeholder-gray-400"
                    style={{ fontSize: "16px", color: "#424242" }}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="relative">
                <div className="w-full flex items-center gap-3 px-5 py-4 border border-gray-300 bg-white rounded-none">
                  <Mail size={17} strokeWidth={1.6} className="text-gray-400" />
                  <input
                    type="email"
                    placeholder="Type Here"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 outline-none bg-transparent font-normal placeholder-gray-400"
                    style={{ fontSize: "16px", color: "#424242" }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className={`w-full flex items-center gap-3 px-5 py-4 border bg-white rounded-none ${passwordError ? 'border-red-500' : 'border-gray-300'}`}>
                  <Lock size={17} strokeWidth={1.6} className="text-gray-400" />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Type Here"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    className={`flex-1 outline-none bg-transparent font-normal placeholder-gray-400 ${showPassword ? '' : 'password-mask'}`}
                    style={{ fontSize: "16px", color: "#424242" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                    style={{ fontSize: "12px" }}
                  >
                    {showPassword ? "hide" : "show"}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-1 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <circle cx="12" cy="17" r="1" fill="#dc2626" stroke="none"/>
                    </svg>
                    <span className="text-red-600" style={{ fontSize: "12px" }}>
                      Error, Fill in the Blank!
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={!isFormValid}
              onClick={() => navigate("/admin-page")}
              className={`
                w-full flex items-center justify-between px-6 py-4 rounded-none text-white font-semibold
                transition-all duration-150
                ${isFormValid ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
              `}
              style={{ backgroundColor: isFormValid ? "#2D5EA4" : "#7aaad4" }}
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
          onClick={() => setIsFaqOpen(true)}
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
