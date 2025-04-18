import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/r_submark.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        navigate("/dashboard");
      })
      .catch(() => {
        alert("Error logging in");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ccd8f6] via-[#0f3596] to-[#0f3596] px-4 pt-6 pb-12">
      <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        <img src={logo} alt="GutenBae logo" className="w-28 h-28 mb-3" />
        <h1
          className="text-[#cd2126] text-4xl font-bold mb-6"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          GUTENBAE
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-md w-full flex flex-col gap-4 text-center"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Login to your account
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg px-4 py-3 text-sm border border-gray-300 focus:outline-none"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg px-4 py-3 text-sm border border-gray-300 focus:outline-none"
          />

          <label className="flex items-center gap-2 text-xs text-gray-600 -mt-2">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>

          <button
            type="submit"
            className="bg-[#cd2126] text-white font-semibold py-3 rounded-lg shadow hover:bg-[#b41c20] transition"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="bg-white border border-gray-300 text-black font-semibold py-3 rounded-lg shadow hover:opacity-90"
          >
            Sign up
          </button>
        </form>
        </div>

<div className="text-center mt-6">
  <button
    onClick={() => navigate("/")}
    className="text-white underline text-sm hover:text-gray-200 transition"
  >
    ← Back Home
  </button>
</div>
</div>

    
    
  );
};

export default Login;
