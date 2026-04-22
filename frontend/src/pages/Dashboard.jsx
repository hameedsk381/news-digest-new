import { useState, useEffect, useCallback } from 'react'
import { Download, History, ArrowRight, FileText, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import UploadSection from '../components/UploadSection'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import ArticleList from '../components/ArticleList'
import { getArticles, deleteArticle, exportArticles, getRecentBatches } from '../services/api'

export default function Dashboard() {
  const [articles, setArticles] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [search, setSearch] = useState('')

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const [articlesData, batchesData] = await Promise.all([
        getArticles({ category, sentiment, search }),
        getRecentBatches(4)
      ])
      setArticles(articlesData.articles || [])
      setTotal(articlesData.total || 0)
      setBatches(Array.isArray(batchesData) ? batchesData : [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [category, sentiment, search])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleUploadComplete = () => {
    fetchArticles()
  }

  const handleDelete = async (id) => {
    if (!confirm('Purge this record from system memory?')) return
    try {
      await deleteArticle(id)
      setArticles((prev) => prev.filter((a) => a._id !== id))
      setTotal((prev) => prev - 1)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleExport = async (format) => {
    try {
      if (format === 'csv') {
        await exportArticles('csv')
      } else {
        const data = await exportArticles('json')
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'export_stream.json'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 antialiased">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-10">
          <UploadSection onUploadComplete={handleUploadComplete} />

          <div className="space-y-6">
            {/* Search + Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <SearchBar onSearch={setSearch} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-colors text-neutral-300"
                >
                  <Download size={13} strokeWidth={2.5} />
                  JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-colors text-neutral-300"
                >
                  <Download size={13} strokeWidth={2.5} />
                  CSV
                </button>
              </div>
            </div>

            <FilterBar
              selectedCategory={category}
              selectedSentiment={sentiment}
              onCategoryChange={setCategory}
              onSentimentChange={setSentiment}
            />

            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-600">
                {loading ? 'Scanning...' : `${total} entries synchronized`}
              </p>
            </div>

            <ArticleList
              articles={articles}
              loading={loading}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Technical Sidebar */}
        <div className="space-y-10">
          <div className="p-6 border border-neutral-800 rounded-lg bg-black">
            <div className="flex items-center gap-2 mb-6 text-white">
              <History size={16} strokeWidth={2} />
              <h2 className="font-bold text-[12px] uppercase tracking-[0.2em]">
                Ingestion Logs
              </h2>
            </div>
            
            {Array.isArray(batches) && batches.length > 0 ? (
              <div className="space-y-2">
                {batches?.map((batch) => (
                  <Link 
                    key={batch.batch_id} 
                    to={`/report/${batch.batch_id}`}
                    className="block p-3 rounded bg-neutral-950 border border-transparent hover:border-neutral-800 hover:bg-neutral-900 transition-all group"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-bold truncate text-neutral-300 group-hover:text-white transition-colors">
                          {batch.source_name}
                        </p>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
                      </div>
                      <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
                        {batch.count} units · {new Date(batch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-center py-6 text-neutral-600 font-medium italic">
                No recent activity.
              </p>
            )}
          </div>

          <div className="p-6 border border-neutral-900 rounded-lg bg-black space-y-4">
            <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3 flex items-center gap-2">
              <Shield size={12} className="text-white" />
              Indian Context Protocol
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-neutral-700 uppercase">Numeric Normalization</span>
                <p className="text-[12px] text-neutral-400 font-medium leading-relaxed">
                  Active mapping for Lakhs and Crores into standard integer fields for analytics.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-neutral-700 uppercase">Honorific Resolution</span>
                <p className="text-[12px] text-neutral-400 font-medium leading-relaxed">
                  Automatic stripping and canonicalization of Shri, Smt, and Ji honorifics.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-neutral-900 rounded-lg bg-neutral-950/50">
            <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Extraction Engine
            </h3>
            <p className="text-[12px] leading-relaxed text-neutral-600 font-medium">
              Layout-aware segmentation active. Digital PDF block detection prioritizing multi-column Indian newspaper flows.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
