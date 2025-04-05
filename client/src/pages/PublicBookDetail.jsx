import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { formatMultilineTitle } from '../utils/formatMultilineTitle';
import Nav from '../components/Nav';

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

  const htmlPreviewUrl = Object.entries(book.formats).find(
    ([key, value]) => key.startsWith("text/html") && value.includes("gutenberg")
  )?.[1];

  return (
    <>
      <Nav />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* LEFT COLUMN */}
          <div className="flex-1 text-sm sm:text-base text-gray-800 leading-relaxed">
            <h1 className="mb-2">
              {formatMultilineTitle(book.title, {
                firstLineClass: 'text-2xl sm:text-3xl  font-caslon-display leading-tight',
                otherLinesClass: ' sm:text-lg  font-caslon-display  leading-snug'
              })}
            </h1>

            <p className="text-xs sm:text-sm  text-gray-500 italic mb-6">
              {book.authors.map(a => a.name).join(", ")}
            </p>

            <div className="mb-6 max-w-prose">
              <div className="relative mb-4">
                {book.formats?.["image/jpeg"] && (
                  <img
                    src={book.formats["image/jpeg"]}
                    alt={book.title}
                    className="float-left mr-4 mb-2 w-20 sm:w-24 "
                  />
                )}
                {description.split("\n\n").map((para, i) => (
                  <p key={i} className={i > 0 ? "clear-left mt-4 text-sm" : ""}>
                    {para}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[#cd2126]  mt-4">
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
              {htmlPreviewUrl && (
                <>
                  <span>|</span>
                  <a
                    href={htmlPreviewUrl}
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

          {/* DIVIDER */}
          <div className="hidden lg:block w-px bg-gray-200"></div>

          {/* RIGHT COLUMN */}
          <div className="flex-1">
            <h2 className="text-xs sm:text-sm  text-[#cd2126] font-fira  mb-2">
              Preview
            </h2>
            <div className="w-full h-[650px] border border-gray-100  overflow-hidden bg-white/70 backdrop-blur-sm shadow-inner">
              {htmlPreviewUrl ? (
                <iframe
                  src={htmlPreviewUrl}
                  title="Book Preview"
                  className="w-full h-full"
                ></iframe>
              ) : (
                <div className="p-4 text-gray-500 italic text-sm">
                  No HTML preview available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicBookDetail;
