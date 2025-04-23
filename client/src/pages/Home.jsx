import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Landing from '../components/Landing';
import Nav from '../components/Nav';
import axios from 'axios';
import GutenbergSliderCard from '../components/GutenbergSliderCard';
import GoogleSliderCard from '../components/GoogleSliderCard';
import { useSearch } from '../SearchContext';
import { shareBook } from '../utils/shareBook';
import logo from '../assets/logo.png';

const truncateTitle = (title) => {
  const match = title.match(/(.+?[:;!?—–-])/);
  return match ? match[1] : title;
};

const Home = () => {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    freeResults,
    setFreeResults,
    googleResults,
    setGoogleResults,
  } = useSearch();

  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [likedBookIds, setLikedBookIds] = useState(new Set());
  const [likeMessage, setLikeMessage] = useState('');
  const [showAllFree, setShowAllFree] = useState(false);
  const [showAllGoogle, setShowAllGoogle] = useState(false);

  useEffect(() => {
    const fetchLikedBooks = () => {
      const token = localStorage.getItem('token');
      setLoggedIn(!!token);

      if (token) {
        axios
          .get('https://gutenbae2.onrender.com/user/liked-book-ids', {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setLikedBookIds(new Set(res.data.likedBookIds));
          })
          .catch(() => {
            console.error('Failed to fetch liked book IDs');
          });
      }
    };

    fetchLikedBooks();
    window.addEventListener('focus', fetchLikedBooks);
    return () => window.removeEventListener('focus', fetchLikedBooks);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
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

  const handleShare = (book) => shareBook(book, setLikeMessage);

  const toggleLike = async (book) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLikeMessage('Please log in to like books.');
      setTimeout(() => setLikeMessage(''), 3000);
      return;
    }

    const id = book.id || book.bookId;

    if (likedBookIds.has(id)) {
      setLikeMessage('You already liked this book');
      setTimeout(() => setLikeMessage(''), 2000);
      return;
    }

    const likedBookData = {
      bookId: id,
      title: book.title,
      authors: book.authors ? book.authors.map((a) => a.name) : ['Unknown'],
      imageUrl: book.formats?.['image/jpeg'] || '',
      description: book.summaries?.join('\n\n') || 'No description available',
      formats: book.formats || {},
    };

    try {
      await axios.post('https://gutenbae2.onrender.com/like-book', likedBookData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLikedBookIds((prev) => new Set(prev).add(id));
      setLikeMessage('Book liked and saved to your library!');
      setTimeout(() => setLikeMessage(''), 3000);
    } catch (error) {
      setLikeMessage('This book is already in your library.');
      setTimeout(() => setLikeMessage(''), 3000);
    }
  };

  return (
    <>
      <Nav loggedIn={loggedIn} />
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <img
          src={logo}
          alt="GutenBae logo"
          className="w-20 sm:w-24 md:w-28 lg:w-32 h-auto mt-6 mb-4"
        />

        {likeMessage && (
          <p className="text-green-600 text-sm mb-4">{likeMessage}</p>
        )}

<SearchBar
  query={query}
  onChange={(e) => setQuery(e.target.value)}
  onSubmit={(e) => {
    e.preventDefault();
    handleSearch();
  }}
  isLoading={isLoading}
/>


        {freeResults.length > 0 && (
          <section className="w-full mb-10 bg-white rounded-xl p-4">
            <h2 className="text-[#cd2126] font-[500] text-sm text-left sm:text-left px-4 sm:px-6 mt-2 mb-6">
              Free from Project Gutenberg
            </h2>
            <div className="relative">
              <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible px-2 sm:px-6 pb-2 sm:pb-0">
                {(showAllFree ? freeResults : freeResults.slice(0, 8)).map((book, index) => (
                  <div
                    key={index}
                    className="min-w-[200px] max-w-[240px] flex-shrink-0 sm:flex-shrink sm:w-full"
                  >
                    <GutenbergSliderCard
                      book={book}
                      isLiked={likedBookIds.has(book.id || book.bookId)}
                      onLike={toggleLike}
                      onShare={() => handleShare(book)}
                      onClick={() => navigate(`/shared-book/${book.id}`)}
                    />
                  </div>
                ))}
              </div>
              <div className="sm:hidden text-gray-400 text-xs text-right pr-4 mt-2">
                ← Swipe to see more
              </div>
            </div>

            {freeResults.length > 8 && (
              <button
                onClick={() => setShowAllFree(!showAllFree)}
                className="hidden sm:inline mt-4 text-sm px-4 sm:px-6 text-[#cd2126] hover:underline"
              >
                {showAllFree ? 'See Less' : 'See More'}
              </button>
            )}
          </section>
        )}

        {googleResults.length > 0 && (
          <section className="w-full mb-10 bg-white rounded-xl p-4">
            <h2 className="text-[#cd2126] font-[500] text-sm text-left sm:text-left px-4 sm:px-6 mt-2 mb-6">
              Google Results
            </h2>
            <div className="relative">
              <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible px-2 sm:px-6 pb-2 sm:pb-0">
                {(showAllGoogle ? googleResults : googleResults.slice(0, 8)).map((book, index) => (
                  <div
                    key={index}
                    className="min-w-[200px] max-w-[240px] flex-shrink-0 sm:flex-shrink sm:w-full"
                  >
                    <GoogleSliderCard
                      book={book}
                      isLiked={likedBookIds.has(book.id)}
                      onLike={toggleLike}
                      onClick={() => window.open(book.volumeInfo?.infoLink, '_blank')}
                    />
                  </div>
                ))}
              </div>
              <div className="sm:hidden text-gray-400 text-xs text-right pr-4 mt-2">
                ← Swipe to see more
              </div>
            </div>

            {googleResults.length > 8 && (
              <button
                onClick={() => setShowAllGoogle(!showAllGoogle)}
                className="hidden sm:inline mt-4 text-sm px-4 sm:px-6 text-[#cd2126] hover:underline"
              >
                {showAllGoogle ? 'See Less' : 'See More'}
              </button>
            )}
          </section>
        )}

        <Landing />
      </div>
    </>
  );
};

export default Home;
