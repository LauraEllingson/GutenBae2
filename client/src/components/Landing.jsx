import React from 'react';
import {
  Download,
  Eye,
  Heart,
  Sparkles,
  Trash,
  BookOpen,
} from 'lucide-react';
import submark from '../assets/r_submark.png';

const Landing = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16 mt-10 mb-10">
      <div className="flex flex-col md:flex-row md:items-start md:gap-12 text-center md:text-left">
        
        {/* Left Side - Icon, Title, Paragraph */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
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
            Gutenbae uses two APIs to give you the widest range of options. Through Project Gutenberg’s API
            you can search over 75,000 public domain books, which returns completely free results.
            If you’re looking for something more recent, don’t worry — we also include results from
            Google Books, so you'll always find something to read.
          </p>
        </div>

        {/* Right Side - Features */}
        <div className="flex-1 flex flex-col justify-end items-center md:items-end mt-10 md:mt-10">
        <h3 className="text-lg font-bold  text-red-700 mb-4 text-center max-w-sm w-full self-center md:self-end">
User First Design 
</h3>


          <div className="grid max-w-sm w-full h-full grid-cols-1 sm:grid-cols-2 md:grid-rows-3 gap-0 text-gray-700 text-sm font-fira border border-gray-300 self-center md:self-end">
            {[
              {
                icon: <Download className="w-5 h-5 text-red-600" />,
                text: "Download EPUB and Kindle versions directly to your device — no login required",
              },
              {
                icon: <Eye className="w-5 h-5 text-red-600" />,
                text: "Read in your browser instantly using the book preview link",
              },
              {
                icon: <Heart className="w-5 h-5 text-red-600" />,
                text: "Like books to save them to your personal library for later reading or downloading",
              },
              {
                icon: <Sparkles className="w-5 h-5 text-red-600" />,
                text: "Clickable book cards with detailed info before you decide to save or download",
              },
              {
                icon: <Trash className="w-5 h-5 text-red-600" />,
                text: "Delete liked books from your dashboard — no clutter if you change your mind",
              },
              {
                icon: <BookOpen className="w-5 h-5 text-red-600" />,
                text: "Browse the most downloaded titles for inspiration when you're not sure what to read",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 border border-gray-300"
              >
                <div className="pt-1">{item.icon}</div>
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
