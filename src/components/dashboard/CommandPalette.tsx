'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Film, Image as ImageIcon, Settings, X, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { label: 'Create Article', icon: <FileText size={16}/>, route: '/dashboard/articles/new' },
    { label: 'Create Review', icon: <FileText size={16}/>, route: '/dashboard/articles/new?type=review' },
    { label: 'Add Movie', icon: <Film size={16}/>, route: '/dashboard/movies' },
    { label: 'Upload Media', icon: <ImageIcon size={16}/>, route: '/dashboard/media' },
    { label: 'System Settings', icon: <Settings size={16}/>, route: '/dashboard/settings' },
  ];

  const filteredActions = actions.filter(action => action.label.toLowerCase().includes(query.toLowerCase()));

  const navigateTo = (route: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-foreground/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-background border-[4px] border-foreground shadow-[8px_8px_0_0_#173D2A] flex flex-col">
        <div className="flex items-center border-b-[4px] border-foreground p-4">
          <Search className="text-muted-foreground mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands or jump to..."
            className="flex-1 bg-transparent border-none outline-none font-bold text-lg uppercase tracking-widest placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-foreground hover:text-background transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          {filteredActions.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</div>
              {filteredActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigateTo(action.route)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-primary border-[3px] border-transparent hover:border-foreground transition-colors font-bold uppercase tracking-widest text-sm text-left"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center font-bold uppercase tracking-widest text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
        <div className="border-t-[4px] border-foreground bg-muted p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between">
          <span>Use arrows to navigate</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
