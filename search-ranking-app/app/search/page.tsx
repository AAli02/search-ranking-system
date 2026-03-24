'use client';

import { useState } from 'react';

export default function SearchPage() {

  const searchResults = [
    {
      title: "Result 1 - hardcoded",
      URL: "https://devlet.co"
    },
    {
      title: "Result 2 - hardcoded",
      URL: "https://devlet.co"
    },
    {
      title: "Result 3 - hardcoded",
      URL: "https://devlet.co"
    },
    {
      title: "Result 4 - hardcoded",
      URL: "https://devlet.co"
    },
    {
      title: "Result 5 - hardcoded",
      URL: "https://devlet.co"
    }
  ];

  return (
    <div className="host-container min-h-screen min-w-screen bg-gray-100 p-16">
      <div className="main-container max-w-3xl bg-gray-400 p-16">
        <input type="text" className="border p-2 mb-4" placeholder="Enter text here..." />
        <div className="search-results">
          <div className="result m-4">
            {searchResults.map((result) => (
              <li onClick={() => console.log(result)} key={result.title}>{result.title} - {result.URL}</li>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// text input for searching
// hardcoded list of 5 fake search results (title + url strings)
// result is clickable