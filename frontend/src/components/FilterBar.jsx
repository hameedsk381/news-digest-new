import { Filter } from 'lucide-react'

const CATEGORIES = [
  'All', 'Politics', 'Sports', 'Business', 'Technology',
  'Entertainment', 'Health', 'Science', 'World', 'Education', 'Environment',
]

const SENTIMENTS = ['All', 'Positive', 'Negative', 'Neutral']

export default function FilterBar({
  selectedCategory,
  selectedSentiment,
  onCategoryChange,
  onSentimentChange,
}) {
  return (
    <div className="space-y-6 animate-in" id="filter-bar">
      <div className="flex flex-col gap-6">
        {/* Category Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-neutral-600">
            <Filter size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Class Filter
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat === 'All' ? '' : cat)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border ${
                  (cat === 'All' && !selectedCategory) || selectedCategory === cat 
                    ? 'bg-white text-black border-white' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sentiment Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-neutral-600">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Sentiment Analysis
            </span>
          </div>
          <div className="flex gap-1.5">
            {SENTIMENTS.map((sent) => (
              <button
                key={sent}
                onClick={() => onSentimentChange(sent === 'All' ? '' : sent)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border ${
                  (sent === 'All' && !selectedSentiment) || selectedSentiment === sent 
                    ? 'bg-white text-black border-white' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {sent}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
