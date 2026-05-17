import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',     value: 'on' },
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection',           value: '1; mode=block' },
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(self), geolocation=()' },
  // Force HTTPS for 1 year; include subdomains; allow browser preload list submission
  { key: 'Strict-Transport-Security',  value: 'max-age=31536000; includeSubDomains; preload' },
  // Prevent MIME-type sniffing attacks on cross-origin resources
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  // Isolate browsing context to prevent Spectre-class side-channel attacks
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + analytics (GA/Clarity) + Giscus + Pyodide CDN (in-browser Python)
      // wasm-unsafe-eval is required for Pyodide WebAssembly execution
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://giscus.app https://cdn.jsdelivr.net",
      // Styles: self + inline (Tailwind JIT, framer-motion) + Monaco editor CSS from CDN
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      // Fonts: Geist (Google) + Monaco editor icon font (codicon.ttf) from CDN
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      // Images: self + data URIs + YouTube + Supabase + GitHub avatars
      "img-src 'self' data: blob: https://i.ytimg.com https://i3.ytimg.com https://img.youtube.com https://yt3.ggpht.com https://yt3.googleusercontent.com https://nvjnfgdssukunoymhbmo.supabase.co https://avatars.githubusercontent.com",
      // Frames: Giscus comments, YouTube embeds
      "frame-src https://giscus.app https://www.youtube.com",
      // Connections: self + all external APIs + Pyodide CDN (downloads .whl packages at runtime)
      "connect-src 'self' https://api.groq.com https://generativelanguage.googleapis.com https://nvjnfgdssukunoymhbmo.supabase.co https://www.google-analytics.com https://www.clarity.ms wss://nvjnfgdssukunoymhbmo.supabase.co https://cdn.jsdelivr.net",
      // Media
      "media-src 'self' blob:",
      // Workers (Monaco editor uses blob workers)
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  compress: true,
  serverExternalPackages: ["pdf-parse"],

  // 301 redirect www → non-www for canonical URL consistency
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.amanailab.com' }],
        destination: 'https://amanailab.com/:path*',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          // Explicitly tell Google to index all pages
          { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        ],
      },
      // Cache static assets aggressively, but revalidate HTML frequently
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' }],
      },
      {
        source: '/robots.txt',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com",                    pathname: "/**" },
      { protocol: "https", hostname: "i3.ytimg.com",                   pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com",                pathname: "/**" },
      { protocol: "https", hostname: "yt3.ggpht.com",                  pathname: "/**" },
      { protocol: "https", hostname: "yt3.googleusercontent.com",      pathname: "/**" },
      { protocol: "https", hostname: "nvjnfgdssukunoymhbmo.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com",  pathname: "/**" },
      { protocol: "https", hostname: "pbs.twimg.com",                  pathname: "/**" },
    ],
  },
};

export default nextConfig;
