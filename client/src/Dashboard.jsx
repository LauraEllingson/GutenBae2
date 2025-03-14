import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./index.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [likedBooks, setLikedBooks] = useState([]);
  const [error, setError] = useState(null);

  const cleanTitle = (title) => title.replace(/\$b/g, "");
  const capitalizeTitle = (title) => title.replace(/\b\w/g, (char) => char.toUpperCase());

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
    if (!window.confirm("Are you sure you want to delete this liked book? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return console.error("User not logged in");

    try {
      await axios.delete(`https://gutenbae2.onrender.com/like-book/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLikedBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));
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
      <Link to="/" className="home-link">Back to Home</Link>
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
              className="book-card" 
              onClick={() => navigate(`/shared-book/${book.bookId}`)}
            >
              {/* Delete Button */}
              <button 
                className="delete-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(book._id);
                }}
              >
                X
              </button>

              {/* Book Cover */}
              <div className="book-image">
                <img src={book.imageUrl} alt={book.title} />
              </div>

              {/* Book Details (Reveal on Hover) */}
              <div className="book-details">
                <h3 className="book-title">{capitalizeTitle(cleanTitle(book.title))}</h3>
                <p className="book-author"><strong>Author:</strong> {book.authors?.join(", ") || "Unknown"}</p>
                
                <p className="download-options">
  {book.formats && Object.keys(book.formats).length > 0 ? (
    <>
      {book.formats["application/epub+zip"] && (
        <a 
          href={book.formats["application/epub+zip"]} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          EPUB
        </a>
      )}
      {book.formats["application/x-mobipocket-ebook"] && (
        <>
          {" | "}
          <a 
            href={book.formats["application/x-mobipocket-ebook"]} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Kindle
          </a>
        </>
      )}
      {book.formats["text/html"] && (
        <>
          {" | "}
          <a 
            href={book.formats["text/html"]} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            HTML
          </a>
        </>
      )}
    </>
  ) : (
    <p>Click for download options</p>
  )}
</p>

                {/* Share Button */}
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
    </div>
  );
};

export default Dashboard;
