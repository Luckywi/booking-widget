// next.config.ts
import type { Configuration } from 'webpack';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
        if (!isServer) {
            config.entry = {
                ...(typeof config.entry === 'object' ? config.entry : {}),
                widget: './src/widget.ts'
            };
        }
        return config;
    }
};

export default nextConfig;