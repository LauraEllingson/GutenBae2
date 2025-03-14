import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './index.css';
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // for future filtering
  const [freeResults, setFreeResults] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const cleanTitle = (title) => {
    return title.replace(/\$b/g, "");
  };
  const capitalizeTitle = (title) => {
    return title.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  }, []);

  // Load last search 
  useEffect(() => {
    const savedQuery = localStorage.getItem("lastQuery");
    const savedFreeResults = localStorage.getItem("lastFreeResults");
    const savedGoogleResults = localStorage.getItem("lastGoogleResults");

    if (savedQuery) {
      setQuery(savedQuery);
    }
    if (savedFreeResults) {
      setFreeResults(JSON.parse(savedFreeResults));
    }
    if (savedGoogleResults) {
      setGoogleResults(JSON.parse(savedGoogleResults));
    }
  }, []);

  //  search books
  const handleSearch = async () => {
    if (!query.trim()) {
      setFreeResults([]);
      setGoogleResults([]);
      return;
    }

    setIsLoading(true);
    setFreeResults([]);
    setGoogleResults([]);

    const gutendexApiUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page_size=10`;
    const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;

    try {
      const [gutendexResponse, googleResponse] = await Promise.all([
        fetch(gutendexApiUrl),
        fetch(googleApiUrl),
      ]);

      if (!gutendexResponse.ok) throw new Error('Gutendex API error');
      if (!googleResponse.ok) throw new Error('Google Books API error');

      const gutendexData = await gutendexResponse.json();
      const googleData = await googleResponse.json();

      const free = gutendexData.results || [];
      const google = googleData.items || [];

      setFreeResults(free);
      setGoogleResults(google);

      // Save results to local storage
      localStorage.setItem("lastQuery", query);
      localStorage.setItem("lastFreeResults", JSON.stringify(free));
      localStorage.setItem("lastGoogleResults", JSON.stringify(google));
    } catch (error) {
      console.error('Error fetching data from the API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (book) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to like a book");
      return;
    }

    // Prep liked book data
    const likedBookData = {
      bookId: book.id || book.bookId, 
      title: book.title,
      authors: book.authors ? book.authors.map(author => author.name) : ["Unknown"],
      imageUrl: book.formats?.['image/jpeg'] || "",
      description: book.summaries && book.summaries.length > 0 
                    ? book.summaries.join("\n\n")
                    : "No description available",
      formats: book.formats || {},
    };

    try {
      await axios.post(
        "https://gutenbae2.onrender.com/like-book",
        likedBookData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Book liked successfully!");
    } catch (error) {
      alert("Failed to like book: " + (error.response?.data.error || error.message));
    }
  };
  

  


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Navigation */}
      <div style={{ width: '100%', textAlign: 'right', marginBottom: '20px' }}>
        {loggedIn ? (
          <>
            <Link to="/dashboard"><button>Dashboard</button></Link>
            <button onClick={() => {
              localStorage.removeItem("token");
              setLoggedIn(false);
            }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register"><button>Register</button></Link>
            <Link to="/login"><button>Login</button></Link>
          </>
        )}
      </div>

      <h1>GutenBae</h1>
      <div>
        <input 
          type="text" 
          placeholder="Enter a keyword" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          id="search-query"
          name="search-query"
        />
        <button onClick={handleSearch} disabled={isLoading} id="search-button"> 
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Gutendex Results (Cards) */}
      <div style={{ width: '100%', marginTop: '20px' }}>
        <h2>Free Books from Gutendex</h2>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '15px',
          padding: '10px',
          whiteSpace: 'nowrap'
        }}>
        {isLoading ? <p>Searching...</p> : (
          freeResults.length === 0 ? <p>No results found.</p> :
            freeResults.map((book, index) => (
              book.title && (
                <div 
                  key={index} 
                  className="book-card" 
                  
                  onClick={() => navigate(`/shared-book/${book.id}`)}
                    style={{ cursor: "pointer", minWidth: '250px', minHeight: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                >
                  {/* Like Button */}
                  <button 
                    className="like-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(book);
                    }}
                  >
                    ❤️
                  </button>

                  {/* Book Cover */}
                  <div className="book-image">
                    {book.formats?.['image/jpeg'] && (
                      <img src={book.formats['image/jpeg']} alt="Book Cover" />
                    )}
                  </div>

                  {/* Book Details - Visible on Hover */}
                  <div className="book-details">
                    <h3 className="book-title">{capitalizeTitle(cleanTitle(book.title))}</h3>
                    <p className="book-author"><strong>Author:</strong> {book.authors?.map(a => a.name).join(', ') || 'Unknown'}</p>
                    
                 
                    {/* Download Links */}
                    <p className="download-options">
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
                      {book.formats?.["application/x-mobipocket-ebook"] && book.formats?.["application/epub+zip"] && " | "}
                      {book.formats?.["application/x-mobipocket-ebook"] && (
                        <a 
                          href={book.formats["application/x-mobipocket-ebook"]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Kindle
                        </a>
                      )}
                      {book.formats?.["text/html"] && (
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
                    </p>
                  </div>
                </div>
              )
            ))
        )}
        </div>
      </div>

      {/* Google Books Results (cards) */}
      <div style={{ width: '100%', marginTop: '20px' }}>
        <h2>Google Books Results</h2>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '15px',
          padding: '10px',
          whiteSpace: 'nowrap'
        }}>
          {isLoading ? <p>Searching...</p> : (
            googleResults.length === 0 ? <p>No results found.</p> :
              googleResults.map((book, index) => (
                <div 
                  key={index} 
                  className="book-card" 
                  style={{
                    minWidth: '250px',
                    minHeight: '300px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                  //  Google Books info link to new tab:
                  onClick={() => window.open(book.volumeInfo?.infoLink, "_blank")}
                  
                >
                  <h3 className="book-title">{book.volumeInfo?.title || 'No title available'}</h3>
                  <p className="book-author">
                    <strong>Author:</strong> {book.volumeInfo?.authors?.join(', ') || 'Unknown'}
                  </p>
                  {book.volumeInfo?.imageLinks?.thumbnail && (
                    <img src={book.volumeInfo.imageLinks.thumbnail} alt="Book thumbnail" style={{ maxWidth: '100px' }} />
                  )}
                  <p>
                    <a href={book.volumeInfo?.infoLink} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}>
                      Read More
                    </a>
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
