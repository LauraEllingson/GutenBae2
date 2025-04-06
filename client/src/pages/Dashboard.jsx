import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import { useAuth } from "../AuthContext";
import logo from "../assets/logo.png";
import DashboardBookCard from "../components/DashboardBookCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [likedBooks, setLikedBooks] = useState([]);
  const [error, setError] = useState(null);

  const { loggedIn, login } = useAuth();

  const cleanTitle = (title) => title.replace(/\$b/g, "");
  const capitalizeTitle = (title) =>
    title.replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Access denied. Please log in.");
      navigate("/login");
      return;
    }

    axios
      .post(
        "https://gutenbae2.onrender.com/verify-token",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        setUser(res.data.user);
        login(); 
        return axios.get(
          `https://gutenbae2.onrender.com/users/${res.data.user._id}/liked-books`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      })
      .then((res) => {
        setLikedBooks(res.data.likedBooks);
      })
      .catch(() => {
        setError("Failed to fetch liked books");
      });
  }, [navigate, login]);

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to remove this book?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `https://gutenbae2.onrender.com/like-book/${bookId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLikedBooks((prev) => prev.filter((book) => book._id !== bookId));
    } catch (err) {
      console.error("Error deleting book:", err);
    }
  };

  const handleShare = async (bookId) => {
    const url = `${window.location.origin}/shared-book/${bookId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      alert("Could not copy link.");
    }
  };

  return (
    <>
      <Nav />
      <div className="flex flex-col items-center w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <img
          src={logo}
          alt="GutenBae logo"
          className="w-30 h-auto mt-6 mb-4"
        />
  
        <div className="w-full max-w-7xl bg-white min-h-screen px-4 sm:px-6 md:px-8 py-6">
          <div className="flex flex-col gap-2 mb-6 text-center md:text-left">
            {user && (
              <h3 className="text-sm md:text-lg font-light text-gray-700">
                Welcome, {user.name}!
              </h3>
            )}
            <h4 className="text-md md:text-lg font-semibold text-[#cd2126]">
              Your Liked Books
            </h4>
          </div>
  
          {error && <p className="text-red-600 mb-2">{error}</p>}
  
          {likedBooks.length === 0 ? (
            <p className="text-gray-500 italic">No liked books yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- lg:grid-cols-4 xl:grid-cols-4 gap-4 justify-items-center">
              {likedBooks.map((book) => (
                <DashboardBookCard
                  key={book._id}
                  book={book}
                  onClick={() => navigate(`/shared-book/${book.bookId}`)}
                  onDelete={() => handleDelete(book._id)}
                  onShare={() => handleShare(book.bookId)}
                  cleanTitle={cleanTitle}
                  capitalizeTitle={capitalizeTitle}
                />
              ))}
            </div>
          )}
  
          {/* Back to Home Link at Bottom */}
          <div className="mt-10 text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:underline inline-block"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
  
};

export default Dashboard;
