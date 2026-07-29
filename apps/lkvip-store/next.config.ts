import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@lkvip/ui",
    "@lkvip/types",
    "@lkvip/utils",
    "@lkvip/constants",
  ],
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.lkvip.group" },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
