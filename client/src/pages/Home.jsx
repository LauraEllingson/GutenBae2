import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Landing from '../components/Landing';
import Nav from '../components/Nav';
import axios from 'axios';


import logo from '../assets/logo.png';
import epubIcon from '../assets/epub.png';
import htmlIcon from '../assets/html.png';
import likeIcon from '../assets/like.png';
import likedIcon from '../assets/liked.png';


const truncateTitle = (title) => {
  const match = title.match(/(.+?[:;!?—–-])/);
  return match ? match[1] : title;
};

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [freeResults, setFreeResults] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [likedBookIds, setLikedBookIds] = useState(new Set());
  const [likeMessage, setLikeMessage] = useState('');

  const cleanTitle = (title) =>
    title.replace(/\$b/g, '').replace(/[-–—]/g, '');

  const capitalizeTitle = (title) =>
    title.replace(/\b\w/g, (char) => char.toUpperCase());

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

  useEffect(() => {
    const savedQuery = localStorage.getItem('lastQuery');
    const savedFreeResults = localStorage.getItem('lastFreeResults');
    const savedGoogleResults = localStorage.getItem('lastGoogleResults');
    if (savedQuery) setQuery(savedQuery);
    if (savedFreeResults) setFreeResults(JSON.parse(savedFreeResults));
    if (savedGoogleResults) setGoogleResults(JSON.parse(savedGoogleResults));
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

      localStorage.setItem('lastQuery', query);
      localStorage.setItem('lastFreeResults', JSON.stringify(gutendexData.results || []));
      localStorage.setItem('lastGoogleResults', JSON.stringify(googleData.items || []));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async (book) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in to like a book');

    const id = book.id || book.bookId;

    if (likedBookIds.has(id)) {
      setLikeMessage('❤️ You already liked this book');
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
      setLikeMessage('✅ Book liked and saved to your library!');
      setTimeout(() => setLikeMessage(''), 3000);
    } catch (error) {
      alert('Error liking book');
    }
  };

  return (
    <>
      <Nav loggedIn={loggedIn} />
      <div className="flex flex-col items-center w-full px-4 sm:px-8 lg:px-16 xl:px-24">
        <img src={logo} alt="GutenBae logo" className="w-20 sm:w-24 md:w-28 lg:w-32 h-auto mt-6 mb-4" />
        {likeMessage && <p className="text-green-600 text-sm mb-4">{likeMessage}</p>}

        <SearchBar
          query={query}
          onChange={(e) => setQuery(e.target.value)}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        />

        {!freeResults.length && !googleResults.length && (
          <>
           
            <Landing />
          </>
        )}

        {freeResults.length > 0 && (
          <section className="w-full mb-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <h2 className="text-[#cd2126] font-[500] text-[0.625rem] sm:text-[0.75rem] md:text-sm mt-2 mb-6 text-left">
                Free from Project Gutenberg
              </h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 px-4 sm:px-6 lg:px-8">
              {isLoading ? (
                <p>Searching...</p>
              ) : (
                freeResults.map((book, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(`/shared-book/${book.id}`)}
                    className="min-w-[220px] md:min-w-[240px] lg:min-w-[260px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <h3 className="font-caslon font-[600] text-sm leading-tight mb-1 text-gray-700">
                        {truncateTitle(capitalizeTitle(cleanTitle(book.title)))}
                      </h3>
                      <p className="text-xs font-light font-caslon leading-tight mb-2 text-gray-700">
                        {book.authors?.map((a) => a.name).join(', ') || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate-summary">
                        {book.summaries?.[0]}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2 items-center">
                        {book.formats?.['application/epub+zip'] && (
                          <a href={book.formats['application/epub+zip']} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <img src={epubIcon} alt="EPUB" className="w-5 h-5" />
                          </a>
                        )}
                        {book.formats?.['text/html'] && (
                          <a href={book.formats['text/html']} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <img src={htmlIcon} alt="HTML" className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(book);
                        }}
                      >
                        <img
                          src={likedBookIds.has(book.id || book.bookId) ? likedIcon : likeIcon}
                          alt="Like"
                          className="w-5 h-5"
                        />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {googleResults.length > 0 && (
          <section className="w-full mb-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <h2 className="text-[#cd2126] font-[500] text-[0.625rem] sm:text-[0.75rem] md:text-sm mt-2 mb-6 text-left">
                Google Results
              </h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 px-4 sm:px-6 lg:px-8">
              {googleResults.map((book, index) => (
                <div
                  key={index}
                  onClick={() => window.open(book.volumeInfo?.infoLink, '_blank')}
                  className="min-w-[220px] md:min-w-[240px] lg:min-w-[260px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
                >
                  <div>
                    <h3 className="font-caslon font-[600] text-sm leading-tight mb-1 text-gray-700 text-left">
                      {truncateTitle(capitalizeTitle(cleanTitle(book.volumeInfo?.title || 'No title')))}
                    </h3>
                    <p className="text-xs font-light font-caslon leading-tight mb-2 text-gray-700 text-left">
                      {book.volumeInfo?.authors?.join(', ') || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 truncate-summary text-left">
                      {book.volumeInfo?.description?.slice(0, 300) || 'No summary available.'}
                    </p>
                  </div>
                  <div className="text-[#cd2126] text-xs mt-2">
                    <a
                      href={book.volumeInfo?.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read More
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default Home;
