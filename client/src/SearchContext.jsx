import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [query, setQuery] = useState('');
  const [freeResults, setFreeResults] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);

  return (
    <SearchContext.Provider
      value={{ query, setQuery, freeResults, setFreeResults, googleResults, setGoogleResults }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
