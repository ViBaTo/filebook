import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      // Fix for pdfjs-dist canvas requirement
      canvas: { browser: './empty-module.js' }
    }
  },
  // Webpack fallback for older builds
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qkdmerpjmskktkvabldf.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  }
}

export default nextConfig
