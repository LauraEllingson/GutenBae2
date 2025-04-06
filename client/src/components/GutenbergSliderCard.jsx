import React from 'react';
import {
  IconBookOpen,
  IconEPUB,
  IconKindle,
  IconShare,
  IconHeart,
  IconHeartOutline,
  IconRead,
} from '../utils/icons';

const GutenbergSliderCard = ({ book, isLiked, onLike, onClick }) => {
  const title = book.title;
  const authors = book.authors?.map((a) => a.name).join(', ') || 'Unknown';
  const summary = book.summaries?.[0];

  const epubLink = book.formats?.['application/epub+zip'];
  const htmlLink = book.formats?.['text/html'];
  const kindleLink = book.formats?.['application/x-mobipocket-ebook'];

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: book.title,
        url: window.location.href,
      }).catch(() => {
        alert('Sharing failed or not supported.');
      });
    } else {
      alert('Sharing not supported in this browser.');
    }
  };

  return (
    <div
      onClick={onClick}
      className="min-w-[220px] md:min-w-[240px] lg:min-w-[260px] p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md cursor-pointer"
    >
      <div>
        <h3 className="font-caslon font-[600] text-sm leading-tight mb-1 text-gray-700">
          {title}
        </h3>
        <p className="text-xs font-light font-caslon leading-tight mb-2 text-gray-700">
          {authors}
        </p>
        <p className="text-xs text-gray-500 truncate-summary">
          {summary}
        </p>
      </div>

      <div className="flex items-center justify-between mt-3">
        {/* Left icon group */}
        <div className="flex gap-3 items-center text-red-600 text-lg">
          {htmlLink && (
            <a
              href={htmlLink}
              title="Read in Browser"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconRead />
            </a>
          )}

          {epubLink && (
            <a
              href={epubLink}
              title="Download EPUB"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEPUB />
            </a>
          )}

          {kindleLink && (
            <a
              href={kindleLink}
              title="Download Kindle"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconKindle />
            </a>
          )}

          <button
            onClick={handleShare}
            title="Share"
            className="hover:opacity-80"
          >
            <IconShare />
          </button>
        </div>

        {/* Like button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(book);
          }}
          title={isLiked ? 'Liked' : 'Like this book'}
        >
          {isLiked ? <IconHeart /> : <IconHeartOutline />}
        </button>
      </div>
    </div>
  );
};

export default GutenbergSliderCard;
