import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [collectionName, setCollectionName] = useState('')
  const [chunkJobId, setChunkJobId] = useState('')
  const [chunkStatus, setChunkStatus] = useState('')
  const [chunkResult, setChunkResult] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState('')
  const [jobId, setJobId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const pollTimerRef = useRef(null)
  const chunkPollTimerRef = useRef(null)

  const canSend = useMemo(() => query.trim().length > 0 && !isSending, [query, isSending])
  const canUpload = useMemo(() => !!pdfFile && !isUploading, [pdfFile, isUploading])

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
      if (chunkPollTimerRef.current) {
        clearInterval(chunkPollTimerRef.current)
      }
    }
  }, [])

  async function pollChunking(nextJobId) {
    if (chunkPollTimerRef.current) clearInterval(chunkPollTimerRef.current)

    chunkPollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/chunking/status?job_id=${encodeURIComponent(nextJobId)}`)
        const statusData = await res.json()
        setChunkStatus(statusData.status ?? '')

        if (statusData.status === 'chunked' || statusData.status === 'failed') {
          clearInterval(chunkPollTimerRef.current)
          chunkPollTimerRef.current = null
          setChunkResult(JSON.stringify(statusData.result ?? statusData.error ?? null, null, 2))
        }
      } catch (e) {
        clearInterval(chunkPollTimerRef.current)
        chunkPollTimerRef.current = null
        setChunkStatus('failed')
        setChunkResult(String(e))
      }
    }, 1000)
  }

  async function uploadPdf() {
    if (!canUpload) return
    if (chunkPollTimerRef.current) {
      clearInterval(chunkPollTimerRef.current)
      chunkPollTimerRef.current = null
    }

    setIsUploading(true)
    setChunkStatus('uploading')
    setChunkResult('')
    setChunkJobId('')
    setCollectionName('')

    try {
      const fd = new FormData()
      fd.append('file', pdfFile)

      const resp = await fetch('/chunking', { method: 'POST', body: fd })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` - ${text}` : ''}`)
      }

      const data = await resp.json()
      setChunkJobId(data.job_id || '')
      setCollectionName(data.collection_name || '')
      setChunkStatus(data.status || 'queued')

      if (data.job_id) {
        await pollChunking(data.job_id)
      }
    } catch (e) {
      setChunkStatus('failed')
      setChunkResult(String(e))
    } finally {
      setIsUploading(false)
    }
  }

  async function pollJob(nextJobId) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/job_status?job_id=${encodeURIComponent(nextJobId)}`)
        const statusData = await res.json()
        setStatus(statusData.status ?? '')

        if (statusData.status === 'finished' || statusData.status === 'failed') {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setResult(JSON.stringify(statusData.result ?? statusData.error ?? null, null, 2))
        }
      } catch (e) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
        setStatus('failed')
        setResult(String(e))
      }
    }, 1000)
  }

  async function sendQuery() {
    if (!canSend) return
    if (!collectionName) {
      setStatus('failed')
      setResult('Please upload a PDF first (collection_name is required).')
      return
    }

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }

    setIsSending(true)
    setStatus('queued')
    setResult('')
    setJobId('')

    try {
      const resp = await fetch(
        `/chat?query=${encodeURIComponent(query.trim())}&collection_name=${encodeURIComponent(collectionName)}`,
        {
        method: 'POST',
        },
      )

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` - ${text}` : ''}`)
      }

      const data = await resp.json()
      const nextJobId = data.job_id
      setJobId(nextJobId)
      await pollJob(nextJobId)
    } catch (e) {
      setStatus('failed')
      setResult(String(e))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <header className="header">
          <h2 className="title">Edu Mate</h2>
          <p className="subtitle">Upload a PDF (POST `/chunking`) then ask questions (POST `/chat`).</p>
        </header>

        <div className="section">
          <h3 className="sectionTitle">Upload PDF</h3>
          <div className="row">
            <input
              className="input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
            <button className="button" onClick={uploadPdf} disabled={!canUpload}>
              {isUploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>

          <div className="status" style={{ marginTop: 10 }}>
            <span className="badge">{chunkStatus || '—'}</span>
            {chunkJobId ? <span className="jobId">chunk_job_id: {chunkJobId}</span> : null}
            {collectionName ? <span className="jobId">collection: {collectionName}</span> : null}
          </div>

          <pre className="result" style={{ marginTop: 10 }}>
            {chunkResult || '—'}
          </pre>
        </div>

        <div className="row">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter question"
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendQuery()
            }}
          />
          <button className="button" onClick={sendQuery} disabled={!canSend}>
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </div>

        <div className="section">
          <h3 className="sectionTitle">Status</h3>
          <div className="status">
            <span className="badge">{status || '—'}</span>
            {jobId ? <span className="jobId">job_id: {jobId}</span> : null}
          </div>
        </div>

        <div className="section">
          <h3 className="sectionTitle">Result</h3>
          <pre className="result">{result || '—'}</pre>
        </div>
      </div>
    </div>
  )
}

export default App
