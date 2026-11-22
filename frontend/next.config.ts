import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode's development-only effect remount conflicts with
  // React Three Fiber's delayed WebGL cleanup, which can invalidate the
  // newly mounted avatar canvas.
  reactStrictMode: false,
};

export default nextConfig;
