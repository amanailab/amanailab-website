import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com",              pathname: "/**" },
      { protocol: "https", hostname: "i3.ytimg.com",             pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com",          pathname: "/**" },
      { protocol: "https", hostname: "yt3.ggpht.com",            pathname: "/**" },
      { protocol: "https", hostname: "yt3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "nvjnfgdssukunoymhbmo.supabase.co", pathname: "/**" },
    ],
  },
};

export default nextConfig;
