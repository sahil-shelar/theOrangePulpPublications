'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { registerMediaRecord } from '@/lib/actions/media'
import { STORAGE_BUCKETS } from '@/lib/api/storage'
import { Upload, Link as LinkIcon, X, RefreshCw, ImageIcon } from 'lucide-react'

type Props = {
  value: string
  onChange: (url: string) => void
  label?: string
  bucket?: string
}

type Tab = 'upload' | 'url'

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']

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

    if (!ALLOWED.includes(file.type)) {
      setError('Unsupported format. Use JPG, PNG, WebP or AVIF.')
      setUploading(false)
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds 50 MB limit.')
      setUploading(false)
      return
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')
    const uniqueId = Math.random().toString(36).substring(2, 9)
    const fileName = `${Date.now()}_${uniqueId}_${safeName}`

    const tick = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 500)

    try {
      // Upload directly browser → Supabase Storage (no Vercel body limit)
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      clearInterval(tick)

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setProgress(100)
      onChange(publicUrl)

      // Register in media library (tiny metadata call, no file payload)
      registerMediaRecord(fileName, publicUrl, file.type, file.size).catch(() => {})

      setTimeout(() => setProgress(0), 600)
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
        <span className="text-label font-black uppercase tracking-widest text-foreground">{label}</span>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-label font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1">
            <X size={14} /> Remove
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-label font-black uppercase tracking-widest border-l-[3px] border-red-500 pl-2">{error}</div>
      )}

      {value && (
        <div className="relative border-[3px] border-foreground overflow-hidden bg-muted aspect-video">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute top-2 right-2 bg-background border-[2px] border-foreground p-1.5 hover:bg-muted transition-colors"
            title="Change image"
          >
            <RefreshCw size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {uploading && (
        <div className="w-full h-[3px] bg-muted border-[1px] border-foreground/20">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex border-[3px] border-foreground">
        {(['upload', 'url'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-label font-black uppercase tracking-widest transition-colors ${
              tab === t ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted'
            } ${t === 'url' ? 'border-l-[3px] border-foreground' : ''}`}
          >
            {t === 'upload' ? <Upload size={14} /> : <LinkIcon size={14} />}
            {t === 'upload' ? 'Upload' : 'URL'}
          </button>
        ))}
      </div>

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
          <ImageIcon size={24} className="text-muted-foreground" strokeWidth={2.5} />
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/70">
              {uploading ? 'Uploading…' : dragging ? 'Drop to upload' : 'Drag & drop or click'}
            </p>
            <p className="text-label font-bold text-muted-foreground mt-0.5">JPG · PNG · WebP · AVIF · max 50 MB</p>
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

      {tab === 'url' && (
        <div className="flex gap-0">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
            placeholder="https://example.com/image.jpg"
            className="flex-1 bg-background border-[3px] border-foreground border-r-0 px-3 py-2.5 text-xs font-bold text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="bg-foreground text-background border-[3px] border-foreground px-4 text-label font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-colors shrink-0"
          >
            Set
          </button>
        </div>
      )}
    </div>
  )
}
