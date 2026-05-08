import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',     value: 'on' },
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection',           value: '1; mode=block' },
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(self), geolocation=()' },
]

const nextConfig: NextConfig = {
  compress: true,
  serverExternalPackages: ["pdf-parse"],

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com",               pathname: "/**" },
      { protocol: "https", hostname: "i3.ytimg.com",              pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com",           pathname: "/**" },
      { protocol: "https", hostname: "yt3.ggpht.com",             pathname: "/**" },
      { protocol: "https", hostname: "yt3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "nvjnfgdssukunoymhbmo.supabase.co", pathname: "/**" },
    ],
  },
};

export default nextConfig;
