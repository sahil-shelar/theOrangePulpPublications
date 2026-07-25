'use client'

import { useState } from 'react'
import { Sparkles, Wand2, Type, Tag as TagIcon, Link as LinkIcon, RefreshCcw, Check, X } from 'lucide-react'

type AIPanelProps = {
  content: string
  onApplyContent: (content: string) => void
  onApplySeo: (title: string, desc: string) => void
}

export default function AIAssistantPanel({ content, onApplyContent, onApplySeo }: AIPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [suggestionType, setSuggestionType] = useState<string>('')

  // Mock AI request
  const handleAIRequest = (type: string, actionLabel: string) => {
    setIsProcessing(true)
    setSuggestionType(type)
    
    // Simulate AI generation delay
    setTimeout(() => {
      if (type === 'seo') {
        setSuggestion(JSON.stringify({ 
          title: "10 Reasons Why This Movie Will Blow Your Mind (2026 Review)", 
          desc: "Our exclusive early review of the most anticipated film of 2026. Discover why critics are calling it a masterpiece in this comprehensive spoiler-free breakdown."
        }))
      } else {
        setSuggestion(`[AI ${actionLabel} Suggestion]: Based on the latest trends and readability metrics, here is an optimized version of your content that flows better and hits target keywords...`)
      }
      setIsProcessing(false)
    }, 1500)
  }

  const applySuggestion = () => {
    if (suggestionType === 'seo' && suggestion) {
      const data = JSON.parse(suggestion)
      onApplySeo(data.title, data.desc)
    } else if (suggestion) {
      // For content, we just append for safety instead of overwriting, letting editor decide.
      onApplyContent(content + '\n\n' + suggestion)
    }
    setSuggestion(null)
  }

  return (
    <div className="brutal-card bg-primary p-0 border-[4px] border-foreground overflow-hidden">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-foreground text-primary p-4 flex justify-between items-center hover:bg-black transition-colors"
      >
        <span className="font-heading text-xl font-black uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={20} /> AI Editorial Assistant
        </span>
      </button>

      {isOpen && (
        <div className="p-4 flex flex-col gap-4 bg-background">
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onClick={() => handleAIRequest('rewrite', 'Rewrite')}
              className="p-2 border-[2px] border-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex flex-col items-center gap-1"
            >
              <RefreshCcw size={16} /> Rewrite / Improve
            </button>
            <button 
              type="button" 
              onClick={() => handleAIRequest('grammar', 'Grammar')}
              className="p-2 border-[2px] border-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex flex-col items-center gap-1"
            >
              <Type size={16} /> Fix Grammar
            </button>
            <button 
              type="button" 
              onClick={() => handleAIRequest('seo', 'SEO')}
              className="p-2 border-[2px] border-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex flex-col items-center gap-1"
            >
              <Wand2 size={16} /> Generate SEO
            </button>
            <button 
              type="button" 
              onClick={() => handleAIRequest('links', 'Internal Links')}
              className="p-2 border-[2px] border-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex flex-col items-center gap-1"
            >
              <LinkIcon size={16} /> Suggest Links
            </button>
          </div>

          {isProcessing && (
            <div className="p-4 border-[2px] border-foreground border-dashed text-center font-bold uppercase tracking-widest text-xs animate-pulse">
              AI is analyzing content...
            </div>
          )}

          {suggestion && !isProcessing && (
            <div className="mt-4 border-[3px] border-foreground bg-muted p-4">
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-[2px] border-foreground pb-1">
                AI Suggestion
              </div>
              {suggestionType === 'seo' ? (
                <div className="text-sm font-medium flex flex-col gap-2">
                  <div><strong>Title:</strong> {JSON.parse(suggestion).title}</div>
                  <div><strong>Desc:</strong> {JSON.parse(suggestion).desc}</div>
                </div>
              ) : (
                <div className="text-sm font-medium">
                  {suggestion}
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={applySuggestion} className="flex-1 bg-primary border-[2px] border-foreground font-black uppercase text-[10px] py-2 flex justify-center items-center gap-1 hover:-translate-y-1 transition-transform">
                  <Check size={14} /> Apply
                </button>
                <button type="button" onClick={() => setSuggestion(null)} className="flex-1 bg-background border-[2px] border-foreground font-black uppercase text-[10px] py-2 flex justify-center items-center gap-1 hover:bg-red-500 hover:text-white transition-colors">
                  <X size={14} /> Discard
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
