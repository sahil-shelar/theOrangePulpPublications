export const adsConfig = {
  // Global settings
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-0000000000000000',
  isDevelopment: process.env.NODE_ENV === 'development',
  showPlaceholdersInDev: true, // Show placeholders when in dev mode
  enableAutoAds: true, // Enable AdSense auto ads (Anchor, Vignette, etc)

  // Specific Ad Slots Config
  slots: {
    'home-top-billboard': {
      enabled: true,
      slotId: '1234567890',
      width: 970,
      height: 250,
      label: '970 x 250 Billboard Space',
      responsive: true
    },
    'home-in-feed-banner': {
      enabled: true,
      slotId: '0987654321',
      width: 728,
      height: 90,
      label: '728 x 90 Leaderboard',
      responsive: true
    },
    'home-sidebar-sticky': {
      enabled: true,
      slotId: '1122334455',
      width: 300,
      height: 600,
      label: '300 x 600 Sticky',
      responsive: false
    },
    'news-sidebar-sticky': {
      enabled: true,
      slotId: '5544332211',
      width: 300,
      height: 600,
      label: '300 x 600 Sticky',
      responsive: false
    },
    'sidebar-top': {
      enabled: true,
      slotId: '6677889900',
      width: 300,
      height: 250,
      label: '300 x 250 Sidebar Top',
      responsive: true
    },
    'article-bottom-leaderboard': {
      enabled: true,
      slotId: '9988776655',
      width: 728,
      height: 90,
      label: '728 x 90 Article Bottom Leaderboard',
      responsive: true
    }
  }
};

export type AdSlotKey = keyof typeof adsConfig.slots;
