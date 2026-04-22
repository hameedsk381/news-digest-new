import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      onSearch(query.trim())
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query, onSearch])

  return (
    <div className="relative group" id="search-bar">
      <Search
        size={14}
        strokeWidth={2.5}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 group-focus-within:text-white transition-colors"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Query system entries..."
        className="bg-neutral-950 border border-neutral-800 rounded-md pl-10 pr-10 py-2.5 text-sm w-full text-white focus:outline-none focus:border-neutral-600 transition-colors placeholder-neutral-600"
        id="search-input"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5 text-neutral-600 hover:text-white transition-all"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
