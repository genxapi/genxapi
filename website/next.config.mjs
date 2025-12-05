/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  distDir: 'dist',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true
  },
  optimizeFonts: false,
  experimental: {
    externalDir: true
  }
};

export default config;
