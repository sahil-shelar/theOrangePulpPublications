'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadMediaAction } from '@/lib/actions/media'
import { STORAGE_BUCKETS } from '@/lib/api/storage'
import { Upload, Link as LinkIcon, X, RefreshCw, ImageIcon } from 'lucide-react'

type Props = {
  value: string
  onChange: (url: string) => void
  label?: string
  bucket?: string
}

type Tab = 'upload' | 'url'

export default function ImagePicker({ value, onChange, label = 'Cover Image', bucket = STORAGE_BUCKETS.ARTICLES }: Props) {
  const [tab, setTab] = useState<Tab>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    setError('')
    setUploading(true)
    setProgress(10)

    // Validate
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
    if (!ALLOWED.includes(file.type)) {
      setError('Unsupported format. Use JPG, PNG, WebP or AVIF.')
      setUploading(false)
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File exceeds 25 MB limit.')
      setUploading(false)
      return
    }

    // Fake progress ticks while awaiting server action
    const tick = setInterval(() => setProgress(p => Math.min(p + 12, 85)), 400)

    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await uploadMediaAction(fd, bucket)
      clearInterval(tick)
      if (res.error) {
        setError(res.error)
      } else if (res.url) {
        setProgress(100)
        onChange(res.url)
        setTimeout(() => setProgress(0), 600)
      }
    } catch (e: any) {
      clearInterval(tick)
      setError(e.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }, [bucket, onChange])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (!/^https?:\/\/.+\..+/.test(trimmed)) {
      setError('Enter a valid http(s) URL.')
      return
    }
    setError('')
    onChange(trimmed)
    setUrlInput('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</span>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-red-500 transition-colors flex items-center gap-1">
            <X size={11} /> Remove
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-[10px] font-black uppercase tracking-widest border-l-[3px] border-red-500 pl-2">{error}</div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative border-[3px] border-foreground overflow-hidden bg-muted aspect-video">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute top-2 right-2 bg-background border-[2px] border-foreground p-1.5 hover:bg-muted transition-colors"
            title="Change image"
          >
            <RefreshCw size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div className="w-full h-[3px] bg-muted border-[1px] border-foreground/20">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-[3px] border-foreground">
        {(['upload', 'url'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              tab === t ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted'
            } ${t === 'url' ? 'border-l-[3px] border-foreground' : ''}`}
          >
            {t === 'upload' ? <Upload size={12} /> : <LinkIcon size={12} />}
            {t === 'upload' ? 'Upload' : 'URL'}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-[3px] border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 p-8 ${
            dragging ? 'border-primary bg-primary/10' : 'border-foreground/40 hover:border-foreground hover:bg-muted/40'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <ImageIcon size={28} className="text-foreground/30" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/70">
              {uploading ? 'Uploading…' : dragging ? 'Drop to upload' : 'Drag & drop or click'}
            </p>
            <p className="text-[10px] font-bold text-foreground/40 mt-0.5">JPG · PNG · WebP · AVIF · max 25 MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="flex gap-0">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
            placeholder="https://example.com/image.jpg"
            className="flex-1 bg-background border-[3px] border-foreground border-r-0 px-3 py-2.5 text-xs font-bold text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="bg-foreground text-background border-[3px] border-foreground px-4 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-colors shrink-0"
          >
            Set
          </button>
        </div>
      )}
    </div>
  )
}
