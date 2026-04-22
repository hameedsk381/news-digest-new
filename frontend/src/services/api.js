import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min timeout for large file processing
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Upload a file (PDF or image) for processing.
 */
export async function uploadFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return response.data
}

/**
 * Upload a URL for processing.
 */
export async function uploadUrl(url) {
  const formData = new FormData()
  formData.append('url', url)

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Get articles with optional filters.
 */
export async function getArticles({ category, sentiment, search, skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (sentiment) params.append('sentiment', sentiment)
  if (search) params.append('search', search)
  params.append('skip', skip)
  params.append('limit', limit)

  const response = await api.get(`/articles?${params.toString()}`)
  return response.data
}

/**
 * Get a single article by ID.
 */
export async function getArticle(id) {
  const response = await api.get(`/articles/${id}`)
  return response.data
}

/**
 * Delete an article by ID.
 */
export async function deleteArticle(id) {
  const response = await api.delete(`/articles/${id}`)
  return response.data
}

/**
 * Get analytics data.
 */
export async function getAnalytics() {
  const response = await api.get('/analytics')
  return response.data
}

/**
 * Export articles as JSON or CSV.
 */
export async function exportArticles(format = 'json') {
  if (format === 'csv') {
    const response = await api.get(`/export?format=csv`, { responseType: 'blob' })
    // Trigger download
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'articles_export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    return
  }

  const response = await api.get('/export?format=json')
  return response.data
}

/**
 * Get recent upload batches.
 */
export async function getRecentBatches(limit = 5) {
  const response = await api.get(`/recent-batches?limit=${limit}`)
  return response.data
}

/**
 * Get batch report by ID.
 */
export async function getBatchReport(batchId) {
  const response = await api.get(`/batches/${batchId}`)
  return response.data
}

export default api
