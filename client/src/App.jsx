import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './PrivateRoute';
import PublicBookDetail from './pages/PublicBookDetail';
import { AuthProvider } from './AuthContext'; 

function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/shared-book/:id" element={<PublicBookDetail />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


