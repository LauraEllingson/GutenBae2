import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './PrivateRoute';
import PublicBookDetail from './pages/PublicBookDetail'; // public detail page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        {/* Public detail page */}
        <Route path="/shared-book/:id" element={<PublicBookDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

