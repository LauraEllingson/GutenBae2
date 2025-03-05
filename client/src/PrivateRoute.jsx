
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem('token'); // Check for the token

  if (!token) {
    // If no token is found, redirect to login
    return <Navigate to="/login" />;
  }

  // If a token exists, render the protected component (element)
  return element;
};

export default PrivateRoute;
