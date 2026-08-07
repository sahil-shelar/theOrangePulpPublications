// The fallback contract for site chrome.
//
// These matter more than they look. PostgREST does not throw when a table is
// missing — verified against the live project: selecting from a non-existent
// table returns `data: null` with the error tucked in a field nobody reads. So a
// build shipped before its migration renders a header with no links and logs
// nothing at all. The constants below are what stops that, and they only work if
// they stay in step with the seeded rows.

import { describe, test, expect } from '@jest/globals'
import {
  NAV_FALLBACK,
  HOME_SECTIONS_FALLBACK,
  sectionByKey,
  type NavLocation,
} from '@/lib/chrome-content'

const LOCATIONS: NavLocation[] = ['header', 'footer_explore', 'footer_company']

describe('NAV_FALLBACK', () => {
  test('covers every location the schema allows', () => {
    // A location present in the CHECK constraint but missing here would render
    // an empty menu on exactly the page nobody tested.
    for (const location of LOCATIONS) {
      expect(NAV_FALLBACK[location].length).toBeGreaterThan(0)
    }
  })

  test('still matches what the components used to hardcode', () => {
    expect(NAV_FALLBACK.header).toEqual([
      { href: '/reviews', label: 'Reviews' },
      { href: '/news', label: 'News' },
      { href: '/spotlight', label: 'Spotlight' },
      { href: '/lists', label: 'Rankings' },
    ])
    expect(NAV_FALLBACK.footer_company.map(l => l.href)).toEqual([
      '/about', '/contact', '/privacy', '/terms',
    ])
  })

  test('every href is a root-relative path', () => {
    // A bare "reviews" resolves against the current URL, so it works on / and
    // 404s from /news — the kind of bug that only shows up on a deep page.
    for (const location of LOCATIONS) {
      for (const link of NAV_FALLBACK[location]) {
        expect(link.href.startsWith('/')).toBe(true)
        expect(link.label.trim()).not.toBe('')
      }
    }
  })

  test('no duplicate destinations within one menu', () => {
    for (const location of LOCATIONS) {
      const hrefs = NAV_FALLBACK[location].map(l => l.href)
      expect(new Set(hrefs).size).toBe(hrefs.length)
    }
  })
})

describe('HOME_SECTIONS_FALLBACK', () => {
  test('section keys are unique', () => {
    const keys = HOME_SECTIONS_FALLBACK.map(s => s.section_key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('carries every key the homepage asks for', () => {
    // page.tsx looks these up by name. A key removed here renders no heading.
    for (const key of ['most_talked', 'latest', 'trending', 'on_our_radar', 'editors_picks']) {
      expect(sectionByKey([], key)?.kind).toBe('header')
    }
  })

  test('promo cards carry the fields their card needs', () => {
    const promos = HOME_SECTIONS_FALLBACK.filter(s => s.kind === 'promo')
    expect(promos.length).toBe(4)
    for (const promo of promos) {
      expect(promo.href).toBeTruthy()
      expect(promo.icon).toBeTruthy()
      expect(promo.accent).toBeTruthy()
      expect(promo.description).toBeTruthy()
    }
  })
})

describe('sectionByKey', () => {
  const row = {
    section_key: 'latest', kind: 'header' as const, heading: 'Fresh Off The Press',
    description: null, href: null, icon: null, accent: null,
  }

  test('prefers a database row over the fallback', () => {
    expect(sectionByKey([row], 'latest')?.heading).toBe('Fresh Off The Press')
  })

  test('falls back per key, not all-or-nothing', () => {
    // One configured section must not blank the other four.
    expect(sectionByKey([row], 'trending')?.heading).toBe('Trending')
  })

  test('returns null for a key nobody defines, so nothing renders empty', () => {
    expect(sectionByKey([], 'not_a_section')).toBeNull()
  })
})
