import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "./assets/r_submark.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    axios
      .post("https://gutenbae2.onrender.com/login", { email, password })
      .then((response) => {
        localStorage.setItem("token", response.data.token);
        alert("Login Successful!");
        navigate("/dashboard");
      })
      .catch((error) => {
        alert("Error logging in");
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#002f9b] to-white">
      <div className="flex flex-col items-center p-6 w-full max-w-sm bg-transparent">
        <img src={logo} alt="GutenBae logo" className="w-20 h-20 mb-4" />
        <h1 className="text-[#cd2126] text-4xl font-bold mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>GUTENBAE</h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full text-center"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg px-4 py-3 text-sm border border-gray-300 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg px-4 py-3 text-sm border border-gray-300 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-white text-black font-semibold py-3 rounded-lg shadow hover:opacity-90"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="bg-white text-black font-semibold py-3 rounded-lg shadow hover:opacity-90"
          >
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
