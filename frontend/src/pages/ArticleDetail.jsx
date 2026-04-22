import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, MapPin, User, Building2, Globe, Shield, Sparkles, MessageSquare } from 'lucide-react'
import { getArticle } from '../services/api'

const ENTITY_ICONS = {
  Person: User,
  Organization: Building2,
  Location: MapPin,
  Miscellaneous: Globe,
}

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getArticle(id)
        setArticle(data)
      } catch (err) {
        console.error('Failed to fetch article:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="skeleton h-8 w-24 mb-10" />
        <div className="space-y-8">
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-20 text-center border border-[#333] rounded-lg">
          <p className="text-[#888]">Article not found</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const timeStr = article.created_at
    ? new Date(article.created_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  // Group entities by label
  const entityGroups = {}
  if (article.entities) {
    article.entities.forEach((e) => {
      if (!entityGroups[e.label]) entityGroups[e.label] = []
      entityGroups[e.label].push(e.text)
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all mb-10 flex items-center gap-2 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <article>
        {/* Meta Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-500">
            {article.category}
          </span>
          <div className="w-1 h-1 rounded-full bg-neutral-800" />
          <span className="text-[11px] font-mono text-neutral-600">
            {article.sentiment?.label} Analysis
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[32px] sm:text-[42px] font-bold tracking-tight text-white leading-[1.1] mb-6">
          {article.title}
        </h1>

        {/* Info Row */}
        <div className="flex items-center gap-4 mb-10 text-[13px] text-neutral-500 font-medium border-b border-neutral-900 pb-6">
          <div className="flex items-center gap-1.5">
            <Clock size={14} strokeWidth={1.5} />
            {timeStr}
          </div>
          {article.source_file && (
            <>
              <div className="w-1 h-1 rounded-full bg-neutral-800" />
              <div className="truncate max-w-[200px]">Source: {article.source_file}</div>
            </>
          )}
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* AI Summary */}
          <div className="md:col-span-2 p-5 rounded-lg border border-neutral-800 bg-neutral-900/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-white" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                Abstract
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-neutral-300">
              {article.summary || "No automated summary available for this entry."}
            </p>
          </div>

          {/* Social Impact Card */}
          <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-950">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-neutral-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Impact
              </span>
            </div>
            <div className="text-[14px] font-bold text-white mb-1">
              {article.sentiment?.societal_impact || 'Neutral'}
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-600 font-medium">
              {article.sentiment?.reason || 'Baseline societal impact detected.'}
            </p>
          </div>
        </div>

        {/* Main Text */}
        <div className="text-[17px] leading-[1.7] text-[#ccc] mb-16 whitespace-pre-wrap selection:bg-white selection:text-black">
          {article.content}
        </div>

        {/* Entities Sector */}
        {Object.keys(entityGroups).length > 0 && (
          <div className="pt-10 border-t border-[#1a1a1a]">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#666] mb-8">
              System Extractions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
              {Object.entries(entityGroups).map(([label, entities]) => {
                const Icon = ENTITY_ICONS[label] || Tag
                return (
                  <div key={label} className="group">
                    <div className="flex items-center gap-2 mb-3 text-[#888] group-hover:text-white transition-colors">
                      <Icon size={14} strokeWidth={1.5} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entities.map((text, i) => (
                        <span key={i} className="text-[12px] px-2.5 py-1 rounded bg-[#0a0a0a] border border-[#222] text-[#aaa] hover:text-white hover:border-[#444] transition-all cursor-default">
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
