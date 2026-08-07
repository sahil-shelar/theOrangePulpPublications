// Cached readers for site chrome. The shapes, defaults and lookup helper live in
// @/lib/chrome-content, which stays free of server-only imports.

import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import {
  NAV_FALLBACK,
  HOME_SECTIONS_FALLBACK,
  type HomeSection,
  type NavLink,
  type NavLocation,
} from '@/lib/chrome-content'

export * from '@/lib/chrome-content'

/**
 * All navigation in one query, grouped by location.
 *
 * One round trip rather than three: the header and both footer columns render on
 * every single page, so this is the hottest read in the app after the article
 * listings. Cached for five minutes — navigation changes about as often as the
 * site is redesigned.
 */
export const getNavLinks = unstable_cache(
  async (): Promise<Record<NavLocation, NavLink[]>> => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('nav_links')
      .select('location, label, href, sort_order')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    if (!data || data.length === 0) return NAV_FALLBACK

    const grouped: Record<NavLocation, NavLink[]> = {
      header: [],
      footer_explore: [],
      footer_company: [],
    }
    for (const row of data) {
      const location = row.location as NavLocation
      if (grouped[location]) grouped[location].push({ label: row.label, href: row.href })
    }

    // Per-location fallback, not all-or-nothing: someone hiding every footer
    // company link should not also blank the header.
    return {
      header: grouped.header.length ? grouped.header : NAV_FALLBACK.header,
      footer_explore: grouped.footer_explore.length ? grouped.footer_explore : NAV_FALLBACK.footer_explore,
      footer_company: grouped.footer_company.length ? grouped.footer_company : NAV_FALLBACK.footer_company,
    }
  },
  ['nav-links'],
  { revalidate: 300, tags: ['chrome'] }
)

export const getHomeSections = unstable_cache(
  async (): Promise<HomeSection[]> => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('home_sections')
      .select('section_key, kind, heading, description, href, icon, accent, sort_order')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    if (!data || data.length === 0) return HOME_SECTIONS_FALLBACK
    return data as HomeSection[]
  },
  ['home-sections'],
  { revalidate: 300, tags: ['chrome'] }
)
