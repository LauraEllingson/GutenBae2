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

    // Verify token with backend
    axios
      .post(
        "https://gutenbae2.onrender.com/verify-token",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setUser(response.data.user);
        const userId = response.data.user._id;

        // Get liked books
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

  // Delete liked Book  confirmation prompt
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

  // Share function to copy share URL to clipboard
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
              <div className="book-info">
                <h3 className="book-title">
                  {capitalizeTitle(cleanTitle(book.title))}
                </h3>
                <p className="book-author">{book.authors.join(", ")}</p>
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
                <button
                  className="share-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(book.bookId);
                  }}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/" className="home-link">
        Go back to Home
      </Link>
    </div>
  );
};

export default Dashboard;
