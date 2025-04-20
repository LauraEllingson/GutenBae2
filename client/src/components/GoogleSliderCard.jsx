import React, { useState } from 'react';
import {
  IconRead,
  IconShare,
} from '../utils/icons';
import { shareBook } from '../utils/shareBook';

const GoogleSliderCard = ({ book, isLiked, onLike, onClick }) => {
  const [message, setMessage] = useState(null);

  const title = book.volumeInfo?.title || 'No title';
  const authors = book.volumeInfo?.authors?.join(', ') || 'Unknown';
  const description =
    book.volumeInfo?.description || 'No summary available.';
  const infoLink = book.volumeInfo?.infoLink;

  return (
    <div
      onClick={onClick}
      className="h-[250px] min-w-[200px] max-w-[240px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
    >
      <div>
        <h3 className="font-caslon font-[600] text-sm leading-tight mb-1 text-gray-700 overflow-hidden text-ellipsis"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {title}
        </h3>

        <p className="text-xs font-light font-caslon leading-tight mb-2 text-gray-700">
          {authors}
        </p>
        <p className="text-xs text-gray-500 text-left overflow-hidden h-[100px] leading-snug">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-3 items-center text-red-600 text-lg">
          {infoLink && (
            <a
              href={infoLink}
              title="View in Google Books"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconRead />
            </a>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              shareBook(book, setMessage);
            }}
            title="Share"
            className="hover:opacity-80"
          >
            <IconShare />
          </button>
        </div>
      </div>

      {message && (
        <p className="text-xs text-green-600 mt-2">{message}</p>
      )}
    </div>
  );
};

export default GoogleSliderCard;
