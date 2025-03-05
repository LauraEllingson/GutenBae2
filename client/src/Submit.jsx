import React, { useState } from "react";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post("http://localhost:3001/login", { email, password });

    if (res.data.token) { 
      localStorage.setItem("token", res.data.token); // Store JWT token
      alert("Login Successful!");
      window.location.href = "/dashboard"; 
    } else {
      alert(res.data.error || "Login failed. Try again."); // Show backend error
    }
  } catch (error) {
    alert(error.response?.data?.error || "Login failed. Try again."); // Handle errors properly
  }
};


  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;

