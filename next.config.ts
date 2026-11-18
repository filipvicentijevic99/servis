import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Club photos uploaded from the owner dashboard (issue #11).
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
