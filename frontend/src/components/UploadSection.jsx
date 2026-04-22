import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { Upload, Link, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { uploadFile, uploadUrl } from '../services/api'

export default function UploadSection({ onUploadComplete }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('file') // 'file' or 'url'
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', message }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setProgress(0)
    setStatus(null)

    try {
      const result = await uploadFile(file, (p) => setProgress(p))
      setStatus({
        type: 'success',
        message: `Upload successful. Processing ${result.total_articles} articles in background.`,
      })
      
      setTimeout(() => {
        if (result.batch_id) {
          navigate(`/report/${result.batch_id}`)
        }
        if (onUploadComplete) onUploadComplete(result)
      }, 1500)
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.detail || 'Handshake failed. System rejection.',
      })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploadComplete, navigate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const handleUrlSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setUploading(true)
    setStatus(null)

    try {
      const result = await uploadUrl(url.trim())
      setStatus({
        type: 'success',
        message: `Stream initiated. Processing ${result.total_articles} articles in background.`,
      })
      setUrl('')
      
      setTimeout(() => {
        if (result.batch_id) {
          navigate(`/report/${result.batch_id}`)
        }
        if (onUploadComplete) onUploadComplete(result)
      }, 1500)
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.detail || 'Remote origin unreachable.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-8 border border-neutral-800 rounded-lg bg-black animate-in" id="upload-section">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-[20px] font-bold tracking-tight text-white leading-none">
          Data Ingestion
        </h2>
        <p className="text-[13px] text-neutral-500 font-medium">
          Deploy model extraction on newspaper binaries or web streams.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setMode('file')}
          className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center transition-all ${
            mode === 'file' ? 'bg-white text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800'
          }`}
        >
          <FileText size={13} className="mr-1.5" />
          Binary File
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center transition-all ${
            mode === 'url' ? 'bg-white text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800'
          }`}
        >
          <Link size={13} className="mr-1.5" />
          URL Stream
        </button>
      </div>

      {/* File Upload Dropzone */}
      {mode === 'file' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-neutral-800 bg-neutral-950/50 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-neutral-600 transition-colors ${
            uploading ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <input {...getInputProps()} id="file-input" />
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={32} className="animate-spin text-white" />
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-mono uppercase tracking-[0.2em] text-neutral-500">
                  {progress > 0 ? `Infiltrating: ${progress}%` : 'Mapping Blocks...'}
                </p>
                {progress > 0 && (
                  <div className="w-40 h-0.5 bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Upload size={20} className="text-neutral-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-bold text-white leading-none">
                  {isDragActive ? 'Release binary' : 'Upload newspaper binary'}
                </p>
                <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
                  PDF / PNG / JPG / TIFF
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL Input */}
      {mode === 'url' && (
        <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Origin URL source"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            disabled={uploading}
            id="url-input"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-white text-black rounded-md text-[12px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading || !url.trim()}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Initiate Stream'
            )}
          </button>
        </form>
      )}

      {/* Status Message */}
      {status && (
        <div
          className={`mt-6 p-4 rounded-md border text-[12px] font-bold uppercase tracking-wider flex items-center gap-3 animate-in ${
            status.type === 'success' ? 'border-neutral-700 text-white bg-neutral-900/50' : 'border-red-900/50 text-red-500 bg-red-950/20'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {status.message}
        </div>
      )}
    </div>
  )
}
