import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /vtk\.js[\\/].*\.glsl$/,
      use: 'raw-loader'
    });
    return config;
  }
};

export default nextConfig;
