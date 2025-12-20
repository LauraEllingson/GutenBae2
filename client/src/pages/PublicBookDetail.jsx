import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
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
  IconTrash,
  IconEdit,
} from "../utils/icons";

// Use the Vite-provided API URL when available so dev/prod builds behave the same
const API_BASE = import.meta.env.VITE_API_URL || "https://gutenbae2.onrender.com";

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
  const [currentUser, setCurrentUser] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingRating, setEditingRating] = useState(5);
  const MAX_REVIEW_CHARS = 1200; // roughly ~3 average paragraphs

  const clampText = (text) => {
    if (!text) return "";
    if (text.length <= MAX_REVIEW_CHARS) return text;
    return text.slice(0, MAX_REVIEW_CHARS);
  };

  const countParagraphs = (text) => {
    const s = (text || "").toString().trim();
    if (!s) return 0;
    return s.split(/\n\s*\n/).filter(Boolean).length;
  };

  // Fetch liked IDs when logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // fetch liked ids and current user info
      axios
        .post(`${API_BASE}/verify-token`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setCurrentUser(res.data.user);
        })
        .catch(() => {
          // ignore verify failures
        });

      axios.get(`${API_BASE}/user/liked-book-ids`, { headers: { Authorization: `Bearer ${token}` } })
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

  // when reviews or currentUser change, if current user already has a review, prefill myRating/myText
  useEffect(() => {
    if (!currentUser || !reviews || !reviews.length) return;
    const mine = reviews.find((r) => String(r.userId) === String(currentUser._id) || String(r.userId) === String(currentUser.id));
    if (mine) {
      setMyRating(mine.rating || 0);
      setMyText(mine.text || "");
    }
  }, [currentUser, reviews]);

  // Listen for cross-tab review updates (BroadcastChannel with localStorage fallback)
  useEffect(() => {
    if (!id) return;
    let bc = null;
    const handleMessage = (msg) => {
      try {
        const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
        if (!data || !data.bookId) return;
        if (String(data.bookId) !== String(id)) return;

        // Prefer local diffs when possible
        if (data.type === 'review-updated') {
          const updated = data.review;
          if (updated && updated._id) {
            setReviews((prev) => {
              const idx = prev.findIndex((r) => r._id === updated._id);
              if (idx === -1) {
                // new review -> add to front
                return [updated, ...prev];
              }
              // replace existing
              const next = [...prev];
              next[idx] = updated;
              return next;
            });
            return;
          }
          // If we don't have the review object, fall back to refetch
          axios.get(`${API_BASE}/reviews/${id}`).then((res) => setReviews(res.data.reviews || [])).catch(() => {});
          return;
        }

        if (data.type === 'review-deleted') {
          const reviewId = data.reviewId || (data.review && data.review._id);
          if (reviewId) {
            setReviews((prev) => prev.filter((r) => r._id !== reviewId));
            return;
          }
          // fallback to refetch
          axios.get(`${API_BASE}/reviews/${id}`).then((res) => setReviews(res.data.reviews || [])).catch(() => {});
          return;
        }

        // unknown message type -> refetch
        axios.get(`${API_BASE}/reviews/${id}`).then((res) => setReviews(res.data.reviews || [])).catch(() => {});
      } catch (e) {
        // ignore malformed
      }
    };

    // Socket.IO real-time listener (server emits events)
    let socket = null;
    try {
      socket = io(API_BASE, { transports: ["websocket"] });
      socket.on('connect', () => {
        // console.log('socket connected', socket.id);
      });
      socket.on('review-updated', (data) => {
        if (String(data.bookId) !== String(id)) return;
        const updated = data.review;
        if (updated && updated._id) {
          setReviews((prev) => {
            const idx = prev.findIndex((r) => r._id === updated._id);
            if (idx === -1) return [updated, ...prev];
            const next = [...prev];
            next[idx] = updated;
            return next;
          });
        } else {
          // fallback
          axios.get(`${API_BASE}/reviews/${id}`).then((res) => setReviews(res.data.reviews || [])).catch(() => {});
        }
      });
      socket.on('review-deleted', (data) => {
        if (String(data.bookId) !== String(id)) return;
        const reviewId = data.reviewId || (data.review && data.review._id);
        if (reviewId) {
          setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        } else {
          axios.get(`${API_BASE}/reviews/${id}`).then((res) => setReviews(res.data.reviews || [])).catch(() => {});
        }
      });
    } catch (e) {
      console.warn('Socket init failed, falling back to local channel', e);
    }

    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('gutenbae-reviews');
      bc.addEventListener('message', (ev) => handleMessage(ev.data));
    } else {
      // fallback to localStorage events
      const storageHandler = (ev) => {
        if (ev.key === 'gutenbae-reviews') {
          handleMessage(ev.newValue);
        }
      };
      window.addEventListener('storage', storageHandler);
      // cleanup uses this reference
      bc = { close: () => window.removeEventListener('storage', storageHandler) };
    }

    return () => {
      try {
        bc && bc.close();
      } catch (e) {}
      try {
        socket && socket.disconnect();
      } catch (e) {}
    };
  }, [id]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  // current user's review if any
  const myReview = useMemo(() => {
    if (!currentUser || !reviews) return null;
    return reviews.find((r) => String(r.userId) === String(currentUser._id) || String(r.userId) === String(currentUser.id)) || null;
  }, [currentUser, reviews]);

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
      // if user already has a review, update it instead of creating a new one
      const existing = reviews.find((r) => String(r.userId) === String(currentUser?._id || currentUser?.id));
      if (existing) {
        const res = await axios.put(`${API_BASE}/reviews/${existing._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        const updated = res.data.review;
        setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      } else {
        const res = await axios.post(`${API_BASE}/reviews`, payload, { headers: { Authorization: `Bearer ${token}` } });
        const newReview = res.data.review;
        setReviews((prev) => {
          // avoid duplicate if a socket/broadcast already added this review
          const exists = prev.some((r) => String(r._id) === String(newReview._id));
          if (exists) {
            return prev.map((r) => (String(r._id) === String(newReview._id) ? newReview : r));
          }
          return [newReview, ...prev];
        });
      }
      setMyRating(0);
      setMyText("");
      setMessage("Thanks! Your review has been posted.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      // Log full error for debugging
      console.error('submitReview failed', err);
      const status = err?.response?.status;
      const body = err?.response?.data;
      const serverMessage = body?.message || body?.error || body?.msg;
      setMessage(serverMessage || (status ? `Server returned ${status}` : 'Could not submit your review.'));
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId, payload) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Please log in to edit your review.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    try {
      const res = await axios.put(`${API_BASE}/reviews/${reviewId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const updated = res.data.review;
      setReviews((prev) => {
        const idx = prev.findIndex((r) => r._id === updated._id);
        if (idx === -1) return [updated, ...prev];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      setEditingReviewId(null);
      setMessage('Review updated');
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update review');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Please log in to delete your review.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    try {
      await axios.delete(`${API_BASE}/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setMessage('Review deleted');
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete review');
      setTimeout(() => setMessage(null), 3000);
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
              <div className="text-sm text-gray-600 flex items-center gap-3">
                {reviews.length ? (
                  <>
                    <div className="flex items-center gap-2">
                      {/* Average stars (rounded) */}
                      <div className="flex">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} filled={n <= Math.round(averageRating)} size={14} />
                        ))}
                      </div>
                      <div>
                        Average: <span className="font-medium">{averageRating}</span>
                      </div>
                    </div>
                    <div>({reviews.length} review{reviews.length !== 1 ? "s" : ""})</div>
                  </>
                ) : (
                  "No reviews yet"
                )}
              </div>
            </div>

            {/* Write a review (hidden when user already has a review) */}
            {!myReview && (
              <div className="mb-6 bg-[#F9F7F5] border border-[#EBE5DF] rounded-2xl p-4">
              <p className="text-sm text-gray-700 mb-2">Leave a rating:</p>
              <StarRating value={myRating} onChange={setMyRating} />
              <textarea
                className="mt-3 w-full rounded-lg border border-[#EBE5DF] p-3 text-sm outline-none focus:ring-2 focus:ring-[#cd2126]"
                rows={4}
                placeholder="Share your thoughts (optional)…"
                value={myText}
                onChange={(e) => setMyText(clampText(e.target.value))}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <div>{myText.length}/{MAX_REVIEW_CHARS} chars</div>
                <div>{countParagraphs(myText)} / 3 paragraphs</div>
              </div>
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
            )}

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
                      {r.userName || "Anonymous"} • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>

                  {/* If this is the current user's review, allow edit/delete inline */}
                  {String(r.userId) === String(currentUser?._id || currentUser?.id) ? (
                    <div className="mt-3">
                      {editingReviewId !== r._id ? (
                        <>
                          {r.text ? <p className="mt-2 text-sm">{r.text}</p> : null}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                setEditingReviewId(r._id);
                                setEditingText(r.text || "");
                                setEditingRating(r.rating || 5);
                              }}
                              className="p-1 rounded text-blue-600 hover:bg-gray-100"
                              aria-label="Edit review"
                              title="Edit review"
                            >
                              <IconEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(r._id)}
                              className="p-1 rounded text-red-600 hover:bg-gray-100"
                              aria-label="Delete review"
                              title="Delete review"
                            >
                              <IconTrash className="text-sm text-red-600" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="mt-2">
                          <label className="text-xs">Rating</label>
                          <select
                            value={editingRating}
                            onChange={(e) => setEditingRating(Number(e.target.value))}
                            className="block mt-1 text-sm p-1 border rounded"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                          <label className="text-xs mt-2 block">Review</label>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(clampText(e.target.value))}
                            rows={3}
                            className="w-full mt-1 text-sm p-1 border rounded"
                          />
                          <div className="mt-1 flex justify-between text-xs text-gray-500">
                            <div>{editingText.length}/{MAX_REVIEW_CHARS} chars</div>
                            <div>{countParagraphs(editingText)} / 3 paragraphs</div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateReview(r._id, { rating: editingRating, text: editingText })}
                              className="text-xs bg-[#cd2126] text-white px-2 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingReviewId(null);
                                setEditingText(r.text || "");
                                setEditingRating(r.rating || 5);
                              }}
                              className="text-xs px-2 py-1 border rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // not the user's review — just show text
                    r.text ? <p className="mt-2 text-sm">{r.text}</p> : null
                  )}
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
