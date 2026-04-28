import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    cacheComponents: true,
    /* config options here */
    output: 'standalone',
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                hostname: 'res.cloudinary.com',
            },
        ],
    },
};

export default nextConfig;

