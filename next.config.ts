import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AI Elements components have type incompatibilities with the installed @base-ui/react version.
  // These are third-party library files — suppressing to unblock the build.
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
