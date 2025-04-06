import React from 'react';
import { IconRead } from '../utils/icons';

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

      {/* Icon Row */}
      <div className="flex items-center justify-left mt-2 text-red-600 text-sm">
        {infoLink && (
          <a
            href={infoLink}
            title="View in Google Books"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 hover:underline"
          >
            <IconRead className="text-lg" />
            <span className="text-[10px]">More From Google</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default GoogleSliderCard;
