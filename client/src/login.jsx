import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For redirection

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Use to redirect to dashboard

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form from reloading

    try {
      const res = await axios.post("http://localhost:3001/login", {
        email,
        password,
      });

      if (res.status === 200) {
        alert("Login Successful!");
        navigate("/dashboard"); // Redirect to Dashboard
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      alert("Invalid email or password");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
