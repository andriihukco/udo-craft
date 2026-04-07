/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@udo-craft/shared", "@udo-craft/ui", "@udo-craft/config", "@udo-craft/styles"],
  experimental: {
    optimizePackageImports: ['@udo-craft/ui'],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@imgly/background-removal', 'fabric', 'canvas'];
    } else {
      // Force webpack to treat .mjs files as ES modules so import.meta is valid
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/esm',
      });
    }
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: { fullySpecified: false },
    });
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hsyxyzmnhjybklvlaelw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
