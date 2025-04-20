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

const GutenbergSliderCard = ({ book, isLiked, onLike, onClick, onShare }) => {
  const title = book.title;
  const authorsList = book.authors?.map((a) => a.name) || [];
const authors =
  authorsList.length > 2
    ? `${authorsList[0]}, ${authorsList[1]}, et al.`
    : authorsList.join(', ') || 'Unknown';

  const summary = book.summaries?.[0] || 'No summary available.';

  const epubLink = book.formats?.['application/epub+zip'];
  const htmlLink = book.formats?.['text/html'];
  const kindleLink = book.formats?.['application/x-mobipocket-ebook'];
  
  

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
  onClick={(e) => {
    e.stopPropagation();
    onShare(); // delegate to parent
  }}
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
