import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import submark from '../assets/r_submark.png'; 

const Registration = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    axios.post('https://gutenbae2.onrender.com/register', { name, email, password })
      .then(() => {
        alert("Registration Successful!");
        navigate('/dashboard');
      })
      .catch(() => {
        alert("Error registering user!");
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#ccd8f6] via-[#0f3596] to-[#0f3596] px-4 pt-10 pb-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img src={submark} alt="Gutenbae Logo" className="w-28 mb-3" />
        <h1 className="text-4xl font-bold text-[#cd2126] tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          GUTENBAE
        </h1>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 text-center">Create an account</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cd2126]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cd2126]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cd2126]"
            required
          />
          <label className="flex items-center gap-2 text-xs mt-2 text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-[#cd2126] text-white py-2 rounded-lg font-semibold hover:bg-[#b41c20] transition"
        >
          Sign Up
        </button>

        <p className="text-center text-sm mt-3">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-[#cd2126] font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>

      {/* Back Home Link */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate("/")}
          className="text-white underline text-sm hover:text-gray-200 transition"
        >
          ← Back Home
        </button>
      </div>
    </div>
  );
};

export default Registration;
