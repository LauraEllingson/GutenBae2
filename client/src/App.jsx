// src/App.jsx
import React from 'react';
import './App.css';
import Registration from './Registration';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protect the Dashboard route */}
        <Route 
          path="/dashboard" 
          element={<PrivateRoute element={<Dashboard />} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

