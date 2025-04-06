import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { formatMultilineTitle } from '../utils/formatMultilineTitle';
import Nav from '../components/Nav';
import {
  IconRead,
  IconEPUB,
  IconKindle,
  IconShare,
  IconHeart,
  IconHeartOutline,
} from "../utils/icons";

const PublicBookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

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

  const toggleLike = () => {
    setLiked(prev => !prev);
    alert(liked ? "Removed from liked books" : "Book already in your library!");
  };

  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!book) return <p className="text-center mt-10">Loading...</p>;

  const description = book.summaries?.length
    ? book.summaries.join("\n\n")
    : "No description available";

  return (
    <>
      <Nav />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-sm sm:text-base text-gray-800 leading-relaxed max-w-4xl mx-auto">
          <h1 className="mb-2">
            {formatMultilineTitle(book.title, {
              firstLineClass: 'text-2xl sm:text-3xl font-caslon-display leading-tight',
              otherLinesClass: 'sm:text-lg font-caslon-display leading-snug'
            })}
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 italic mb-4">
            {book.authors.map(a => a.name).join(", ")}
          </p>

          <div className="mb-6">
            {book.formats?.["image/jpeg"] && (
              <img
                src={book.formats["image/jpeg"]}
                alt={book.title}
                className="float-left mr-4 mb-2 w-20 sm:w-24"
              />
            )}
            {description.split("\n\n").map((para, i) => (
              <p key={i} className={i > 0 ? "clear-left mt-4 text-sm" : ""}>
                {para}
              </p>
            ))}
          </div>

          <ul className="mb-6 text-sm text-gray-700 space-y-1">
            <li><strong>ID:</strong> {book.id}</li>
            <li><strong>Subjects:</strong> {book.subjects.join(", ") || "N/A"}</li>
            <li><strong>Bookshelves:</strong> {book.bookshelves.join(", ") || "N/A"}</li>
            <li><strong>Languages:</strong> {book.languages.join(", ")}</li>
            <li><strong>Translators:</strong> {book.translators?.map(t => t.name).join(", ") || "None"}</li>
            <li><strong>Media Type:</strong> {book.media_type}</li>
            <li><strong>Download Count:</strong> {book.download_count}</li>
            <li><strong>Copyright:</strong> {book.copyright === null ? "Unknown" : book.copyright ? "Yes" : "No"}</li>
            <li><strong>Publication Date:</strong> {book?.publication_date || "Unknown"}</li>
          </ul>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#cd2126] mb-6">
            {book.formats?.["text/html"] && (
              <a
                href={book.formats["text/html"]}
                target="_blank"
                rel="noopener noreferrer"
                title="Read in Browser"
              >
                <IconRead className="inline mr-1" /> Preview
              </a>
            )}
            {book.formats?.["application/epub+zip"] && (
              <a
                href={book.formats["application/epub+zip"]}
                target="_blank"
                rel="noopener noreferrer"
                title="Download EPUB"
              >
                <IconEPUB className="inline mr-1" /> EPUB
              </a>
            )}
            {book.formats?.["application/x-mobipocket-ebook"] && (
              <a
                href={book.formats["application/x-mobipocket-ebook"]}
                target="_blank"
                rel="noopener noreferrer"
                title="Download Kindle"
              >
                <IconKindle className="inline mr-1" /> Kindle
              </a>
            )}
            <button onClick={handleShare} className="underline" title="Share">
              <IconShare className="inline mr-1" /> Share
            </button>
            <button onClick={toggleLike} className="text-[#cd2126] text-lg" title="Like">
              {liked ? <IconHeart /> : <IconHeartOutline />}
            </button>
          </div>

          <div className="text-sm text-center sm:text-left">
            <Link to="/" className="text-gray-600 hover:underline">
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicBookDetail;
