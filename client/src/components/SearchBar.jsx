import React from 'react';

const SearchBar = ({ query, onChange, onSubmit, isLoading }) => {
  return (
    <div className="w-full bg-white shadow-[0_4px_8px_-4px_rgba(0,0,0,0.1)] z-10 relative">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col items-center"
      >
        <input
          type="text"
          placeholder="Search by Author, Title or ISBN"
          value={query}
          onChange={onChange}
          className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-full text-sm text-center text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-[#cd2126] italic text-sm mt-2 mb-2 sm:text-xs text-center">
          {isLoading ? "Searching..." : "Discover Over 75,000 Books In the Public Domain!"}
        </p>
      </form>
    </div>
  );
};


export default SearchBar; // 
