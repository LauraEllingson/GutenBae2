import React from 'react';
import { FaBookOpen } from 'react-icons/fa';

const GoogleSliderCard = ({ book, onClick }) => {
  const title = book.volumeInfo?.title || 'No title';
  const authors = book.volumeInfo?.authors?.join(', ') || 'Unknown';
  const description = book.volumeInfo?.description?.slice(0, 300) || 'No summary available.';
  const infoLink = book.volumeInfo?.infoLink;

  return (
    <div
      onClick={onClick}
      className="min-w-[220px] md:min-w-[240px] lg:min-w-[260px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
    >
      <div>
        <h3 className="font-caslon font-[600] text-sm leading-tight mb-1 text-gray-700 text-left">
          {title}
        </h3>
        <p className="text-xs font-light font-caslon leading-tight mb-2 text-gray-700 text-left">
          {authors}
        </p>
        <p className="text-xs text-gray-500 truncate-summary text-left">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-end mt-2 text-red-600 text-lg">
        {infoLink && (
          <a
            href={infoLink}
            title="View in Google Books"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <FaBookOpen />
          </a>
        )}
      </div>
    </div>
  );
};

export default GoogleSliderCard;
