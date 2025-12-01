import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // This is the magic part
    // It tells Vercel: "If someone asks for /pdf/filename, get it from the Backend"
    return [
      {
        source: "/pdf/:path*",
        destination: process.env.NEXT_PUBLIC_BACKEND_URL + "/pdf/:path*",
      },
    ];
  },
};

export default nextConfig;
