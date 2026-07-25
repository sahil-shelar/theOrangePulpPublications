import Script from 'next/script';
import { adsConfig } from '@/config/ads';

export default function AutoAds() {
  if (!adsConfig.enableAutoAds || adsConfig.isDevelopment) {
    return null;
  }

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.publisherId}`}
    />
  );
}
