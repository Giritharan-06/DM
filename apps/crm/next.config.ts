import type { NextConfig } from 'next';
import { config } from 'dotenv';
config({ path: '../../.env' });
const nextConfig: NextConfig = {
  transpilePackages: [
    '@zyroz/ui',
    '@zyroz/database',
    '@zyroz/auth',
    '@zyroz/validation',
  ],
};
export default nextConfig;
