const createMDX = require('@next/mdx')

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    serverActions: {
      bodySizeLimit: '26mb',
    },
    proxyClientMaxBodySize: '26mb',
  },
  images: {
    // TMDb artwork and Supabase Storage uploads are the only remote image sources.
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
}

const withMDX = createMDX({})

module.exports = withMDX(nextConfig)
