
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem('token'); // Check for  token

  if (!token) {
    // If no token is found, redirect to login
    return <Navigate to="/login" />;
  }

  // If a token exists, render
  return element;
};

export default PrivateRoute;
