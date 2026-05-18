import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.spykeapp.fr' }],
        destination: 'https://spykeapp.fr/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
