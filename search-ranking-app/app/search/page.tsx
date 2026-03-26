'use client';

import { useState } from "react";

type Result = { result_id: string; score: number };

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [source, setSource] = useState('')

  async function handleSearch() {
    const url = `/api/search?q=${encodeURIComponent(query)}`
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status}`)
      const { results: data, source } = await response.json()
      setResults(data)
      setSource(source)
    } catch (error) {
      console.log(error)
    }
  }

  async function handleClick(result: Result) {
    await fetch(`/api/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user1', resultId: result.result_id, query })
    })
    setTimeout(() => handleSearch(), 1200)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-12">
      <h1 className="text-2xl font-medium mb-2">Search ranking</h1>
      <p className="text-sm text-gray-400 mb-8">Kafka · Redis · Postgres</p>

      <div className="flex gap-2 w-full max-w-xl mb-4">
        <input
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          type="text"
          className="flex-1 border px-3 py-2 rounded-lg text-sm outline-none"
          placeholder="Search anything..."
        />
        <button onClick={handleSearch} className="px-4 py-2 border rounded-lg text-sm hover:bg-[#123123]">
          Search
        </button>
      </div>

      {source && (
        <p className="text-xs text-gray-500 mb-4">Source: <span className={source === 'redis' ? 'text-emerald-400' : 'text-blue-400'}>{source}</span></p>
      )}

      <div className="w-full max-w-xl space-y-2">
        {results.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">Search to see ranked results</p>
        ) : results.map((result, i) => (
          <div
            key={result.result_id}
            onClick={() => handleClick(result)}
            className="bg-[#123123] border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-gray-500"
          >
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">{i + 1}</div>
              <div>
                <div className="text-sm font-medium">{result.result_id}</div>
                <div className="text-xs text-gray-500">Click to boost ranking</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">{result.score.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}