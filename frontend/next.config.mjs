/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compress: false,
  poweredByHeader: false,
  generateEtags: false,
}

export default nextConfig
