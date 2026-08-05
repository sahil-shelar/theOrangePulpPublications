'use client'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)

  // Dummy notifications for UI completeness (in a real app, fetched from DB or real-time channel)
  const notifications = [
    { id: 1, title: 'Article Published', message: 'Indie Cinema Returns is now live.', time: '2m ago', type: 'success' },
    { id: 2, title: 'TMDb Import Complete', message: 'Inception (2010) imported successfully.', time: '1hr ago', type: 'info' },
    { id: 3, title: 'Storage Warning', message: 'Media Bucket at 85% capacity.', time: '2hrs ago', type: 'warning' },
  ]

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center border-[3px] border-foreground hover:bg-foreground hover:text-background transition-colors relative"
      >
        <Bell size={18} />
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary border-[2px] border-foreground rounded-full animate-bounce"></span>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-background border-[4px] border-foreground shadow-hard-lg z-50 flex flex-col">
          <div className="flex justify-between items-center p-3 border-b-[4px] border-foreground bg-secondary">
            <span className="font-black uppercase tracking-widest text-xs">Notifications</span>
            <span className="text-label font-bold bg-background px-2 py-1 border-[2px] border-foreground cursor-pointer hover:bg-foreground hover:text-background">Mark All Read</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <div key={n.id} className="p-3 border-b-[2px] border-foreground/10 hover:bg-muted transition-colors cursor-pointer flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="font-black uppercase tracking-widest text-xs">{n.title}</span>
                  <span className="text-label font-bold text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-xs font-medium text-foreground/80">{n.message}</p>
              </div>
            ))}
          </div>
          
          <Link href="/dashboard/system" onClick={() => setIsOpen(false)} className="p-3 text-center bg-muted text-label font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors border-t-[3px] border-foreground">
            View System Logs
          </Link>
        </div>
      )}
    </div>
  )
}
