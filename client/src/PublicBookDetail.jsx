import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { formatMultilineTitle } from './utils/formatMultilineTitle';


const PublicBookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`https://gutendex.com/books/${id}`)
      .then((res) => {
        if (res.data.detail) {
          setError(res.data.detail);
        } else {
          setBook(res.data);
        }
      })
      .catch(() => {
        setError("Failed to load book details.");
      });
  }, [id]);

  const handleShare = () => {
    if (!book) return;
    const detailURL = `${window.location.origin}/shared-book/${book.id}`;
    const shareData = {
      title: book.title,
      text: `Check out this book: ${book.title} by ${book.authors.map(a => a.name).join(", ")}`,
      url: detailURL,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(detailURL);
      alert("Link copied to clipboard!");
    }
  };

  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!book) return <p className="text-center mt-10">Loading...</p>;

  const description = book.summaries?.length
    ? book.summaries.join("\n\n")
    : "No description available";

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* LEFT COLUMN - Info */}
        <div className="flex-1">
        <h1 className="book-title">
  {formatMultilineTitle(book.title, {
    firstLineClass: 'text-4xl sm:text-4xl font-caslon', // add google libre caslon
    otherLinesClass: 'text-lg text-gray-600 font-caslon'
  })}
</h1>


          <p className="text-sm text-gray-500 mb-6">
            {book.authors.map(a => a.name).join(", ")}
          </p>

          <div className="space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed max-w-prose mb-6">
            {description.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#cd2126] font-medium mt-4">
            {book.formats?.["application/epub+zip"] && (
              <a
                href={book.formats["application/epub+zip"]}
                target="_blank"
                rel="noopener noreferrer"
              >
                EPUB
              </a>
            )}
            {book.formats?.["application/x-mobipocket-ebook"] && (
              <>
                <span>|</span>
                <a
                  href={book.formats["application/x-mobipocket-ebook"]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kindle
                </a>
              </>
            )}
            {book.formats?.["text/html"] && (
              <>
                <span>|</span>
                <a
                  href={book.formats["text/html"]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  HTML
                </a>
              </>
            )}
            <span>|</span>
            <button onClick={handleShare} className="underline">Share</button>
            <span>|</span>
            <Link to="/" className="underline">Back to Search</Link>
          </div>
        </div>

        {/* RIGHT COLUMN - Cover Image */}
        <div className="flex-shrink-0 w-full max-w-sm mx-auto lg:mx-0">
          <img
            src={book.formats?.["image/jpeg"]}
            alt={book.title}
            className="w-full h-auto rounded shadow"
          />
        </div>
      </div>
    </div>
  );
};

export default PublicBookDetail;
