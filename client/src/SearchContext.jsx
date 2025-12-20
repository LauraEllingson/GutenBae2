import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [query, setQuery] = useState('');
  const [freeResults, setFreeResults] = useState([]);
  // googleResults removed per request to stop using Google Books API
  const [likedBookIds, setLikedBookIds] = useState(new Set());
  const [likedBookMap, setLikedBookMap] = useState({}); // bookId -> likedDocId
  const [likedBookDocs, setLikedBookDocs] = useState({}); // bookId -> likedBook doc
  const API_BASE = import.meta.env.VITE_API_URL || 'https://gutenbae2.onrender.com';

  useEffect(() => {
    // try to populate liked books for current user when token exists
    const token = localStorage.getItem('token');
    if (!token) return;
    let mounted = true;
    // Call verify-token to get the user id, then fetch their liked-books
    axios.post(`${API_BASE}/verify-token`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!mounted) return;
        const userId = res?.data?.user?._id;
        if (!userId) return;
        return axios.get(`${API_BASE}/users/${userId}/liked-books`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((res2) => {
        if (!mounted) return;
        if (!res2 || !res2.data) return;
        const map = {};
        const ids = new Set();
        const docs = {};
        (res2.data.likedBooks || []).forEach((b) => {
          const bid = String(b.bookId);
          ids.add(bid);
          map[bid] = String(b._id);
          docs[bid] = b;
        });
        setLikedBookIds(ids);
        setLikedBookMap(map);
        setLikedBookDocs(docs);
      })
      .catch(() => {
        // ignore errors
      });
    return () => { mounted = false; };
  }, [API_BASE]);

  const toggleLike = async (book, setMessage) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage?.('Please log in to like books.');
      setTimeout(() => setMessage?.(''), 3000);
      return;
    }

    const id = book.id || book.bookId;
    try {
      if (likedBookIds.has(String(id))) {
        // unlike: need the likedDocId
        const likedDocId = likedBookMap[String(id)];
        if (!likedDocId) {
            // fallback: call verify-token then fetch the user's liked-books to rebuild the map
            const verify = await axios.post(`${API_BASE}/verify-token`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const userId = verify?.data?.user?._id;
            if (userId) {
              const res2 = await axios.get(`${API_BASE}/users/${userId}/liked-books`, { headers: { Authorization: `Bearer ${token}` } });
              const map = {};
              (res2.data.likedBooks || []).forEach((b) => { map[String(b.bookId)] = String(b._id); });
              if (map[String(id)]) {
                await axios.delete(`${API_BASE}/like-book/${map[String(id)]}`, { headers: { Authorization: `Bearer ${token}` } });
                const next = new Set(likedBookIds);
                next.delete(String(id));
                setLikedBookIds(next);
                const nextMap = { ...likedBookMap };
                delete nextMap[String(id)];
                setLikedBookMap(nextMap);
              }
            }
        } else {
          await axios.delete(`${API_BASE}/like-book/${likedDocId}`, { headers: { Authorization: `Bearer ${token}` } });
          const next = new Set(likedBookIds);
          next.delete(String(id));
          setLikedBookIds(next);
          const nextMap = { ...likedBookMap };
          delete nextMap[String(id)];
          setLikedBookMap(nextMap);
        }
        setMessage?.('Removed from your library');
        setTimeout(() => setMessage?.(''), 2000);
        return;
      }

      // like
      const likedBookData = {
        bookId: id,
        title: book.title || book.volumeInfo?.title || 'Unknown',
        authors: book.authors ? book.authors.map((a) => a.name) : (book.volumeInfo?.authors || ['Unknown']),
        imageUrl: book.formats?.['image/jpeg'] || book.volumeInfo?.imageLinks?.thumbnail || '',
        description: (book.summaries && book.summaries.join('\n\n')) || book.volumeInfo?.description || 'No description available',
        formats: book.formats || {},
      };

  const res = await axios.post(`${API_BASE}/like-book`, likedBookData, { headers: { Authorization: `Bearer ${token}` } });
  const likedDoc = res.data.likedBook;
  const next = new Set(likedBookIds);
  next.add(String(id));
  setLikedBookIds(next);
  setLikedBookMap((prev) => ({ ...prev, [String(id)]: String(likedDoc._id) }));
  setLikedBookDocs((prev) => ({ ...prev, [String(id)]: likedDoc }));
      setMessage?.('Book saved to your library.');
      setTimeout(() => setMessage?.(''), 3000);
    } catch (err) {
      setMessage?.(err?.response?.data?.error || 'Could not update like');
      setTimeout(() => setMessage?.(''), 3000);
    }
  };

  return (
    <SearchContext.Provider
      value={{ query, setQuery, freeResults, setFreeResults, likedBookIds, setLikedBookIds, likedBookMap, setLikedBookMap, likedBookDocs, setLikedBookDocs, toggleLike }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
