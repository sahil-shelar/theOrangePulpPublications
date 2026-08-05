'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
  id: string
  label?: string
  onDelete: (id: string) => Promise<void>
  className?: string
  iconOnly?: boolean
}

export default function DeleteButton({ id, label = 'Delete', onDelete, className = '', iconOnly = false }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setLoading(true)
    try {
      await onDelete(id)
    } catch (e: any) {
      alert(e.message || 'Delete failed')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title={confirming ? 'Click again to confirm' : label}
        className={`p-2 border-[2px] border-foreground transition-colors disabled:opacity-50 ${confirming ? 'bg-red-500 text-white' : 'bg-background text-red-600 hover:bg-red-500 hover:text-white'} ${className}`}
      >
        <Trash2 size={16} />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 brutal-button py-2 px-0 text-label disabled:opacity-50 ${confirming ? 'bg-red-600 text-white' : 'bg-red-500 text-white'} ${className}`}
    >
      <Trash2 size={12} />
      {loading ? 'Deleting...' : confirming ? 'Confirm?' : label}
    </button>
  )
}
