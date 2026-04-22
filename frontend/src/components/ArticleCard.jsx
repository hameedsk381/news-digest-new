import { useNavigate } from 'react-router-dom'
import { Clock, Trash2, Shield, Sparkles } from 'lucide-react'

export default function ArticleCard({ article, onDelete }) {
  const navigate = useNavigate()

  const preview = article.summary || (article.content?.slice(0, 180) + '...')
  const timeAgo = article.created_at
    ? new Date(article.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : ''

  const impact = article.sentiment?.societal_impact || 'Neutral'

  return (
    <div
      className="p-5 cursor-pointer group bg-black border border-neutral-800 rounded-md transition-all hover:bg-neutral-900/50 hover:border-neutral-700 active:scale-[0.99] animate-in"
      onClick={() => navigate(`/article/${article._id}`)}
      id={`article-card-${article._id}`}
    >
      {/* Header: Category + Impact */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <span className="px-2.5 py-0.5 rounded-sm border border-neutral-800 bg-neutral-900/50 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            {article.category}
          </span>
          {article.source_language && article.source_language !== 'English' && (
            <span className="px-2.5 py-0.5 rounded-sm border border-neutral-800 bg-black font-mono text-[10px] uppercase tracking-wider text-white">
              {article.source_language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {impact !== 'Neutral' && (
            <div className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-tighter px-2 py-0.5 rounded border transition-colors ${
              impact === 'Beneficial' ? 'border-white text-white' : 'border-neutral-700 text-neutral-500'
            }`}>
              <Shield size={10} />
              {impact}
            </div>
          )}
          <div className="text-[10px] font-mono text-neutral-600">
            {Math.round(article.sentiment?.score * 100)}% Match
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[17px] font-bold mb-2 tracking-tight group-hover:text-white transition-colors leading-tight text-neutral-200">
        {article.title}
      </h3>

      {/* Preview / Summary */}
      <div className="mb-4">
        <p className="text-sm leading-relaxed line-clamp-3 text-neutral-500 font-medium">
          {preview}
        </p>
      </div>

      {/* Indian Context Tags */}
      {article.indian_context && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {article.indian_context.honorifics_detected?.map(h => (
            <span key={h} className="px-1.5 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
              {h}
            </span>
          ))}
          {article.indian_context.admin_levels?.map(a => (
            <span key={a} className="px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-widest">
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-600">
          <Clock size={12} strokeWidth={1.5} />
          {timeAgo}
        </div>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(article._id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-white/5 text-neutral-600 hover:text-white"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}
