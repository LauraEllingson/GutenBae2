export const shareBook = (book, setMessage) => {
    if (!book || !book.id) return;
  
    const url = `${window.location.origin}/shared-book/${book.id}`;
    const title = book.title || "Book";
    const authors = book.authors?.map((a) => a.name).join(", ") || "";
  
    if (navigator.share) {
      navigator.share({
        title,
        text: `Check out this book: ${title} by ${authors}`,
        url,
      }).catch(() => {
        setMessage?.("Sharing failed or was canceled.");
        setTimeout(() => setMessage?.(null), 3000);
      });
    } else {
      navigator.clipboard.writeText(url)
        .then(() => {
          setMessage?.("Link copied to clipboard.");
          setTimeout(() => setMessage?.(null), 3000);
        })
        .catch(() => {
          setMessage?.("Could not copy link.");
          setTimeout(() => setMessage?.(null), 3000);
        });
    }
  };
  