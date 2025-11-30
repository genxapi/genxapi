/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
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
