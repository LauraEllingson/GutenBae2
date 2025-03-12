import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./index.css";

const PublicBookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`https://gutendex.com/books/${id}`)
      .then((res) => {
        console.log("Fetched book from Gutendex:", res.data);
        if (res.data.detail) {
          setError(res.data.detail);
        } else {
          setBook(res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching book details:", err);
        setError("Failed to load book details.");
      });
  }, [id]);

  const handleShare = () => {
    if (!book) return;
    // url with domain and  book ID
    const detailURL = `${window.location.origin}/shared-book/${book.id}`;
    const shareData = {
      title: book.title,
      text: `Check out this book: ${book.title} by ${book.authors.map(a => a.name).join(", ")}`,
      url: detailURL,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log("Shared successfully"))
        .catch((error) => {
          if (error.name === "AbortError") {
            console.log("Share canceled by the user");
          } else {
            console.error("Error sharing:", error);
          }
        });
    } else {
      navigator.clipboard.writeText(detailURL)
        .then(() => console.log("Link copied to clipboard"))
        .catch((error) => console.error("Error copying link:", error));
    }
  };

  if (error) return <p>{error}</p>;
  if (!book) return <p>Loading...</p>;

  //  use summaries array as description
  const description =
    book.summaries && book.summaries.length > 0 
      ? book.summaries.join("\n\n")
      : "No description available";

  return (
    <div className="book-detail">
      <h2>{book.title}</h2>
      <p>By: {book.authors.map(a => a.name).join(", ")}</p>
      <img src={book.formats?.["image/jpeg"]} alt={book.title} />
      
      <div className="description-section">
        <h3>Description</h3>
        <p>{description}</p>
      </div>
      
      <div className="download-options">
        {book.formats?.["application/epub+zip"] && (
          <a
            href={book.formats["application/epub+zip"]}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download EPUB
          </a>
        )}
        {book.formats?.["text/html"] && (
          <a
            href={book.formats["text/html"]}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read in Browser
          </a>
        )}
      </div>
      
      <div className="share-section">
        <button onClick={handleShare}>Share this Book</button>
      </div>
      
      <Link to="/">Go back to Home</Link>
    </div>
  );
};

export default PublicBookDetail;
