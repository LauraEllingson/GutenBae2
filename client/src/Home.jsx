import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([{ message: 'Please enter a keyword to search.' }]);
      return;
    }

    setIsLoading(true);
    setResults([{ message: 'Searching...' }]);

    const gutendexApiUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page_size=10`;
    const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;

    try {
      const [gutendexResponse, googleResponse] = await Promise.all([
        fetch(gutendexApiUrl),
        fetch(googleApiUrl)
      ]);

      const gutendexData = await gutendexResponse.json();
      const googleData = await googleResponse.json();

      let displayedResults = 0;
      const maxResults = 20;
      const combinedResults = [];

      const gutendexResults = gutendexData.results || [];
      const googleResults = googleData.items || [];

      for (let i = 0; i < Math.max(gutendexResults.length, googleResults.length); i++) {
        if (displayedResults >= maxResults) break;

        const gutendexBook = gutendexResults[i];
        const googleBook = googleResults[i]?.volumeInfo;

        const bookElement = (
          <div key={displayedResults} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
            {/* Gutendex details */}
            {gutendexBook && displayedResults < maxResults && (
              <>
                <h3>{gutendexBook.title} (Gutendex)</h3>
                <p><strong>Author(s):</strong> {gutendexBook.authors.map(a => a.name).join(', ') || 'Unknown'}</p>
                <p><strong>Subjects:</strong> {gutendexBook.subjects.join(', ') || 'None'}</p>
                <p><strong>Languages:</strong> {gutendexBook.languages.join(', ')}</p>
                <p><strong>Download:</strong>
                  <a href={gutendexBook.formats['text/plain']} target="_blank" rel="noopener noreferrer">Text</a> |
                  <a href={gutendexBook.formats['application/epub+zip']} target="_blank" rel="noopener noreferrer">EPUB</a> |
                  <a href={gutendexBook.formats['text/html']} target="_blank" rel="noopener noreferrer">HTML</a>
                <button onClick={() => shareResult(googleBook)}>Share</button>
                </p>
              </>
            )}

            {/* Google Books details */}
            {googleBook && displayedResults < maxResults && (
              <>
                <h3>{googleBook.title || 'Unknown Title'} (Google Books)</h3>
                <p><strong>Author(s):</strong> {googleBook.authors ? googleBook.authors.join(', ') : 'Unknown'}</p>
                <p><strong>Description:</strong> {googleBook.description ? googleBook.description.substring(0, 100) : 'No description available.'}...</p>
                <img src={googleBook.imageLinks?.thumbnail || 'https://via.placeholder.com/120x160?text=No+Image'} alt={googleBook.title || 'No Image'} />
                <p><a href={googleBook.infoLink} target="_blank" rel="noopener noreferrer">More details</a></p>
                
    
                <button onClick={() => shareResult(googleBook)}>Share</button>
              </>
            )}
          </div>
        );

        combinedResults.push(bookElement);
        displayedResults++;
      }

      if (combinedResults.length === 0) {
        setResults([{ message: 'No books found from either Gutendex or Google Books.' }]);
      } else {
        setResults(combinedResults);
      }

    } catch (error) {
      console.error('Error fetching data from the APIs:', error);
      setResults([{ message: 'Error fetching results. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };


  const shareResult = (book) => {
    const url = book?.infoLink || 'https://example.com';  // Fallback URL if infoLink is not available.
    if (navigator.share) {
      // share
      navigator.share({
        title: book?.title || 'Check out this book!',
        url: url,
      }).then(() => {
        console.log('Shared successfully');
      }).catch((err) => {
        console.error('Error sharing:', err);
      });
    } else {
      // Create a shareable URL link
      prompt('Copy this link to share:', url);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', textAlign: 'right', marginBottom: '20px' }}>
        <Link to="/register">
          <button>Register</button>
        </Link>
        <Link to="/login">
          <button>Login</button>
        </Link>
      </div>

      <h1>Welcome to GutenBae!</h1>

      <div>
        <input
          type="text"
          id="searchInput"
          placeholder="Enter a keyword"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button id="searchButton" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div id="results">
        {results.length > 0 && results.map((result, index) => (
          <p key={index}>{result.message || result}</p>
        ))}
      </div>


    </div>
  );
};

export default Home;