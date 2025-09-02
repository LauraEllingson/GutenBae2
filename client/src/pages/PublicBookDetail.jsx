import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { formatMultilineTitle } from "../utils/formatMultilineTitle";
import { shareBook } from "../utils/shareBook";
import Nav from "../components/Nav";
import {
  IconRead,
  IconEPUB,
  IconKindle,
  IconShare,
  IconHeart,
  IconHeartOutline,
} from "../utils/icons";

// For local dev: http://localhost:3001
// For production: https://gutenbae2.onrender.com
const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:3001"
    : "https://gutenbae2.onrender.com";

/* ---------- Stars ---------- */
const Star = ({ filled, onClick, onMouseEnter, onMouseLeave, size = 20 }) => (
  <svg
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className="cursor-pointer inline-block"
    fill={filled ? "#f5b301" : "none"}
    stroke="#f5b301"
    strokeWidth="2"
  >
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          filled={(hover || value) >= n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {value || hover || 0}/5
      </span>
    </div>
  );
};
/* ---------- /Stars ---------- */

const PublicBookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likedBookIds, setLikedBookIds] = useState(new Set());

  // Reviews state
  const [reviews, setReviews] = useState([]); // [{_id, userId, userName, rating, text, createdAt}]
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch liked IDs when logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${API_BASE}/user/liked-book-ids`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          // Normalize to numbers to match Gutendex book.id
          const ids = new Set((res.data.likedBookIds || []).map((x) => Number(x)));
          setLikedBookIds(ids);
        })
        .catch(() => console.error("Failed to fetch liked book IDs"));
    }
  }, []);

  // Fetch book details (robust)
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError("Invalid or missing book ID in the URL.");
      return;
    }
    let cancel = false;
    axios
      .get(`https://gutendex.com/books/${id}`, { timeout: 12000 })
      .then((res) => {
        if (cancel) return;
        if (!res?.data || res?.data?.detail) {
          setError(res?.data?.detail || "Book not found.");
          return;
        }
        setBook(res.data);
        setLiked(likedBookIds.has(Number(res.data.id)));
      })
      .catch((err) => {
        if (cancel) return;
        setError(
          err?.response?.data?.detail || err?.message || "Failed to load book details."
        );
      });
    return () => {
      cancel = true;
    };
  }, [id]); // depend ONLY on id to avoid loops

  // Fetch reviews for this book
  useEffect(() => {
    if (!id) return;
    axios
      .get(`${API_BASE}/reviews/${id}`)
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => {
        // Don't block UI on reviews error
      });
  }, [id]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const handleShare = (b) => shareBook(b, setMessage);

  const toggleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Please log in to like this book.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (!book) return;
    if (likedBookIds.has(book.id)) {
      setMessage("This book is already in your library.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const likedBookData = {
      bookId: book.id,
      title: book.title,
      authors: Array.isArray(book.authors) ? book.authors.map((a) => a.name) : ["Unknown"],
      imageUrl: book.formats?.["image/jpeg"] || "",
      description:
        Array.isArray(book.summaries) && book.summaries.length
          ? book.summaries.join("\n\n")
          : "No description available",
      formats: book.formats || {},
    };

    try {
      await axios.post(`${API_BASE}/like-book`, likedBookData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiked(true);
      setLikedBookIds((prev) => new Set(prev).add(book.id));
      setMessage("Book saved to your library.");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Could not save the book.");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Please log in to leave a review.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (!myRating) {
      setMessage("Please select a star rating.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bookId: Number(id),
        rating: myRating,
        text: myText.trim(),
      };
      const res = await axios.post(`${API_BASE}/reviews`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews((prev) => [res.data.review, ...prev]);
      setMyRating(0);
      setMyText("");
      setMessage("Thanks! Your review has been posted.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not submit your review.");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!book) return <p className="text-center mt-10">Loading...</p>;

  const description =
    Array.isArray(book.summaries) && book.summaries.length
      ? book.summaries.join("\n\n")
      : "No description available";

  return (
    <>
      <Nav />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {message && (
          <div className="bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-md mb-4 text-center">
            {message}
          </div>
        )}

        <div className="text-sm sm:text-base text-gray-800 leading-relaxed max-w-4xl mx-auto">
          <h1 className="mb-2">
            {formatMultilineTitle(book.title, {
              firstLineClass:
                "text-2xl sm:text-3xl font-caslon-display leading-tight",
              otherLinesClass:
                "sm:text-lg font-caslon-display leading-snug",
            })}
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 italic mb-4">
            {(Array.isArray(book.authors) ? book.authors : [])
              .map((a) => a.name)
              .join(", ")}
          </p>

          <div className="mb-6">
            {book.formats?.["image/jpeg"] && (
              <img
                src={book.formats["image/jpeg"]}
                alt={book.title}
                className="float-left mr-4 mb-2 w-20 sm:w-24"
              />
            )}
            {description.split("\n\n").map((para, i) => (
              <p key={i} className={i > 0 ? "clear-left mt-4 text-sm" : ""}>
                {para}
              </p>
            ))}
          </div>

          {/* SAFE metadata list */}
          <ul className="mb-6 text-sm text-gray-700 space-y-1">
            <li><strong>ID:</strong> {book.id}</li>
            <li>
              <strong>Subjects:</strong>{" "}
              {Array.isArray(book.subjects) && book.subjects.length
                ? book.subjects.join(", ")
                : "N/A"}
            </li>
            <li>
              <strong>Bookshelves:</strong>{" "}
              {Array.isArray(book.bookshelves) && book.bookshelves.length
                ? book.bookshelves.join(", ")
                : "N/A"}
            </li>
            <li>
              <strong>Languages:</strong>{" "}
              {Array.isArray(book.languages) && book.languages.length
                ? book.languages.join(", ")
                : "N/A"}
            </li>
            <li>
              <strong>Translators:</strong>{" "}
              {Array.isArray(book.translators) && book.translators.length
                ? book.translators.map((t) => t.name).join(", ")
                : "None"}
            </li>
            <li><strong>Media Type:</strong> {book.media_type || "Unknown"}</li>
            <li><strong>Download Count:</strong> {book.download_count ?? "Unknown"}</li>
            <li>
              <strong>Copyright:</strong>{" "}
              {book.copyright === null
                ? "Unknown"
                : book.copyright
                ? "Yes"
                : "No"}
            </li>
            <li><strong>Publication Date:</strong> {book?.publication_date || "Unknown"}</li>
          </ul>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#cd2126] mb-6">
            {book.formats?.["text/html"] && (
              <a
                href={book.formats["text/html"]}
                target="_blank"
                rel="noopener noreferrer"
                title="Read in Browser"
              >
                <IconRead className="inline mr-1" /> Preview
              </a>
            )}
            {book.formats?.["application/epub+zip"] && (
              <a
                href={book.formats["application/epub+zip"]}
                target="_blank"
                rel="noopener noreferrer"
                title="Download EPUB"
              >
                <IconEPUB className="inline mr-1" /> EPUB
              </a>
            )}
            {book.formats?.["application/x-mobipocket-ebook"] && (
              <a
                href={book.formats["application/x-mobipocket-ebook"]}
                target="_blank"
                rel="noopener noreferrer"
                title="Download Kindle"
              >
                <IconKindle className="inline mr-1" /> Kindle
              </a>
            )}
            <button onClick={() => handleShare(book)} className="underline" title="Share">
              <IconShare className="inline mr-1" /> Share
            </button>
            <button onClick={toggleLike} className="text-[#cd2126] text-lg" title="Like">
              {liked ? <IconHeart /> : <IconHeartOutline />}
            </button>
          </div>

          {/* Reviews Section */}
          <div className="mt-10 border-t pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Reviews</h2>
              <div className="text-sm text-gray-600">
                {reviews.length ? (
                  <>
                    Average rating: <span className="font-medium">{averageRating}</span> (
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </>
                ) : (
                  "No reviews yet"
                )}
              </div>
            </div>

            {/* Write a review */}
            <div className="mb-6 bg-[#F9F7F5] border border-[#EBE5DF] rounded-2xl p-4">
              <p className="text-sm text-gray-700 mb-2">Leave a rating:</p>
              <StarRating value={myRating} onChange={setMyRating} />
              <textarea
                className="mt-3 w-full rounded-lg border border-[#EBE5DF] p-3 text-sm outline-none focus:ring-2 focus:ring-[#cd2126]"
                rows={4}
                placeholder="Share your thoughts (optional)…"
                value={myText}
                onChange={(e) => setMyText(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="bg-[#2B2B2B] text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Post review"}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                You must be logged in. One review per user (enforced on the server).
              </p>
            </div>

            {/* Existing reviews */}
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r._id} className="border border-[#EBE5DF] rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} filled={n <= (r.rating || 0)} size={16} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{r.rating}/5</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {r.userName || "Anonymous"} •{" "}
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {r.text ? <p className="mt-2 text-sm">{r.text}</p> : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm text-center sm:text-left mt-10">
            <Link to="/" className="text-gray-600 hover:underline">
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicBookDetail;
