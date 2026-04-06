import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Always disabled in dev — SW + self-signed LAN certs = broken fetches.
  // Use `pnpm preview:lan` for full PWA testing on the local network.
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withPWA(nextConfig);
