import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Access denied. Please log in.");
      navigate("/login");
      return;
    }

    // Verify token with backend
    axios
      .post("http://localhost:3001/verify-token", {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        setUserName(res.data.user.name); // Save name from token payload
      })
      .catch(() => {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? (
        <p>Welcome, {userName || "User"}!</p> // Display user's name or a fallback message
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;


//make this page a protected page only accesible if logged in


//search for books
//View saved books with share and download options
//categorize saved books 
//delete a book