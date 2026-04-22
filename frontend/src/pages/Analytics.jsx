import { useState, useEffect } from 'react'
import { TrendingUp, FileText, BarChart3, Activity, Shield } from 'lucide-react'
import SentimentPieChart from '../charts/SentimentPieChart'
import CategoryBarChart from '../charts/CategoryBarChart'
import ImpactPieChart from '../charts/ImpactPieChart'
import { getAnalytics } from '../services/api'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="p-6 border border-neutral-800 rounded-lg bg-black animate-in">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-widest text-neutral-500">
            {label}
          </p>
          <Icon size={14} className="text-neutral-700" />
        </div>
        <p className="text-[28px] font-bold tracking-tight text-white leading-none">
          {value}
        </p>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 antialiased">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
          <div className="h-80 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
          <div className="h-80 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-20 text-center border border-neutral-800 rounded-lg bg-black">
          <p className="text-neutral-600 font-medium tracking-tight">
            Insufficient telemetric data. Synchronize system entries.
          </p>
        </div>
      </div>
    )
  }

  const topCategory = analytics.category_distribution
    ? Object.entries(analytics.category_distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    : 'N/A'

  const totalImpacts = analytics.impact_distribution
    ? Object.values(analytics.impact_distribution).reduce((a, b) => a + b, 0)
    : 0
  const beneficialRatio = analytics.impact_distribution?.Beneficial
    ? ((analytics.impact_distribution.Beneficial / totalImpacts) * 100).toFixed(0)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 antialiased">
      {/* Header */}
      <div className="mb-10 animate-in">
        <h1 className="text-[32px] font-bold tracking-tight text-white mb-2 leading-none">Telemetry</h1>
        <p className="text-[14px] text-neutral-500 font-medium">
          Structural insights across the automated extraction pipeline.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={FileText}
          label="Entities"
          value={analytics.total_articles}
        />
        <StatCard
          icon={Activity}
          label="Model Confidence"
          value={(analytics.avg_sentiment_score * 100).toFixed(0) + '%'}
        />
        <StatCard
          icon={Shield}
          label="Social Benefit"
          value={beneficialRatio + '%'}
        />
        <StatCard
          icon={BarChart3}
          label="Peak Class"
          value={topCategory}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="p-8 border border-neutral-800 rounded-lg bg-neutral-900/50">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-10">Sentiment Model</h3>
          <SentimentPieChart data={analytics.sentiment_distribution} />
        </div>
        <div className="p-8 border border-neutral-800 rounded-lg bg-neutral-900/50">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-10">Impact Vector</h3>
          <ImpactPieChart data={analytics.impact_distribution} />
        </div>
        <div className="p-8 border border-neutral-800 rounded-lg bg-neutral-900/50">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-10">Class Weighting</h3>
          <CategoryBarChart data={analytics.category_distribution} />
        </div>
      </div>

      {/* Indian Context Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 border border-neutral-800 rounded-lg bg-black">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-8 flex items-center gap-2">
            <TrendingUp size={12} />
            Regional Honorifics
          </h3>
          <div className="space-y-6">
            {Object.entries(analytics.indian_context?.top_honorifics || {}).map(([name, count]) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono uppercase">
                  <span className="text-white">{name}</span>
                  <span className="text-neutral-600">{count} Mentions</span>
                </div>
                <div className="h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white opacity-40" 
                    style={{ width: `${(count / analytics.total_articles) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border border-neutral-800 rounded-lg bg-black">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-8 flex items-center gap-2">
            <Activity size={12} />
            Administrative Density
          </h3>
          <div className="space-y-6">
            {Object.entries(analytics.indian_context?.admin_level_distribution || {}).map(([level, count]) => (
              <div key={level} className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono uppercase">
                  <span className="text-white">{level}</span>
                  <span className="text-neutral-600">{count} Records</span>
                </div>
                <div className="h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white" 
                    style={{ width: `${(count / analytics.total_articles) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
