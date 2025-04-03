import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './index.css';
import axios from 'axios';
import logo from './assets/logo.png';
import Nav from './Nav';

const truncateTitle = (title) => {
  const match = title.match(/(.+?[:;!?—–-])/); // removed period from pattern
  return match ? match[1] : title;
};



const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [freeResults, setFreeResults] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const cleanTitle = (title) =>
  title.replace(/\$b/g, '').replace(/[-–—]/g, '');

  const capitalizeTitle = (title) => title.replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);
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

  const handleLike = async (book) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in to like a book');

    const likedBookData = {
      bookId: book.id || book.bookId,
      title: book.title,
      authors: book.authors ? book.authors.map(a => a.name) : ['Unknown'],
      imageUrl: book.formats?.['image/jpeg'] || '',
      description: book.summaries?.join('\n\n') || 'No description available',
      formats: book.formats || {},
    };

    try {
      await axios.post('https://gutenbae2.onrender.com/like-book', likedBookData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Book liked!');
    } catch (error) {
      alert('Error liking book');
    }
  };

  return (
    <>
      <Nav />
      <div className="flex flex-col items-center w-full px-4 sm:px-8 lg:px-16 xl:px-24">
  {/* Logo */}
  <img
    src={logo}
    alt="GutenBae logo"
    className="w-20 sm:w-24 md:w-28 lg:w-32 h-auto mt-6 mb-4"
  />

  {/* Search Bar */}
  <div className="w-1/2 lg:w-1/4 mx-auto flex items-center gap-2">
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      placeholder="Search by Author, Title or ISBN"
      className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-full text-[0.625rem] sm:text-[0.75rem] md:text-sm text-center text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* Tagline */}
  <p className="text-[#cd2126] italic text-[0.5rem] sm:text-[0.6rem] md:text-sm mt-2 mb-6 text-center">
    Discover Over 75,000 Books In the Public Domain!
  </p>
    {/* Gutendex results slider */}
    <section className="w-full mb-10">
  {/* Title aligned with slider edge */}
  <div className="px-4 sm:px-6 lg:px-8">
    <h2 className="text-[#cd2126] font-[500] text-[0.625rem] sm:text-[0.75rem] md:text-sm mt-2 mb-6 text-left">
      Free from Project Gutenberg
    </h2>
  </div>

  <div className="flex overflow-x-auto gap-4 pb-2 px-4 sm:px-6 lg:px-8">
    {isLoading ? <p>Searching...</p> : freeResults.length === 0 ? (
      <p>No results found.</p>
    ) : (
      freeResults.map((book, index) => (
        <div
          key={index}
          onClick={() => navigate(`/shared-book/${book.id}`)}
          className="min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[260px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
        >
          <div>
          <h3 className="font-caslon font-[600] text-[0.625rem] sm:text-[0.75rem] md:text-sm leading-tight mb-1 text-gray-700">
              {truncateTitle(capitalizeTitle(cleanTitle(book.title)))}
            </h3>
            <p className="book-author text-xs font-light font-caslon leading-tight mb-2 text-gray-700">
 {book.authors?.map(a => a.name).join(', ') || 'Unknown'}
</p>
            <p className="text-[10px] sm:text-xs text-gray-500 truncate-summary">
              {book.summaries?.[0]}
            </p>
          </div>
          <div className="text-[#cd2126] text-[11px] sm:text-[13px] font-['Fira_Sans'] mt-2">
            {book.formats?.['application/epub+zip'] && (
              <a href={book.formats['application/epub+zip']} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                EPUB
              </a>
            )}
            {book.formats?.['application/x-mobipocket-ebook'] && ' | '}
            {book.formats?.['application/x-mobipocket-ebook'] && (
              <a href={book.formats['application/x-mobipocket-ebook']} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                Kindle
              </a>
            )}
            {book.formats?.['text/html'] && ' | '}
            {book.formats?.['text/html'] && (
              <a href={book.formats['text/html']} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                HTML
              </a>
            )}
          </div>
        </div>
      ))
    )}
  </div>
</section>
{/* Google results slider */}
<section className="w-full mb-10">
  <div className="px-4 sm:px-6 lg:px-8">
    <h2 className="text-[#cd2126] font-[500] text-[0.625rem] sm:text-[0.75rem] md:text-sm mt-2 mb-6 text-left">
      Google Results
    </h2>
  </div>
  <div className="flex overflow-x-auto gap-4 pb-2 px-4 sm:px-6 lg:px-8">

    {googleResults.length === 0 ? (
      <p>No results found.</p>
    ) : (
      googleResults.map((book, index) => (
        <div
        key={index}
        onClick={() => window.open(book.volumeInfo?.infoLink, '_blank')}
        className="min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[260px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
      >
        <div>
          <h3 className="font-caslon font-[600] text-[0.625rem] sm:text-[0.75rem] md:text-sm leading-tight mb-1 text-gray-700 text-left">
            {truncateTitle(capitalizeTitle(cleanTitle(book.volumeInfo?.title || 'No title')))}
          </h3>
          <p className="book-author text-xs font-light font-caslon leading-tight mb-2 text-gray-700 text-left">
            {book.volumeInfo?.authors?.join(', ') || 'Unknown'}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 truncate-summary text-left">
            {book.volumeInfo?.description?.slice(0, 300) || 'No summary available.'}
          </p>
        </div>
      
        <div className="text-[#cd2126] text-[11px] sm:text-[13px] font-['Fira_Sans'] mt-2">
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
      
      ))
    )}
  </div>
</section>

      </div>
    </>
  );
};

export default Home;