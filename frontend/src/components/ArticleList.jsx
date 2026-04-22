import ArticleCard from './ArticleCard'
import { Inbox } from 'lucide-react'

function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between mb-3">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-4 w-full mb-1" />
      <div className="skeleton h-4 w-5/6 mb-1" />
      <div className="skeleton h-4 w-2/3 mb-4" />
      <div className="flex gap-1.5 mb-3">
        <div className="skeleton h-5 w-16 rounded-md" />
        <div className="skeleton h-5 w-20 rounded-md" />
      </div>
      <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="skeleton h-3 w-24" />
      </div>
    </div>
  )
}

export default function ArticleList({ articles, loading, onDelete }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="glass-card p-16 text-center fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <Inbox size={32} style={{ color: 'var(--color-accent-blue)' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          No articles yet
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Upload a newspaper PDF, image, or paste a URL to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
      {Array.isArray(articles) && articles.map((article) => (
        <ArticleCard
          key={article._id}
          article={article}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
