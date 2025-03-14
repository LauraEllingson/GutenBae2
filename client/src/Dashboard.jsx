import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./index.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [likedBooks, setLikedBooks] = useState([]);
  const [error, setError] = useState(null);

  const cleanTitle = (title) => {
    return title.replace(/\$b/g, "");
  };

  const capitalizeTitle = (title) => {
    return title.replace(/\b\w/g, (char) => char.toUpperCase());
  };

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
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setUser(response.data.user);
        const userId = response.data.user._id;

        axios
          .get(`https://gutenbae2.onrender.com/users/${userId}/liked-books`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setLikedBooks(res.data.likedBooks);
          })
          .catch(() => {
            setError("Failed to fetch liked books");
          });
      })
      .catch(() => {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  const handleDelete = async (bookId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this liked book? This action cannot be undone."
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("User not logged in");
      return;
    }
    try {
      await axios.delete(`https://gutenbae2.onrender.com/like-book/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLikedBooks((prevBooks) =>
        prevBooks.filter((book) => book._id !== bookId)
      );
      console.log("Book deleted successfully");
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  const handleShare = async (bookId) => {
    const shareUrl = `${window.location.origin}/shared-book/${bookId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Error copying share link:", error);
      alert("Failed to copy share link");
    }
  };

  return (
    <div>
      <Link to="/" className="home-link">
        Back to Home
      </Link>
      {user && <h2>Welcome, {user.name}!</h2>}
      <h3>Your Liked Books</h3>
      {error && <p>{error}</p>}
      {likedBooks.length === 0 ? (
        <p>No liked books found.</p>
      ) : (
        <div className="liked-books-grid">
          {likedBooks.map((book) => (
            <div 
              key={book._id} 
              className="book-container" 
              onClick={() => navigate(`/shared-book/${book.bookId}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="book-card">
                <button 
                  className="delete-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(book._id);
                  }}
                >
                  X
                </button>
                <div className="book-image">
                  <img src={book.imageUrl} alt={book.title} />
                </div>
              </div>
              
                
           
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
