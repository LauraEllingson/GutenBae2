import React from 'react';
import { Link } from 'react-router-dom';
import submark from './assets/r_submark.png';

const Nav = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-white w-full">
      <div className="flex items-center gap-2">
        <img src={submark} alt="GutenBae Logo" className="w-8 h-8" />
        <span className="text-xl font-bebas font-bold text-[#cd2126]">GUTENBAE</span>
      </div>
      <div className="space-x-6 text-sm font-semibold text-gray-800">
        <Link to="/about" className="hover:text-[#cd2126]">About</Link>
        <Link to="/how-it-works" className="hover:text-[#cd2126]">How It Works</Link>
        <Link to="/login" className="hover:text-[#cd2126]">Login</Link>
      </div>
    </nav>
  );
};

export default Nav;
