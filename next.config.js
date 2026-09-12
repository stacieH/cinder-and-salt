/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // The site is one page. Routes that used to exist redirect to their
  // section; Next.js keeps the #fragment in a redirect destination.
  async redirects() {
    return ['menu', 'gallery', 'about', 'contact'].map((section) => ({
      source: `/${section}`,
      destination: `/#${section}`,
      permanent: true,
    }));
  },
};

module.exports = nextConfig;
