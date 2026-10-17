/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/starter.db", "./public/starter.db"],
    },
  },
};

export default nextConfig;
