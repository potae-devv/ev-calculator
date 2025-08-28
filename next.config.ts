import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // External packages for server components
  serverExternalPackages: ['bcryptjs'],
  
  // Optional: Configure image patterns for external images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      }
    ]
  }
};

export default nextConfig;
