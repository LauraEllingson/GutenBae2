import React, { useEffect, useState } from 'react';
import {
  IconRead,
  IconEPUB,
  IconKindle,
  IconShare,
  IconTrash,
} from '../utils/icons';

const decodeHtmlEntities = (str) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
};

const cleanTitle = (title) =>
  decodeHtmlEntities(title)
    .replace(/\$b/g, '')
    .replace(/—|–|&mdash;/g, '-')
    .trim();

const capitalizeTitle = (title) =>
  title.replace(/\b\w/g, (char) => char.toUpperCase());

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
};

const DashboardBookCard = ({
  book,
  onClick,
  onDelete,
  onShare,
}) => {
  const [truncateLength, setTruncateLength] = useState(160);

  useEffect(() => {
    const updateTruncateLength = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setTruncateLength(100);
      } else if (width < 1024) {
        setTruncateLength(100);
      } else if (width < 1280) {
        setTruncateLength(130);
      } else {
        setTruncateLength(160);
      }
    };

    updateTruncateLength();
    window.addEventListener('resize', updateTruncateLength);
    return () => window.removeEventListener('resize', updateTruncateLength);
  }, []);

  const title = capitalizeTitle(cleanTitle(book.title));
  const authors = book.authors?.join(', ') || 'Unknown';
  const summary = truncateText(book.description || 'No description available.', truncateLength);

  return (
    <div
      className="w-full max-w-[300px] h-auto border border-gray-200 shadow-sm bg-white p-4 hover:shadow-md transition cursor-pointer flex flex-col items-start text-left"
      onClick={onClick}
    >
      {/* Image */}
      <div className="mb-3 w-[80px] h-[110px] bg-gray-100 flex items-center justify-center overflow-hidden">
        {book.imageUrl ? (
          <img
            src={book.imageUrl}
            alt={book.title}
            className="object-contain max-h-full max-w-full"
          />
        ) : (
          <span className="text-xs text-gray-500 italic">No Cover</span>
        )}
      </div>

      {/* Title, author, summary */}
      <h3 className="font-caslon font-semibold text-xs sm:text-sm md:text-base text-gray-800 mb-1 text-left">
        {title}
      </h3>
      <p className="text-xs font-light font-caslon text-gray-700 mb-1 text-left">
        {authors}
      </p>
      <p className="text-xs text-gray-500 mb-2 text-left">
        {summary}
      </p>

      {/* Icons with labels */}
      <div className="mt-auto pt-2 w-full flex flex-wrap justify-start gap-4 text-red-600 text-sm">
        {book.formats?.['text/html'] && (
          <div className="flex flex-col items-center">
            <a
              href={book.formats['text/html']}
              title="Read in Browser"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconRead />
            </a>
            <span className="text-xs mt-1">Preview</span>
          </div>
        )}

        {book.formats?.['application/epub+zip'] && (
          <div className="flex flex-col items-center">
            <a
              href={book.formats['application/epub+zip']}
              title="Download EPUB"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEPUB />
            </a>
            <span className="text-xs mt-1">EPUB</span>
          </div>
        )}

        {book.formats?.['application/x-mobipocket-ebook'] && (
          <div className="flex flex-col items-center">
            <a
              href={book.formats['application/x-mobipocket-ebook']}
              title="Download Kindle"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconKindle />
            </a>
            <span className="text-xs mt-1">Kindle</span>
          </div>
        )}

        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            title="Share"
            className="hover:opacity-80"
          >
            <IconShare />
          </button>
          <span className="text-xs mt-1">Share</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Remove from library"
          >
            <IconTrash />
          </button>
          <span className="text-xs mt-1">Remove</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardBookCard;
