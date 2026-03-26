'use client';

import { useState, useEffect } from "react";

export default function SearchPage() {

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  // useState for query (this is what users will type) then the results from the api

  async function handleSearch() {
    // fetch from /api/serach?q=${query}
    const url = `/api/search?q=${query}`

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
      setResults(result)
    } catch (error) {
      console.log(error)
    }
  }

  async function handleClick(result: { result_id: string }) {
    // POST to /api/track-click
    await fetch(`/api/track-click`, {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1', resultId: result.result_id, query })
    });
  }

  return (
    <div className="host-container flex flex-col items-center justify-center min-h-screen min-w-screen bg-[#123123] p-8">
      <div className="title pb-4 font-bold text-xl">Search Ranking App</div>
      <input onChange={(e) => setQuery(e.target.value)} type="text" className="border p-2 mb-4" placeholder="Enter text here..." />
      <button onClick={handleSearch}>Search</button>
      <div className="search-results">
        <div className="result m-4">
          {results.map((result: { result_id: string, score: number }) => (
            <div onClick={() => handleClick(result)} key={result.result_id}>
              {result.result_id} - score: {result.score}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// text input for searching
// hardcoded list of 5 fake search results (title + url strings)
// result is clickable