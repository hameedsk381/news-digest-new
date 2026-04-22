import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import ArticleDetail from './pages/ArticleDetail'
import BatchReport from './pages/BatchReport'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/report/:batchId" element={<BatchReport />} />
        </Routes>
      </main>
      <footer className="text-center py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        News Intelligence System · AI-Powered Newspaper Analysis
      </footer>
    </div>
  )
}
