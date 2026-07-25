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
}

const withMDX = createMDX({})

module.exports = withMDX(nextConfig)
