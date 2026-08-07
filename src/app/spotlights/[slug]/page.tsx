// Legacy plural URL. Redirects to the canonical singular route.
//
// This used to re-export the canonical page's default and generateMetadata,
// which meant every spotlight was served at two URLs — /spotlight/<slug> and
// /spotlights/<slug> — with generateStaticParams prerendering both and no
// canonical link between them. typeToRoute only ever emits `spotlight`, so the
// plural exists solely to catch old links; catching them means redirecting, not
// serving a duplicate.
//
// permanentRedirect (308) rather than redirect (307): the plural is never coming
// back as a real page, and a permanent redirect is what consolidates the two
// URLs for search engines.

import { permanentRedirect } from 'next/navigation'

export default async function LegacySpotlightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  permanentRedirect(`/spotlight/${slug}`)
}
