'use client';

import { useState, useEffect, useRef } from "react";

type Result = { result_id: string; score: number; query?: string; click_count?: number };
type LogEntry = { id: number; ts: string; kind: 'click' | 'search' | 'rank' | 'error'; msg: string };

let logId = 0;

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [source, setSource] = useState('')
  const [rankings, setRankings] = useState<Result[]>([])
  const [clickedId, setClickedId] = useState<string | null>(null)
  const [rankDeltas, setRankDeltas] = useState<Record<string, number>>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const prevRankingsRef = useRef<Result[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  function addLog(kind: LogEntry['kind'], msg: string) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev.slice(-99), { id: logId++, ts, kind, msg }])
  }

  async function handleRankings() {
    const url = `/api/rankings`
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status}`)
      const data: Result[] = await response.json()

      // Compute rank deltas vs previous
      const prevOrder = prevRankingsRef.current
      if (prevOrder.length > 0) {
        const deltas: Record<string, number> = {}
        data.forEach((item, newIdx) => {
          const oldIdx = prevOrder.findIndex(p => p.result_id === item.result_id && p.query === item.query)
          if (oldIdx !== -1 && oldIdx !== newIdx) {
            deltas[`${item.result_id}-${item.query}`] = oldIdx - newIdx // positive = moved up
          }
        })
        if (Object.keys(deltas).length > 0) {
          setRankDeltas(deltas)
          setTimeout(() => setRankDeltas({}), 2000)
          Object.entries(deltas).forEach(([key, d]) => {
            addLog('rank', `rank change: "${key}" moved ${d > 0 ? `↑${d}` : `↓${Math.abs(d)}`}`)
          })
        }
      }
      prevRankingsRef.current = data
      setRankings(data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    handleRankings()
    const interval = setInterval(handleRankings, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleSearch() {
    const url = `/api/search?q=${encodeURIComponent(query)}`
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status}`)
      const { results: data, source } = await response.json()
      setResults(data)
      setSource(source)
      addLog('search', `search "${query}" → ${data.length} results via ${source}`)
    } catch (error) {
      addLog('error', `search failed: ${error}`)
      console.log(error)
    }
  }

  async function handleClick(result: Result) {
    setClickedId(result.result_id)
    setTimeout(() => setClickedId(null), 600)
    addLog('click', `clicked "${result.result_id}" for query "${query}" (score ${result.score.toFixed(2)})`)

    await fetch(`/api/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user1', resultId: result.result_id, query })
    })
    setTimeout(() => handleSearch(), 1200)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-4">
      <style>{`
        @keyframes clickFlash {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.6); border-color: rgba(52,211,153,0.8); }
          50%  { box-shadow: 0 0 0 6px rgba(52,211,153,0); border-color: rgba(52,211,153,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); border-color: rgb(31,41,55); }
        }
        .click-flash {
          animation: clickFlash 0.6s ease-out forwards;
        }
        @keyframes deltaFade {
          0%   { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .delta-badge {
          animation: deltaFade 2s ease-out forwards;
        }
      `}</style>

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
        <p className="text-xs text-gray-500 mb-2">Source: <span className={source === 'redis' ? 'text-emerald-400' : 'text-blue-400'}>{source}</span></p>
      )}

      <div className="w-full max-w-xl space-y-2">
        {results.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-2">Search to see ranked results</p>
        ) : results.map((result, i) => (
          <div
            key={result.result_id}
            onClick={() => handleClick(result)}
            className={`bg-[#123123] border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors ${clickedId === result.result_id ? 'click-flash' : ''}`}
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

      <div className="w-full max-w-xl mt-8">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Live leaderboard</p>
        <div className="space-y-2">
          {rankings.map((r, i) => {
            const key = `${r.result_id}-${r.query}`
            const delta = rankDeltas[key]
            return (
              <div key={key} className="bg-[#123123] border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">{i + 1}</div>
                  <div>
                    <div className="text-sm font-medium">{r.result_id}</div>
                    <div className="text-xs text-gray-500">query: {r.query} · clicks: {r.click_count}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {delta !== undefined && (
                    <span className={`delta-badge text-xs font-medium ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                    </span>
                  )}
                  <div className="text-xs text-gray-400">{Number(r.score).toFixed(2)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Console */}
      <div className="w-full max-w-xl mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Console</p>
          {logs.length > 0 && (
            <button onClick={() => setLogs([])} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">clear</button>
          )}
        </div>
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 h-24 overflow-y-auto font-mono">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-700">awaiting events...</p>
          ) : [...logs].reverse().map(log => (
            <div key={log.id} className="flex gap-2 text-xs leading-5">
              <span className="text-gray-600 shrink-0">{log.ts}</span>
              <span className={
                log.kind === 'click' ? 'text-emerald-400' :
                  log.kind === 'rank' ? 'text-yellow-400' :
                    log.kind === 'error' ? 'text-rose-400' :
                      'text-blue-400'
              }>
                {log.kind === 'click' ? '[click]' : log.kind === 'rank' ? '[rank]' : log.kind === 'error' ? '[error]' : '[search]'}
              </span>
              <span className="text-gray-400">{log.msg}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  )
}