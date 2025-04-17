import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import submark from '../assets/r_submark.png';

const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { loggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 shadow-md bg-white w-full">
      
      {/* Logo as link to home */}
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <Link to="/">
          <img src={submark} alt="GutenBae Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
        </Link>
      </div>

      <div className="space-x-4 sm:space-x-6 text-xs sm:text-base font-semibold">
        {loggedIn ? (
          <>
            <Link
              to="/dashboard"
              className={`hover:text-[#cd2126] ${isActive('/dashboard') ? 'text-[#cd2126]' : 'text-gray-800'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/"
              className={`hover:text-[#cd2126] ${isActive('/') ? 'text-[#cd2126]' : 'text-gray-800'}`}
            >
              Search
            </Link>
            <button onClick={handleLogout} className="hover:text-[#cd2126] text-gray-800">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-[#cd2126] text-gray-800">
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Nav;
