import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

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
      .post("https://gutenbae2.onrender.com/verify-token", {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        return axios.get(`https://gutenbae2.onrender.com/users/${res.data.user._id}/liked-books`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => {
        setLikedBooks(res.data.likedBooks);
      })
      .catch(() => {
        setError("Failed to fetch liked books");
      });
  }, [navigate]);

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to remove this book?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`https://gutenbae2.onrender.com/like-book/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <div className="px-6 py-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#cd2126]">Dashboard</h2>
        <Link to="/" className="text-sm text-gray-600 hover:underline">← Back to Home</Link>
      </div>

      {user && <h3 className="text-lg mb-4 text-gray-700">Welcome, {user.name}!</h3>}
      <h4 className="text-md font-semibold mb-2 text-[#cd2126]">Your Liked Books</h4>

      {error && <p className="text-red-600">{error}</p>}

      {likedBooks.length === 0 ? (
        <p className="text-gray-500 italic">No liked books yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {likedBooks.map((book) => (
            <div
              key={book._id}
              className="border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition cursor-pointer relative bg-white"
              onClick={() => navigate(`/shared-book/${book.bookId}`)}
            >
              {/* Delete button */}
              <button
                className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(book._id);
                }}
              >
                ✕
              </button>

              {/* Book Cover */}
              <div className="h-[150px] w-full mb-3 overflow-hidden flex items-center justify-center bg-gray-100">
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} className="max-h-full object-contain" />
                ) : (
                  <div className="text-sm text-gray-500 italic">No Cover</div>
                )}
              </div>

              {/* Title & Author */}
              <h3 className="font-semibold text-[17px] mb-1">{capitalizeTitle(cleanTitle(book.title))}</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Author:</strong> {book.authors?.join(", ") || "Unknown"}
              </p>

              {/* Download Links */}
              <p className="text-sm text-[#cd2126] mb-3">
                {book.formats?.["application/epub+zip"] && (
                  <a
                    href={book.formats["application/epub+zip"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    EPUB
                  </a>
                )}
                {book.formats?.["application/x-mobipocket-ebook"] && <>{" | "}
                  <a
                    href={book.formats["application/x-mobipocket-ebook"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Kindle
                  </a>
                </>}
                {book.formats?.["text/html"] && <>{" | "}
                  <a
                    href={book.formats["text/html"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    HTML
                  </a>
                </>}
              </p>

              {/* Share button */}
              <button
                className="text-xs text-gray-500 underline hover:text-[#cd2126]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(book.bookId);
                }}
              >
                Share
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
