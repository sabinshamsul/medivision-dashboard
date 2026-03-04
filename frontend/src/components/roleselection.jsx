import { useState } from "react";
import { ArrowLeft, ArrowRight, User, Info } from "lucide-react";
import logoSrc from "../assets/MediVision Logo.png";

const roles = [
  { id: "admin", label: "Admin" },
  { id: "staff", label: "Staff (Doctor & Nurse)" },
  { id: "patient", label: "Patient" },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans select-none">

      {/* Top Navigation */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition-colors">
          <ArrowLeft size={15} strokeWidth={1.8} />
          <span>Return Back</span>
        </button>
        <p className="text-sm text-gray-500">
          Haven't become a Member?{" "}
          <button className="font-bold text-gray-800 hover:text-blue-700 tracking-wide transition-colors">
            SIGN UP NOW
          </button>
        </p>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="flex flex-row items-center justify-center gap-16 lg:gap-28 w-full max-w-3xl">

          {/* LEFT: Logo */}
          <div className="flex-shrink-0">
            <img
              src={logoSrc}
              alt="MediVision"
              className="w-44 h-44 md:w-52 md:h-52 object-contain"
            />
          </div>

          {/* RIGHT: Role Selection */}
          <div className="w-full max-w-xs md:max-w-sm">
            <div className="text-center mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">
                WELCOME TO{" "}
                <span style={{ color: "#cc2229" }}>MEDIVISION</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 tracking-widest font-medium uppercase">
                Select Your Role
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                    w-full flex items-center gap-3 px-5 py-4 rounded border text-left text-sm
                    transition-all duration-150 bg-white
                    ${selectedRole === role.id
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                    }
                  `}
                >
                  <User
                    size={17}
                    strokeWidth={1.6}
                    className={selectedRole === role.id ? "text-blue-500" : "text-gray-400"}
                  />
                  <span className="font-medium">{role.label}</span>
                </button>
              ))}
            </div>

            <button
              disabled={!selectedRole}
              className={`
                w-full flex items-center justify-between px-6 py-4 rounded text-white font-semibold
                transition-all duration-150
                ${selectedRole ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
              `}
              style={{ backgroundColor: selectedRole ? "#1a5caa" : "#7aaad4" }}
            >
              <span className="text-sm tracking-wide">Enter</span>
              <ArrowRight size={18} strokeWidth={2} />
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Copyright 2025 - 2026 MediVision Inc. All rights Reserved
        </p>
        <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
          <Info size={13} strokeWidth={1.8} />
          <span>Need Help?</span>
        </button>
      </footer>
    </div>
  );
}