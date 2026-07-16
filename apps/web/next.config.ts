import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: [
    "@musimaman/shared-types",
    "@musimaman/validation",
    "@musimaman/config",
    "@musimaman/financial-engine"
  ]
};

export default nextConfig;
