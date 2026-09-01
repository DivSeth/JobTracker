/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  },
};

export default nextConfig;
