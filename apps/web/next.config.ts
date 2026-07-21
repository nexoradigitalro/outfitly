import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/types and packages/api-client ship raw TypeScript source (no
  // build step yet — see docs/ARCHITECTURE.md §13), so Next must transpile
  // them itself instead of expecting compiled JS.
  transpilePackages: ["@outfitly/types", "@outfitly/api-client"],
  images: {
    // Closet item photos are served as signed URLs from Supabase Storage
    // (private buckets — docs/ARCHITECTURE.md §9), always on a *.supabase.co host.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" }],
  },
};

export default nextConfig;
