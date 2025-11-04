/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable static export to allow API routes during development
  // For Netlify, these will become serverless functions
  // output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
