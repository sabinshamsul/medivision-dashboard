import React from 'react';
import medivisionLogo from '../assets/MediVision Logo.png';

const SplashPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <img
        src={medivisionLogo}
        alt="MediVision Logo"
        className="w-96 h-96 object-contain"
      />
    </div>
  );
};

export default SplashPage;
