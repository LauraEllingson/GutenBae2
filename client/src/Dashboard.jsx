import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [likedBooks, setLikedBooks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Check if token exists, if not, redirect to login
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
      .then((response) => {
        setUser(response.data.user); 
        const userId = response.data.user._id;

        // Get liked books
        axios
        .get(`http://localhost:3001/users/${userId}/liked-books`, {
          headers: { Authorization: `Bearer ${token}` }
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

  return (
    <div>
      <h2>Your Liked Books</h2>
      {error && <p>{error}</p>}
      <div className="liked-books-list">
        {likedBooks.length === 0 ? (
          <p>No liked books found.</p>
        ) : (
          likedBooks.map((book) => (
            <div key={book.bookId} className="book-card">
              <img src={book.imageUrl} alt={book.title} />
              <h3>{book.title}</h3>
              <p>{book.authors}</p>
              <p>{book.description}</p>
              {/* Add options to share or delete  */}
              <button>Share</button>
              <button>Delete</button>
            </div>
          ))
        )}
      </div>

      {/* Add a link to Home */}
      <Link to="/" className="home-link">Go back to Home</Link>
    </div>
  );
};

export default Dashboard;
