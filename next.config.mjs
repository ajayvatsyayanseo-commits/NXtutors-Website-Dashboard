/** @type {import('next').NextConfig} */

/**
 * The dashboard is served at the site's own paths — /user/dashboard and
 * /teacher/dashboard — so there is no basePath here. In production nginx sends
 * exactly those routes to this process and everything else to PHP; in
 * development `rewrites` below do the same job so `npm run dev` on its own
 * behaves like the deployed shape.
 */
const LARAVEL_ORIGIN = process.env.LARAVEL_ORIGIN ?? 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,

  images: {
    // Avatars and course images are served from the Laravel public disk.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**.nxtutors.com' },
    ],
  },

  async rewrites() {
    return {
      // Anything this app does not have a route for falls through to Laravel,
      // so links into the rest of the site keep working while running locally.
      fallback: [
        { source: '/:path*', destination: `${LARAVEL_ORIGIN}/:path*` },
      ],
    };
  },
};

export default nextConfig;
