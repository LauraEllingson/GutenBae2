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
  // optional review object for the current user
  review,
  onDeleteReview,
  onUpdateReview,
}) => {
  const [truncateLength, setTruncateLength] = useState(160);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);

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

  useEffect(() => {
    if (review) {
      setEditText(review.text || "");
      setEditRating(review.rating || 5);
    }
  }, [review]);
  const MAX_REVIEW_CHARS = 1200;
  const clampText = (text) => (text && text.length > MAX_REVIEW_CHARS ? text.slice(0, MAX_REVIEW_CHARS) : text || "");
  const countParagraphs = (text) => {
    const s = (text || "").toString().trim();
    if (!s) return 0;
    return s.split(/\n\s*\n/).filter(Boolean).length;
  };

  return (
    <div
      className="w-full max-w-[300px] h-auto shadow-sm bg-white p-4 hover:shadow-md transition cursor-pointer flex flex-col items-start text-left"
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
  <div className="mt-auto pt-2 w-full flex items-center justify-between gap-2 text-red-600 text-sm">
        {book.formats?.['text/html'] && (
          <div className="w-12 flex flex-col items-center">
            <a
              href={book.formats['text/html']}
              title="Read in Browser"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconRead className="text-sm" />
            </a>
            <span className="text-xs mt-1">Preview</span>
          </div>
        )}

        {book.formats?.['application/epub+zip'] && (
          <div className="w-12 flex flex-col items-center">
            <a
              href={book.formats['application/epub+zip']}
              title="Download EPUB"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEPUB className="text-sm" />
            </a>
            <span className="text-xs mt-1">EPUB</span>
          </div>
        )}

        {book.formats?.['application/x-mobipocket-ebook'] && (
          <div className="w-12 flex flex-col items-center">
            <a
              href={book.formats['application/x-mobipocket-ebook']}
              title="Download Kindle"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconKindle className="text-sm" />
            </a>
            <span className="text-xs mt-1">Kindle</span>
          </div>
        )}

  <div className="w-12 flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            title="Share"
            className="hover:opacity-80"
          >
            <IconShare className="text-sm" />
          </button>
          <span className="text-xs mt-1">Share</span>
        </div>

        <div className="w-12 flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Remove from library"
          >
            <IconTrash className="text-sm text-red-600" />
          </button>
          <span className="text-xs mt-1">Remove</span>
        </div>
      </div>
      {/* Reviews removed from liked-book card UI; reviews are shown in the Reviews tab */}
    </div>
  );
};

export default DashboardBookCard;
