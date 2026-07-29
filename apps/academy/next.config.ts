import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@lkvip/ui",
    "@lkvip/types",
    "@lkvip/utils",
    "@lkvip/constants",
  ],
  serverExternalPackages: [],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
