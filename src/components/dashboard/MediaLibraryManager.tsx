'use client'

import { useState } from 'react'
import { registerMediaRecord, deleteMediaAction } from '@/lib/actions/media'
import { STORAGE_BUCKETS } from '@/lib/api/storage'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Copy, Grid, List, Search, UploadCloud, X } from 'lucide-react'

// mime_type and size_bytes are nullable in the media table — uploads
// registered before those columns were populated have neither.
type MediaFile = {
  id: string
  file_name: string
  file_url: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

export default function MediaLibraryManager({ initialFiles }: { initialFiles: MediaFile[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [files, setFiles] = useState<MediaFile[]>(initialFiles)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null)

  const filteredFiles = files.filter(f => f.file_name.toLowerCase().includes(search.toLowerCase()))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    setIsUploading(true)
    setUploadProgress({ current: 0, total: selected.length })

    let newFiles = [...files]

    const supabase = createClient()
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')
      const uniqueId = Math.random().toString(36).substring(2, 9)
      const fileName = `${Date.now()}_${uniqueId}_${safeName}`

      const { error, data } = await supabase.storage.from(STORAGE_BUCKETS.ASSETS).upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKETS.ASSETS).getPublicUrl(fileName)
        registerMediaRecord(fileName, publicUrl, file.type, file.size).catch(() => {})
      }
      setUploadProgress({ current: i + 1, total: selected.length })
    }

    setIsUploading(false)
    setUploadProgress(null)
    window.location.reload() // Quickest way to sync state from DB since it's force-dynamic
  }

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm('Are you sure you want to delete this file? This might break live articles.')) return
    
    // Optimistic delete
    setFiles(files.filter(f => f.id !== id))
    
    // Note: since bucket is generic, it might be in ASSETS or ARTICLES.
    // In production we would track the bucket in the DB, for now we will assume ASSETS or attempt deletion across buckets.
    // Let's rely on the DB cascade or ignore storage deletion errors if bucket mismatched.
    await deleteMediaAction(id, fileName, STORAGE_BUCKETS.ASSETS)
    await deleteMediaAction(id, fileName, STORAGE_BUCKETS.ARTICLES) // fallback
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('Copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-primary p-4 border-[3px] border-foreground brutal-card">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border-[3px] border-foreground pl-10 pr-4 py-2 text-sm font-bold"
            />
          </div>
          <div className="flex border-[3px] border-foreground bg-background">
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>
              <Grid size={16} />
            </button>
            <button onClick={() => setView('list')} className={`p-2 border-l-[3px] border-foreground ${view === 'list' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>
              <List size={16} />
            </button>
          </div>
        </div>
        
        <div className="relative w-full md:w-auto">
          <input 
            type="file" 
            multiple 
            accept="image/jpeg,image/png,image/webp,image/avif" 
            onChange={handleUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <button className="w-full brutal-button py-2 px-6 flex items-center justify-center gap-2 text-sm">
            <UploadCloud size={16} />
            {isUploading ? `Uploading ${uploadProgress?.current}/${uploadProgress?.total}` : 'Upload Media'}
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <div key={file.id} className="group relative brutal-card p-0 bg-background overflow-hidden aspect-square flex flex-col">
              <div className="flex-1 bg-muted relative overflow-hidden border-b-[3px] border-foreground">
                <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button onClick={() => handleCopy(file.file_url)} className="bg-primary text-primary-foreground font-black text-label uppercase tracking-widest px-3 py-2 border-[3px] border-foreground hover:-translate-y-1 transition-transform flex items-center gap-2">
                    <Copy size={14} /> Copy URL
                  </button>
                  <button onClick={() => handleDelete(file.id, file.file_name)} className="bg-red-500 text-white font-black text-label uppercase tracking-widest px-3 py-2 border-[3px] border-foreground hover:-translate-y-1 transition-transform flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              <div className="p-2 text-label font-black uppercase tracking-widest truncate">
                {file.file_name.split('_').pop()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-background border-[3px] border-foreground brutal-card p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground text-background font-black text-xs uppercase tracking-widest border-b-[3px] border-foreground">
                <th className="p-4">Preview</th>
                <th className="p-4">Filename</th>
                <th className="p-4 hidden md:table-cell">Type</th>
                <th className="p-4 hidden md:table-cell">Size</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} className="border-b-[3px] border-foreground hover:bg-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="w-16 h-16 border-[3px] border-foreground bg-muted">
                      <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-sm truncate max-w-[200px]">
                    {file.file_name.split('_').pop()}
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {file.mime_type ?? '—'}
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {file.size_bytes != null ? `${(file.size_bytes / 1024 / 1024).toFixed(2)} MB` : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCopy(file.file_url)} className="p-2 bg-primary border-[3px] border-foreground hover:-translate-y-1 transition-transform" title="Copy URL">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => handleDelete(file.id, file.file_name)} className="p-2 bg-red-500 text-white border-[3px] border-foreground hover:-translate-y-1 transition-transform" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredFiles.length === 0 && (
        <div className="brutal-card p-16 text-center font-black uppercase tracking-widest text-muted-foreground">
          No media files found.
        </div>
      )}
    </div>
  )
}
