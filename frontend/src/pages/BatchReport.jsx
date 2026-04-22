import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, ArrowLeft, Clock } from 'lucide-react'
import ArticleCard from '../components/ArticleCard'
import { getBatchReport } from '../services/api'

function MiniStat({ label, value }) {
  return (
    <div className="p-4 border border-neutral-800 rounded-lg bg-black">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 mb-2">
        {label}
      </p>
      <p className="text-xl font-bold text-white tracking-tight leading-none">
        {value}
      </p>
    </div>
  )
}

export default function BatchReport() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let interval;
    
    async function fetch() {
      try {
        const data = await getBatchReport(batchId)
        setReport(data)
        
        // If still processing, poll every 3 seconds
        if (data.status === 'processing') {
          if (!interval) {
            interval = setInterval(fetch, 3000);
          }
        } else if (interval) {
          clearInterval(interval);
        }
        
      } catch (err) {
        console.error('Failed to fetch batch report:', err)
      } finally {
        setLoading(false)
      }
    }

    fetch()
    
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [batchId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 antialiased">
        <div className="h-8 w-64 bg-neutral-900 border border-neutral-800 rounded animate-pulse mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-20 text-center border border-neutral-800 rounded-lg bg-black">
          <p className="text-neutral-600 font-medium tracking-tight">Report stream not found.</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-6 px-6 py-2 bg-white text-black rounded-md text-[12px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
          >
            Terminal Dashboard
          </button>
        </div>
      </div>
    )
  }

  const dateStr = report.created_at 
    ? new Date(report.created_at).toLocaleString() 
    : 'Unknown'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 antialiased animate-in">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-neutral-900 pb-10">
        <div className="flex-1">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all mb-8 flex items-center gap-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <h1 className="text-[32px] font-bold tracking-tight text-white leading-none">
              Ingestion Report
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-neutral-600">
            <span className="flex items-center gap-2 text-neutral-400">
              <FileText size={14} strokeWidth={1.5} />
              {report.source_name}
            </span>
            <div className="w-1 h-1 rounded-full bg-neutral-900" />
            <span className="flex items-center gap-2">
              <Clock size={14} strokeWidth={1.5} />
              {dateStr}
            </span>
            <div className="w-1 h-1 rounded-full bg-neutral-900" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              ID: {batchId.slice(0, 8)}
            </span>
          </div>

          {report.status === 'processing' && (
            <div className="mt-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Processing Queue
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {report.processed_count} / {report.total_count} articles
                </span>
              </div>
              <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-700 ease-out" 
                  style={{ width: `${(report.processed_count / report.total_count) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rapid Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 min-w-[320px]">
          <MiniStat 
            label="Units" 
            value={report.articles.length} 
          />
          <MiniStat 
            label="Pos %" 
            value={report.sentiment_summary.Positive || 0} 
          />
          <MiniStat 
            label="Classes" 
            value={Object.keys(report.category_summary).length} 
          />
        </div>
      </div>

      {/* Synchronized Unit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {report.articles.map((article) => (
          <ArticleCard
            key={article._id}
            article={article}
          />
        ))}
      </div>
    </div>
  )
}
