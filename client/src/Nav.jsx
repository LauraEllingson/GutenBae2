import React from 'react';
import { Link } from 'react-router-dom';
import submark from './assets/r_submark.png';

const Nav = () => {
  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 shadow-md bg-white w-full">
      {/* Left section: logo and title */}
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <img src={submark} alt="GutenBae Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
        
      </div>

      {/* Right section: links */}
      <div className="space-x-4 sm:space-x-6 text-xs sm:text-base font-semibold text-gray-800">
        <Link to="/about" className="hover:text-[#cd2126]">About</Link>
        <Link to="/how-it-works" className="hover:text-[#cd2126]">How It Works</Link>
        <Link to="/login" className="hover:text-[#cd2126]">Login</Link>
      </div>
    </nav>
  );
};

export default Nav;

