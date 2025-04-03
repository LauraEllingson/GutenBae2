import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import submark from './assets/r_submark.png'; 

const Registration = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        navigate('/login');
      })
      .catch(() => {
        alert("Error registering user!");
      });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-[#0f3596] via-[#0f3596] to-white rounded-t-3xl px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <img src={submark} alt="Gutenbae Logo" className="w-20 mb-3" />
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cd2126]"
            required
          />
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
    </div>
  );
};

export default Registration;
