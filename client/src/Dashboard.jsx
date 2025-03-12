import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./index.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [likedBooks, setLikedBooks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Access denied. Please log in.");
      navigate("/login");
      return;
    }

    // Verify token with backend
    axios
      .post(
        "http://localhost:3001/verify-token",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setUser(response.data.user);
        const userId = response.data.user._id;

        // Get liked books
        axios
          .get(`http://localhost:3001/users/${userId}/liked-books`, {
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

  // Delete liked Book function
  const handleDelete = async (bookId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("User not logged in");
      return;
    }
    try {
      await axios.delete(`http://localhost:3001/like-book/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLikedBooks((prevBooks) =>
        prevBooks.filter((book) => book.bookId !== bookId)
      );
      console.log("Book deleted successfully");
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  return (
    <div>
      {user && <h2>Welcome, {user.name}!</h2>}
      <h3>Your Liked Books</h3>
      {error && <p>{error}</p>}
      {likedBooks.length === 0 ? (
        <p>No liked books found.</p>
      ) : (
        <div className="liked-books-grid">
          {likedBooks.map((book) => (
            <div 
              key={book.bookId} 
              className="book-card" 
              onClick={() => navigate(`/shared-book/${book.bookId}`)}
              style={{ cursor: "pointer" }}
            >
              <img src={book.imageUrl} alt={book.title} />
              <h3>{book.title}</h3>
              <p>{book.authors.join(", ")}</p>
              <div className="card-buttons">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(book.bookId);
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="download-options">
                {book.formats?.epub && (
                  <a
                    href={book.formats.epub}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download EPUB
                  </a>
                )}
                {book.formats?.html && (
                  <a
                    href={book.formats.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Read HTML
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/" className="home-link">Go back to Home</Link>
    </div>
  );
};

export default Dashboard;
