import React from 'react';
import {
  IconEPUB,
  IconRead,
  IconHeart,
  IconShare,
  IconTrash,
  IconBookOpen,
  IconClickable,
  IconKindle,
} from '../utils/icons';
import submark from '../assets/r_submark.png';

const Landing = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4  mt-10 mb-10">
      <div className="flex flex-col md:flex-row md:items-start md:gap-12 text-center md:text-left">
        {/* Left Side */}
        <div className="flex-1 flex flex-col items-center md:items-start">
          <img
            src={submark}
            alt="Logo"
            className="w-80 h-80 mb-1"
          />
          <h2 className="text-3xl sm:text-4xl font-caslon font-bold text-red-700 leading-tight">
            <div>We’re Making Books</div>
            <div className="text-2xl italic mt-1">More Accessible</div>
          </h2>
          <p className="text-gray-700 text-base font-fira leading-relaxed mt-6 max-w-xl">
            Gutenbae combines the power of two APIs to bring you the widest range of reading options.
            With Project Gutenberg’s API (Gutendex), you can access over 75,000 books in the public domain—completely free.
            We also tap into the Google Books API, because let’s face it—sometimes you want something new, modern, or trending.
            <br /><br />
            Dive in now and discover your next favorite title!
          </p>
        </div>

        {/* Right Side - Features */}
        <div className="flex-1 flex flex-col justify-end items-center md:items-end mt-10 md:mt-10">
          <h3 className="text-lg font-bold text-red-700 mb-4 text-center max-w-sm w-full self-center md:self-end">
            User First Design
          </h3>

          <div className="grid max-w-sm w-full h-full grid-cols-1 sm:grid-cols-2 md:grid-rows-4 gap-0 text-gray-700 text-sm font-fira border border-gray-300 self-center md:self-end">
            {[
              {
                icon: <IconEPUB />,
                text: "Download the EPUB directly to your device to read on your E-reader  — no login required",
              },

              {
                icon: <IconKindle />,
                text: "Download a Kindle-compatible file to read on your Kindle",
              },
              {
                icon: <IconRead />,
                text: "Read or preview a book in your browser instantly using the book preview link",
              },
              {
                icon: <IconHeart/>,
                text: "Like books to save them to your personal library for later reading or downloading",
              },
              {
                icon: <IconClickable />,
                text: "Clickable book cards with detailed info before you decide to save or download",
              },
              {
                icon: <IconTrash />,
                text: "Delete liked books from your dashboard — no clutter if you change your mind",
              },
              {
                icon: <IconBookOpen />,
                text: "Browse the most downloaded titles for inspiration when you're not sure what to read",
              },
              
              {
                icon: <IconShare />,
                text: "Share the book with a friend so they can read it too!",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 border border-gray-300"
              >
                <div className="pt-1 text-red-600">{item.icon}</div>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Landing;
