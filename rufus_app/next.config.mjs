/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.arasaac.org',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;