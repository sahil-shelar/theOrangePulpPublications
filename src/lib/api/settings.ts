import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { unstable_cache } from 'next/cache'

export type SiteSettings = {
  site_name: string
  site_description: string
  maintenance_mode: boolean
  social_links: { twitter: string; facebook: string; instagram: string }
  feature_flags: Record<string, boolean>
  /** Trailing clause after the year and site name in the footer. */
  copyright_notice: string
}

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  site_name: 'The Orange Pulp',
  site_description: 'The definitive source for film criticism and industry news.',
  maintenance_mode: false,
  social_links: { twitter: '', facebook: '', instagram: '' },
  feature_flags: {},
  copyright_notice: 'All rights reserved.',
}

// site_settings is a key/value table (key TEXT UNIQUE, value JSONB) — not a
// single flat row. The previous version selected one arbitrary row and read
// .site_name off it, which is always undefined, so the settings form rendered
// empty regardless of what was stored.
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('site_settings').select('key, value')

  if (error || !data) return SITE_SETTINGS_DEFAULTS

  const byKey = new Map(data.map((row) => [row.key, row.value]))
  const pick = <K extends keyof SiteSettings>(key: K): SiteSettings[K] => {
    const raw = byKey.get(key)
    return (raw === undefined || raw === null ? SITE_SETTINGS_DEFAULTS[key] : raw) as SiteSettings[K]
  }

  return {
    site_name: pick('site_name'),
    site_description: pick('site_description'),
    maintenance_mode: pick('maintenance_mode'),
    social_links: pick('social_links'),
    feature_flags: pick('feature_flags'),
    copyright_notice: pick('copyright_notice'),
  }
}

/**
 * Site settings for the public chrome, read WITHOUT cookies.
 *
 * getSiteSettings uses the cookie-backed server client. Calling it from the root
 * layout opts the entire route tree into dynamic rendering, because touching
 * cookies is a dynamic API — measured: it turned /about and /privacy from static
 * and the three article detail routes from prerendered SSG into per-request
 * server renders across the whole site.
 *
 * Nothing here is user-scoped, and site_settings is public-read by policy
 * ("Site settings are readable by everyone", 20260719000000_rls_policies.sql),
 * so the anon client is both sufficient and correct. Cached for five minutes
 * alongside the navigation it renders with.
 */
export const getPublicSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase.from('site_settings').select('key, value')

    if (error || !data) return SITE_SETTINGS_DEFAULTS

    const byKey = new Map(data.map((row) => [row.key, row.value]))
    const pick = <K extends keyof SiteSettings>(key: K): SiteSettings[K] => {
      const raw = byKey.get(key)
      return (raw === undefined || raw === null ? SITE_SETTINGS_DEFAULTS[key] : raw) as SiteSettings[K]
    }

    return {
      site_name: pick('site_name'),
      site_description: pick('site_description'),
      maintenance_mode: pick('maintenance_mode'),
      social_links: pick('social_links'),
      feature_flags: pick('feature_flags'),
      copyright_notice: pick('copyright_notice'),
    }
  },
  ['public-site-settings'],
  { revalidate: 300, tags: ['chrome'] }
)
