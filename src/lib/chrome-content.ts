// Site chrome content: the shape of it, and what it falls back to.
//
// Deliberately free of `next/cache` and of any database import. Navbar and
// Footer are CLIENT components that need these defaults, and importing them
// from the module that calls unstable_cache would drag server-only cache
// machinery into the browser bundle. It also makes the constants testable —
// importing the cached module under jsdom fails inside Next's internals before
// a single assertion runs.
//
// The fallbacks are load-bearing, not padding. PostgREST does not throw when a
// table is missing: selecting from one returns `data: null` with the error in a
// field nobody reads (verified against the live project). So a build shipped
// before its migration would render a header with no links and log nothing.
// Falling back means the worst case is the site behaving as it did before.
//
// An EMPTY result is likewise treated as "not configured" rather than
// "configured to be empty" — nobody wants a navless header, and a menu can be
// emptied properly by unticking is_visible on each row.

export type NavLocation = 'header' | 'footer_explore' | 'footer_company'

export type NavLink = {
  label: string
  href: string
}

/** What Navbar.tsx and Footer.tsx used to declare inline. Still the source of
 *  truth when the database has nothing to say. */
export const NAV_FALLBACK: Record<NavLocation, NavLink[]> = {
  header: [
    { href: '/reviews', label: 'Reviews' },
    { href: '/news', label: 'News' },
    { href: '/spotlight', label: 'Spotlight' },
    { href: '/lists', label: 'Rankings' },
  ],
  footer_explore: [
    { href: '/reviews', label: 'Reviews' },
    { href: '/news', label: 'News' },
    { href: '/spotlight', label: 'Spotlight' },
    { href: '/lists', label: 'Rankings' },
  ],
  footer_company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms' },
  ],
}

export type HomeSection = {
  section_key: string
  kind: 'header' | 'promo'
  heading: string
  description: string | null
  href: string | null
  icon: string | null
  accent: string | null
}

/** The headings and promo cards page.tsx used to inline. */
export const HOME_SECTIONS_FALLBACK: HomeSection[] = [
  { section_key: 'most_talked', kind: 'header', heading: 'Most Talked This Week', description: null, href: null, icon: null, accent: null },
  { section_key: 'latest', kind: 'header', heading: 'The Latest', description: null, href: null, icon: null, accent: null },
  { section_key: 'trending', kind: 'header', heading: 'Trending', description: null, href: null, icon: null, accent: null },
  { section_key: 'on_our_radar', kind: 'header', heading: 'On Our Radar', description: null, href: '/reviews', icon: null, accent: null },
  { section_key: 'editors_picks', kind: 'header', heading: "Editor's Picks", description: null, href: null, icon: null, accent: null },
  { section_key: 'promo_reviews', kind: 'promo', heading: 'Reviews', description: 'Critical Takes', href: '/reviews', icon: 'Star', accent: 'bg-primary' },
  { section_key: 'promo_news', kind: 'promo', heading: 'News', description: 'Latest Stories', href: '/news', icon: 'Newspaper', accent: 'bg-secondary' },
  { section_key: 'promo_spotlight', kind: 'promo', heading: 'Spotlight', description: 'Deep Dives', href: '/spotlight', icon: 'Sparkles', accent: 'bg-accent' },
  { section_key: 'promo_lists', kind: 'promo', heading: 'Rankings', description: 'Best Of Lists', href: '/lists', icon: 'Trophy', accent: 'bg-muted' },
]

/**
 * Look one section up by key, falling back to the hardcoded value for that key
 * alone.
 *
 * Keyed rather than positional on purpose: the page renders these in a fixed
 * layout, so a missing row must leave that heading intact rather than shifting
 * "Editor's Picks" onto the trending block.
 */
export function sectionByKey(sections: HomeSection[], key: string): HomeSection | null {
  return (
    sections.find(s => s.section_key === key) ??
    HOME_SECTIONS_FALLBACK.find(s => s.section_key === key) ??
    null
  )
}
