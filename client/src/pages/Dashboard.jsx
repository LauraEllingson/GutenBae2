import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import SearchBar from "../components/SearchBar";
import { useSearch } from "../SearchContext";
import { useAuth } from "../AuthContext";
import logo from "../assets/logo.png";
import DashboardBookCard from "../components/DashboardBookCard";
import GutenbergSliderCard from "../components/GutenbergSliderCard";
import GoogleSliderCard from "../components/GoogleSliderCard";
import { shareBook } from "../utils/shareBook";

const API_BASE = import.meta.env.VITE_API_URL || "https://gutenbae2.onrender.com";
const Dashboard = () => {
  // Account actions header intentionally left blank (no visible label)
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [likedBooks, setLikedBooks] = useState([]);
  const [reviewsByBookId, setReviewsByBookId] = useState({});
  const [userReviews, setUserReviews] = useState([]);
  const [bookTitles, setBookTitles] = useState({});
  const [error, setError] = useState(null);
  const [editingReviewIdLocal, setEditingReviewIdLocal] = useState(null);
  const [editingTextLocal, setEditingTextLocal] = useState("");
  const [editingRatingLocal, setEditingRatingLocal] = useState(5);
  const MAX_REVIEW_CHARS = 1200;
  const clampTextLocal = (text) => (text && text.length > MAX_REVIEW_CHARS ? text.slice(0, MAX_REVIEW_CHARS) : text || "");
  const countParagraphsLocal = (text) => {
    const s = (text || "").toString().trim();
    if (!s) return 0;
    return s.split(/\n\s*\n/).filter(Boolean).length;
  };
  // render numeric rating as star icons for display
  const renderStars = (rating) => {
    const stars = [];
    const r = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= r ? 'text-yellow-500' : 'text-gray-300'}>★</span>
      );
    }
    return (
      <div className="flex items-center gap-1" aria-label={`${r} out of 5 stars`}>
        {stars}
      </div>
    );
  };
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState(null);

  const { login, logout } = useAuth();

  const cleanTitle = (title) => title.replace(/\$b/g, "");
  const capitalizeTitle = (title) =>
    title.replace(/\b\w/g, (char) => char.toUpperCase());
  const [selectedTab, setSelectedTab] = useState('liked'); // 'liked' | 'reviews' | 'profile'
  const { query, setQuery, freeResults, setFreeResults, googleResults, setGoogleResults } = useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(true);

  const handleSearch = async () => {
    if (!query || !query.trim()) {
      setFreeResults([]);
      setGoogleResults([]);
      return;
    }
    setIsLoading(true);
    const gutendexApiUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page_size=10`;
    const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    try {
      const [gutendexResponse, googleResponse] = await Promise.all([
        fetch(gutendexApiUrl),
        fetch(googleApiUrl),
      ]);
      if (!gutendexResponse.ok || !googleResponse.ok) throw new Error('API error');
      const gutendexData = await gutendexResponse.json();
      const googleData = await googleResponse.json();
      setFreeResults(gutendexData.results || []);
      setGoogleResults(googleData.items || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // If a flow intentionally cleared the token and redirected (e.g. account deletion),
      // suppress the access-denied alert so the UX is a clean redirect to home.
      const suppressed = sessionStorage.getItem('suppressAccessDenied');
      if (suppressed) {
        sessionStorage.removeItem('suppressAccessDenied');
        navigate('/');
        return;
      }
      alert("Access denied. Please log in.");
      navigate("/login");
      return;
    }
    let currentUserId = null;
    axios.post(`${API_BASE}/verify-token`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        currentUserId = res.data.user._id;
        setUser(res.data.user);
        login();
        return axios.get(`${API_BASE}/users/${currentUserId}/liked-books`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((res) => {
        setLikedBooks(res.data.likedBooks);
        // fetch this user's reviews and map them by bookId for quick lookup
        const token2 = localStorage.getItem("token");
        if (currentUserId) {
          axios.get(`${API_BASE}/users/${currentUserId}/reviews`, { headers: { Authorization: `Bearer ${token2}` } })
            .then((r) => {
              const map = {};
              (r.data.reviews || []).forEach((rev) => {
                map[String(rev.bookId)] = rev;
              });
              setReviewsByBookId(map);
              setUserReviews(r.data.reviews || []);
            
              // fetch book titles for user's reviews so we can show names instead of IDs
              const uniqueIds = Array.from(new Set((r.data.reviews || []).map((rev) => String(rev.bookId))));
              if (uniqueIds.length > 0) {
                Promise.all(
                  uniqueIds.map((id) =>
                    axios
                      .get(`https://gutendex.com/books/${id}`)
                      .then((res2) => ({ id, title: res2.data?.title }))
                      .catch(() => ({ id, title: null }))
                  )
                ).then((results) => {
                  const titles = {};
                  results.forEach((r2) => {
                    if (r2.title) titles[String(r2.id)] = r2.title;
                  });
                  setBookTitles((prev) => ({ ...prev, ...titles }));
                });
              }
            })
            .catch((e) => {
              // non-fatal
              console.error("Failed to load user reviews", e);
            });
        }
      })
      .catch(() => {
        setError("Failed to fetch liked books");
      });
  }, [navigate, login]);

  // whenever userReviews updates, fetch any missing titles
  useEffect(() => {
    const ids = Array.from(new Set((userReviews || []).map((r) => String(r.bookId))));
    const missing = ids.filter((id) => !bookTitles[String(id)]);
    if (missing.length === 0) return;
    Promise.all(
      missing.map((id) =>
        axios
          .get(`https://gutendex.com/books/${id}`)
          .then((res) => ({ id, title: res.data?.title }))
          .catch(() => ({ id, title: null }))
      )
    ).then((results) => {
      const titles = {};
      results.forEach((r2) => {
        if (r2.title) titles[String(r2.id)] = r2.title;
      });
      setBookTitles((prev) => ({ ...prev, ...titles }));
    });
  }, [userReviews, bookTitles]);

  // Socket listener to receive review updates/deletes from other pages
  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket"] });
    socket.on("connect", () => {
      // console.log("dashboard socket connected", socket.id);
    });

    socket.on("review-updated", (data) => {
      try {
        const { bookId, review } = data;
        // if this review belongs to current user, update userReviews and reviewsByBookId
        if (user && review && String(review.userId) === String(user._id)) {
          setUserReviews((prev) => {
            const found = prev.find((r) => String(r._id) === String(review._id));
            if (found) return prev.map((r) => (String(r._id) === String(review._id) ? review : r));
            return [review, ...prev];
          });
          setReviewsByBookId((prev) => ({ ...prev, [String(bookId)]: review }));
        }
      } catch {
        // non-fatal
      }
    });

    socket.on("review-deleted", (data) => {
      try {
        const { bookId, reviewId } = data;
        // remove from userReviews and reviewsByBookId if it belonged to current user
        setUserReviews((prev) => prev.filter((r) => String(r._id) !== String(reviewId)));
        setReviewsByBookId((prev) => {
          const next = { ...prev };
          if (String(next[String(bookId)]?._id) === String(reviewId)) {
            delete next[String(bookId)];
          }
          return next;
        });
  } catch { /* ignore */ }
    });

    return () => {
      try {
        socket.disconnect();
      } catch { /* ignore */ }
    };
  }, [user]);

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to remove this book?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE}/like-book/${bookId}`, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmMsg =
      'Are you sure you want to permanently delete your account? This action cannot be undone.';
    if (!window.confirm(confirmMsg)) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE}/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

  // Suppress the Dashboard "Access denied" alert which checks for token on mount
  try { sessionStorage.setItem('suppressAccessDenied', '1'); } catch (e) { console.warn('Could not set session flag', e); }
  // Navigate away first so the dashboard doesn't re-check auth and show "Access denied"
  navigate('/', { replace: true });
      // Clear client-side auth (best-effort)
      try {
        logout();
      } catch {
        // best-effort
      }
      localStorage.removeItem('token');
      // Inform user (on the destination page)
      try { alert('Your account has been deleted.'); } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to delete account', err);
      alert(err?.response?.data?.message || 'Failed to delete account.');
    }
  };

  // delete a review (from user's dashboard)
  const handleDeleteReview = async (reviewId, bookId) => {
    if (!window.confirm("Delete your review?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE}/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
      setReviewsByBookId((prev) => {
        const next = { ...prev };
        delete next[String(bookId)];
        return next;
      });
      // also remove from user's reviews list
      setUserReviews((prev) => prev.filter((r) => r._id !== reviewId));
      // notify other tabs/pages to refresh reviews for this book
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('gutenbae-reviews');
          bc.postMessage({ type: 'review-deleted', bookId, reviewId });
          bc.close();
        } else {
          localStorage.setItem('gutenbae-reviews', JSON.stringify({ type: 'review-deleted', bookId, reviewId, ts: Date.now() }));
        }
      } catch (e) {
        console.error('Broadcast failed', e);
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review.");
    }
  };

  // update a review (from dashboard)
  const handleUpdateReview = async (reviewId, bookId, payload) => {
    // payload: { rating, text }
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(`${API_BASE}/reviews/${reviewId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const updated = res.data.review;
      setReviewsByBookId((prev) => ({ ...prev, [String(bookId)]: updated }));
  // also update user's reviews list
  setUserReviews((prev) => prev.map((r) => (String(r._id) === String(updated._id) ? updated : r)));
      // notify other tabs/pages to refresh reviews for this book
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('gutenbae-reviews');
          bc.postMessage({ type: 'review-updated', bookId, reviewId, review: updated });
          bc.close();
        } else {
          localStorage.setItem('gutenbae-reviews', JSON.stringify({ type: 'review-updated', bookId, reviewId, ts: Date.now() }));
        }
      } catch (e) {
        console.error('Broadcast failed', e);
      }
    } catch (err) {
      console.error("Error updating review:", err);
      alert(err?.response?.data?.message || "Failed to update review.");
    }
  };

  // handle change password from profile
  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (!user) return setPasswordMessage('No user');
    if (newPassword !== confirmNewPassword) {
      return setPasswordMessage('New passwords do not match');
    }
    if ((newPassword || '').length < 6) {
      return setPasswordMessage('New password must be at least 6 characters');
    }
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_BASE}/users/${user._id}/change-password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setPasswordMessage(res.data?.message || 'Password changed');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setShowChangePassword(false);
    } catch (err) {
      setPasswordMessage(err?.response?.data?.message || 'Failed to change password');
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

        <SearchBar
          query={query}
          onChange={(e) => setQuery(e.target.value)}
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSearch();
            navigate('/');
          }}
          isLoading={isLoading}
        />

        <div className="w-full max-w-7xl bg-white min-h-screen px-4 sm:px-6 md:px-8 py-6">
          {/* Search results panel shown on Dashboard when search returns results */}
          {(freeResults?.length > 0 || googleResults?.length > 0) && (
            <div className="w-full mb-6">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => setSearchExpanded((s) => !s)}
                  aria-expanded={searchExpanded}
                  className="p-2 rounded-md hover:bg-gray-100"
                  title={searchExpanded ? 'Collapse results' : 'Expand results'}
                >
                  {searchExpanded ? (
                    // up arrow (collapse)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 12.97a.75.75 0 001.06 0L10 9.27l3.71 3.7a.75.75 0 101.06-1.06l-4.24-4.24a.75.75 0 00-1.06 0L5.23 11.91a.75.75 0 000 1.06z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    // down arrow (expand)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M14.77 7.03a.75.75 0 00-1.06 0L10 10.73 6.29 7.03a.75.75 0 10-1.06 1.06l4.24 4.24c.29.29.77.29 1.06 0l4.24-4.24a.75.75 0 000-1.06z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              {searchExpanded && (
                <>
                  {freeResults?.length > 0 && (
                    <section className="w-full mb-4">
                      <h2 className="text-[#cd2126] font-[500] text-sm mb-2">Free from Project Gutenberg</h2>
                      <div className="relative">
                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
                          {freeResults.map((book, index) => (
                            <div key={book.id || index} className="min-w-[200px] max-w-[240px] flex-shrink-0">
                              <GutenbergSliderCard
                                book={book}
                                isLiked={false}
                                onLike={() => {}}
                                onShare={() => shareBook(book)}
                                onClick={() => navigate(`/shared-book/${book.id}`)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {googleResults?.length > 0 && (
                    <section className="w-full">
                      <h2 className="text-[#cd2126] font-[500] text-sm mb-2">Google Results</h2>
                      <div className="relative">
                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
                          {googleResults.map((book, index) => (
                            <div key={book.id || index} className="min-w-[200px] max-w-[240px] flex-shrink-0">
                              <GoogleSliderCard
                                book={book}
                                isLiked={false}
                                onLike={() => {}}
                                onClick={() => window.open(book.volumeInfo?.infoLink, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2 mb-6 text-center md:text-left">
            {user && (
              <h3 className="text-sm md:text-lg font-light text-gray-700">
                Welcome, {user.name}!
              </h3>
            )}
            <div className="mt-4">
              {/* Tablist styled to look like real tabs matching branding */}
              <div className="w-full">
                <nav className="flex -mb-px justify-center md:justify-start" role="tablist" aria-label="Dashboard tabs">
                  <button
                    id="tab-liked"
                    role="tab"
                    aria-controls="panel-liked"
                    aria-selected={selectedTab === 'liked'}
                    onClick={() => setSelectedTab('liked')}
                    className={`px-4 py-3 -mb-px border-b-2 focus:outline-none ${selectedTab === 'liked' ? 'border-[#cd2126] text-[#cd2126] font-semibold bg-white rounded-t-md relative z-10 shadow-sm' : 'border-transparent text-gray-600 hover:text-[#cd2126]'}`}
                  >
                    Liked Books
                  </button>

                  <button
                    id="tab-reviews"
                    role="tab"
                    aria-controls="panel-reviews"
                    aria-selected={selectedTab === 'reviews'}
                    onClick={() => setSelectedTab('reviews')}
                    className={`px-4 py-3 -mb-px border-b-2 focus:outline-none ${selectedTab === 'reviews' ? 'border-[#cd2126] text-[#cd2126] font-semibold bg-white rounded-t-md relative z-10 shadow-sm' : 'border-transparent text-gray-600 hover:text-[#cd2126]'}`}
                  >
                    Reviews
                  </button>

                  <button
                    id="tab-profile"
                    role="tab"
                    aria-controls="panel-profile"
                    aria-selected={selectedTab === 'profile'}
                    onClick={() => setSelectedTab('profile')}
                    className={`px-4 py-3 -mb-px border-b-2 focus:outline-none ${selectedTab === 'profile' ? 'border-[#cd2126] text-[#cd2126] font-semibold bg-white rounded-t-md relative z-10 shadow-sm' : 'border-transparent text-gray-600 hover:text-[#cd2126]'}`}
                  >
                    Profile
                  </button>
                </nav>
              </div>
            </div>
          </div>
  
          {error && <p className="text-red-600 mb-2">{error}</p>}

          {/* Each tab renders its own 'page' panel so the tab looks like it's attached to a page */}
          {selectedTab === 'liked' && (
            <div className="-mt-3">
              <div role="tabpanel" id="panel-liked" aria-labelledby="tab-liked" className="p-6">
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
                        review={reviewsByBookId[String(book.bookId)]}
                        onDeleteReview={(reviewId) => handleDeleteReview(reviewId, book.bookId)}
                        onUpdateReview={(reviewId, payload) => handleUpdateReview(reviewId, book.bookId, payload)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'reviews' && (
            <div className="-mt-3">
              <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" className="p-6 text-left">
                <h4 className="text-md md:text-lg font-semibold text-[#cd2126] mb-3">Your Reviews</h4>
                {userReviews.length === 0 ? (
                  <p className="text-gray-500 italic">You have not written any reviews yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {userReviews.map((rev) => (
                      <li key={rev._id} className="rounded-2xl py-4 px-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link to={`/shared-book/${rev.bookId}`} className="text-black font-semibold text-md md:text-lg hover:underline">{bookTitles[String(rev.bookId)] || `#${rev.bookId}`}</Link>
                            <div className="text-xs text-gray-500">{renderStars(rev.rating)}</div>
                          </div>
                          <div className="text-xs text-gray-500">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}</div>
                        </div>
                        {editingReviewIdLocal !== rev._id ? (
                          <>
                            {rev.text ? <p className="mt-2 text-sm">{rev.text}</p> : null}
                            <div className="flex gap-2 mt-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingReviewIdLocal(rev._id);
                                      setEditingTextLocal(rev.text || '');
                                      setEditingRatingLocal(rev.rating || 5);
                                    }}
                                    className="p-1 rounded text-blue-600 hover:bg-gray-100"
                                    aria-label="Edit review"
                                    title="Edit review"
                                  >
                                    {/* pencil icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828z" />
                                      <path d="M2 15.25V18h2.75l8.485-8.485-2.75-2.75L2 15.25z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(rev._id, rev.bookId)}
                                    className="p-1 rounded text-red-600 hover:bg-gray-100"
                                    aria-label="Delete review"
                                    title="Delete review"
                                  >
                                    {/* trash icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 10-2 0v7a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 10-2 0v6H8V8z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                            </div>
                          </>
                        ) : (
                          <div className="mt-2">
                            <label className="text-xs">Rating</label>
                            <select value={editingRatingLocal} onChange={(e) => setEditingRatingLocal(Number(e.target.value))} className="block mt-1 text-sm p-1 rounded">
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                            <label className="text-xs mt-2 block">Review</label>
                            <textarea value={editingTextLocal} onChange={(e) => setEditingTextLocal(clampTextLocal(e.target.value))} rows={3} className="w-full mt-1 text-sm p-1 rounded" />
                            <div className="mt-1 flex justify-between text-xs text-gray-500">
                              <div>{(editingTextLocal || "").length}/{MAX_REVIEW_CHARS} chars</div>
                              <div>{countParagraphsLocal(editingTextLocal)} / 3 paragraphs</div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => { handleUpdateReview(rev._id, rev.bookId, { rating: editingRatingLocal, text: editingTextLocal }); setEditingReviewIdLocal(null); }} className="text-xs bg-[#cd2126] text-white px-2 py-1 rounded">Save</button>
                              <button onClick={() => setEditingReviewIdLocal(null)} className="text-xs px-2 py-1 rounded">Cancel</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'profile' && (
            <div className="-mt-3">
              <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" className="p-6">
                <h4 className="text-md md:text-lg font-semibold text-[#cd2126] mb-3">Profile & Settings</h4>
                {user ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-gray-700">{user.name}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-gray-700">{user.email && user.email.includes('@') ? user.email : 'Not available'}</div>
                    </div>

                    <div>
                      <button onClick={() => setShowChangePassword((s) => !s)} className="text-sm text-[#cd2126] hover:underline">Change password</button>
                      {showChangePassword && (
                        <div className="mt-2 space-y-2">
                          <label className="text-xs">Current password</label>
                          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 text-sm p-1 rounded" />
                          <label className="text-xs">New password</label>
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 text-sm p-1 rounded" />
                          <label className="text-xs">Confirm new password</label>
                          <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full mt-1 text-sm p-1 rounded" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={handleChangePassword} className="text-xs bg-[#cd2126] text-white px-2 py-1 rounded">Save</button>
                            <button onClick={() => setShowChangePassword(false)} className="text-xs px-2 py-1 rounded">Cancel</button>
                          </div>
                          {passwordMessage && <div className="text-sm text-red-600">{passwordMessage}</div>}
                        </div>
                      )}
                    </div>

                    <div>
                      <button onClick={handleDeleteAccount} className="mt-2 text-sm text-red-600 hover:underline">Delete account</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No profile information available.</p>
                )}
              </div>
            </div>
          )}

              {/* Duplicate reviews list removed — reviews are shown under the Reviews tab above. */}

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
