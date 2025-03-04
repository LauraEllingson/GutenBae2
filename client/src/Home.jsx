import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css'; 

const Home = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [freeResults, setFreeResults] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const gutendexResponse = await fetch(gutendexApiUrl);
      const googleResponse = await fetch(googleApiUrl);

      if (!gutendexResponse.ok) throw new Error('Gutendex API error');
      if (!googleResponse.ok) throw new Error('Google Books API error');

      const gutendexData = await gutendexResponse.json();
      const googleData = await googleResponse.json();

      setFreeResults(gutendexData.results || []);
      setGoogleResults(googleData.items || []);
    } catch (error) {
      console.error('Error fetching data from the API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: '100%', textAlign: 'right', marginBottom: '20px' }}>
        <Link to="/register"><button>Register</button></Link>
        <Link to="/login"><button>Login</button></Link>
      </div>
      <h1>Welcome to GutenBae!</h1>
      <div>
        <input 
          type="text" 
          placeholder="Enter a keyword" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          id="search-query" // Added id
          name="search-query" // Added name
        />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          id="filter" // Added id
          name="filter" // Added name
        >
          <option value="all">All</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="subject">Subject</option>
          <option value="text">Full Text</option>
        </select>
        <button onClick={handleSearch} disabled={isLoading} id="search-button"> 
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Gutendex Results (Scrollable Cards) */}
      <div style={{ width: '100%', marginTop: '20px' }}>
        <h2>Free Books (Gutendex)</h2>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '15px',
          padding: '10px',
          whiteSpace: 'nowrap'
        }}>
          {isLoading ? <p>Searching...</p> : (
            freeResults.length === 0 ? <p></p> :
              freeResults.map((book, index) => (
                book.title && (
                  <div key={index} style={{
                    minWidth: '250px',
                    minHeight:'300px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author"><strong>Author(s):</strong> {book.authors?.map(a => a.name).join(', ') || 'Unknown'}</p>
                    {book.subjects?.length > 0 && <p className="book-topic"><strong>Topic:</strong> {book.subjects[1]}</p>}
                    {book.formats?.['image/jpeg'] && (
                      <img src={book.formats['image/jpeg']} alt="Book thumbnail" style={{ maxWidth: '100px' }} />
                    )}
                    <p><strong>Download:</strong>
                      {book.formats?.['application/epub+zip'] && (<a href={book.formats['application/epub+zip']} target="_blank" rel="noopener noreferrer"> EPUB</a>)} |
                      {book.formats?.['application/x-mobipocket-ebook'] && (<a href={book.formats['application/x-mobipocket-ebook']} target="_blank" rel="noopener noreferrer"> Kindle</a>)} |
                      {book.formats?.['text/html'] && (<a href={book.formats['text/html']} target="_blank" rel="noopener noreferrer"> HTML</a>)}
                      <button onClick={() => handleLike(book.bookId)}>Like</button>
                    </p>
                  </div>
                )
              ))
          )}
        </div>
      </div>

      {/* Google Books Results (Scrollable Cards) */}
      <div style={{ width: '100%', marginTop: '20px' }}>
        <h2>Google Books Results</h2>
        <div className="slider-container"></div>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '15px',
          padding: '10px',
          whiteSpace: 'nowrap'
        }}>
          {isLoading ? <p>Searching...</p> : (
            googleResults.length === 0 ? <p></p> :
              googleResults.map((book, index) => (
                <div key={index} className="book-card" style={{
                  minWidth: '250px',
                  minHeight:'300px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center'
                }}>
                  <h3 className="book-title">{book.volumeInfo?.title || 'No title available'}</h3>
                  <p className="book-author"><strong>Author(s):</strong> {book.volumeInfo?.authors?.join(', ') || 'Unknown'}</p>
                  {book.volumeInfo?.imageLinks?.thumbnail && (
                    <img src={book.volumeInfo.imageLinks.thumbnail} alt="Book thumbnail" style={{ maxWidth: '100px' }} />
                  )}
                  <a href={book.volumeInfo?.infoLink} target="_blank" rel="noopener noreferrer">Read More</a>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
