'use client';

import { useEffect, useRef } from 'react';
import { adsConfig, AdSlotKey } from '@/config/ads';

interface AdSlotProps {
  slotKey: AdSlotKey;
  className?: string;
}

export default function AdSlot({ slotKey, className = '' }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const config = adsConfig.slots[slotKey];

  // Initialize Adsense in production when visible
  useEffect(() => {
    if (!config || !config.enabled) return;
    if (adsConfig.isDevelopment) return; // Don't init real adsense in dev mode

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error', e);
    }
  }, [config, slotKey]);

  // If slot doesn't exist, disabled, or no real AdSense publisher ID, collapse
  const hasRealPublisherId = adsConfig.publisherId && !adsConfig.publisherId.includes('ca-pub-0000000000');
  if (!config || !config.enabled || !hasRealPublisherId) {
    return null;
  }

  // Development Placeholder
  if (adsConfig.isDevelopment && adsConfig.showPlaceholdersInDev) {
    return (
      <div 
        className={`w-full brutal-card bg-muted flex flex-col items-center justify-center text-foreground font-heading relative overflow-hidden ${className}`}
        style={{ 
          maxWidth: config.responsive ? '100%' : `${config.width}px`, 
          height: `${config.height}px`,
          margin: '0 auto' 
        }}
      >
        <div className="absolute inset-0 bg-foreground/5 pattern-boxes pointer-events-none"></div>
        <span className="font-black uppercase tracking-widest text-lg opacity-90 z-10 text-center">Advertisement</span>
        <span className="text-xs mt-2 font-bold opacity-75 uppercase z-10">{config.label}</span>
      </div>
    );
  }

  // Production AdSense Block
  return (
    <div className={`w-full flex justify-center ${className} overflow-hidden`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: config.responsive ? '100%' : `${config.width}px`,
          height: `${config.height}px`
        }}
        data-ad-client={adsConfig.publisherId}
        data-ad-slot={config.slotId}
        {...(config.responsive ? { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
