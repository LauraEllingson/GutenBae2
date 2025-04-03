import React from 'react';

export const formatMultilineTitle = (title, options = {}) => {
  const {
    firstLineClass = 'text-4xl font-normal sm:text-5xl font-caslon',
    otherLinesClass = 'text-xl font-normal not-italic font-caslon',
    wordsPerLine = 6,
  } = options;

  if (!title) return null;

  const cleaned = title
    .replace(/\$b/g, '')
    .replace(/[-–—]/g, '')
    .replace(/\b\w/g, char => char.toUpperCase());

  const words = cleaned.split(/\s+/);
  const lines = [];

  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '));
  }

  return (
    <>
      {lines.map((line, index) => (
        <span
          key={index}
          className={`block ${index === 0 ? firstLineClass : otherLinesClass}`}
        >
          {line}
        </span>
      ))}
    </>
  );
};
