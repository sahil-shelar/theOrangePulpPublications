// Real assertions, unlike the placeholder suites beside this file.
//
// Scope is deliberately narrow: the pure, dependency-free helpers that decide
// how a generated article is identified and routed. These are the pieces where a
// silent change does damage that only shows up weeks later — a signature that
// stops matching means "part 2" silently repeats part 1, and a signature that
// starts colliding means a spotlight is mistaken for a ranking.
//
// Anything touching TMDB or Gemini is not covered here and still has no tests.

import { describe, test, expect } from '@jest/globals'
import { buildSignature, readSignatureSort } from '@/lib/generation/templates'
import { spotlightSignature } from '@/lib/generation/spotlights'
import { typeToRoute } from '@/lib/utils'

describe('buildSignature', () => {
  test('emits the documented g/p/d/y/s shape', () => {
    expect(buildSignature({ genreIds: [27], sort: 'rating' })).toBe('g=27;p=;d=;y=-;s=rating')
  })

  test('sorts genre ids numerically so argument order cannot change the key', () => {
    const a = buildSignature({ genreIds: [878, 27, 53], sort: 'rating' })
    const b = buildSignature({ genreIds: [53, 878, 27], sort: 'rating' })
    expect(a).toBe(b)
    expect(a).toBe('g=27|53|878;p=;d=;y=-;s=rating')
  })

  test('ignores nothing else — provider, person and year bounds all land in the key', () => {
    expect(
      buildSignature({ genreIds: [], providerId: 8, personId: 525, yearFrom: 1990, yearTo: 1999, sort: 'revenue' })
    ).toBe('g=;p=8;d=525;y=1990-1999;s=revenue')
  })

  test('two runs of the same query match, which is what lets part 2 exclude part 1', () => {
    const part1 = buildSignature({ genreIds: [27], yearFrom: null, yearTo: null, sort: 'rating' })
    const part2 = buildSignature({ genreIds: [27], providerId: null, personId: null, sort: 'rating' })
    expect(part1).toBe(part2)
  })

  test('a different sort mode is a different query', () => {
    expect(buildSignature({ genreIds: [27], sort: 'rating' }))
      .not.toBe(buildSignature({ genreIds: [27], sort: 'revenue' }))
  })
})

describe('readSignatureSort', () => {
  // Not `as const`: that makes the tuples readonly, which jest's test.each
  // signature rejects — the suite still runs but tsc fails on it.
  test.each([
    ['rating', 'g=27;p=;d=;y=-;s=rating'],
    ['revenue', 'g=;p=;d=;y=-;s=revenue'],
    ['popularity', 'g=18;p=8;d=;y=2000-2009;s=popularity'],
    ['recent', 'g=;p=;d=525;y=-;s=recent'],
  ])('reads %s back out of a stored signature', (expected, signature) => {
    expect(readSignatureSort(signature)).toBe(expected)
  })

  test('returns null for hand-made rankings and pre-signature drafts', () => {
    expect(readSignatureSort(null)).toBeNull()
    expect(readSignatureSort(undefined)).toBeNull()
    expect(readSignatureSort('')).toBeNull()
  })

  test('returns null rather than guessing when the mode is unrecognised', () => {
    // Callers must treat null as "unknown", never as a default mode — a wrong
    // guess here makes a rating list render box-office figures.
    expect(readSignatureSort('g=27;p=;d=;y=-;s=alphabetical')).toBeNull()
  })

  test('does not mistake a spotlight signature for a ranking', () => {
    expect(readSignatureSort(spotlightSignature(525))).toBeNull()
  })
})

describe('spotlightSignature', () => {
  test('carries a distinct prefix so it cannot collide with a ranking signature', () => {
    const spotlight = spotlightSignature(525)
    expect(spotlight).toBe('spotlight:person=525')
    // Both formats share one TEXT column; a collision would make the dedup check
    // in pickSubject skip a subject because an unrelated ranking matched.
    expect(spotlight).not.toContain('s=')
    expect(spotlight).not.toBe(buildSignature({ genreIds: [], personId: 525, sort: 'rating' }))
  })

  test('is stable for the same person, which is what makes the dedup check work', () => {
    expect(spotlightSignature(525)).toBe(spotlightSignature(525))
    expect(spotlightSignature(525)).not.toBe(spotlightSignature(526))
  })
})

describe('typeToRoute', () => {
  test.each([
    ['review', 'reviews'],
    ['news', 'news'],
    ['spotlight', 'spotlight'],
    ['list', 'lists'],
  ])('maps %s to /%s', (type, route) => {
    expect(typeToRoute(type)).toBe(route)
  })

  test('spotlight stays singular — the plural URL only exists as a redirect', () => {
    expect(typeToRoute('spotlight')).not.toBe('spotlights')
  })

  test('falls back to a naive plural for an unknown type', () => {
    expect(typeToRoute('interview')).toBe('interviews')
  })
})
