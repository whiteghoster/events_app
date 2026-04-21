/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable SWC to avoid binary issues on Windows
  swcMinify: false,
  // Disable experimental features that might cause issues
  compress: false,
  // Simplified configuration
  poweredByHeader: false,
  generateEtags: false,
}

export default nextConfig
