import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Exclude heavy native modules from client bundle.
  // Only applied during production `next build` (webpack), not Turbopack dev.
  webpack: (config, { isServer }) => {
    if (isServer) {
      const nativeModules = ["lighthouse", "puppeteer", "puppeteer-core", "@sparticuz/chromium"];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ...nativeModules.map((m) => ({ [m]: m })),
      ] as any;
    }
    return config;
  },
};

export default nextConfig;
