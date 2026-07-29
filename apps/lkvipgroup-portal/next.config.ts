import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — dùng cho VPS/PM2; Vercel dùng serverless tự động
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["cloudinary", "bcryptjs", "nodemailer", "@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
