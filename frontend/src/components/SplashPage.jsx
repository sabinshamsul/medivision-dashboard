import React from 'react';
import { useNavigate } from 'react-router-dom';
import medivisionLogo from '../assets/MediVision Logo.png';

const SplashPage = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/role-selection');
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-white cursor-pointer"
      onClick={handleClick}
    >
      <img
        src={medivisionLogo}
        alt="MediVision Logo"
        className="w-[732px] h-[732px] object-contain"
      />
    </div>
  );
};

export default SplashPage;
