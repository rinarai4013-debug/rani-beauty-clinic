/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ranibeautyclinic.com" }],
        destination: "https://www.ranibeautyclinic.com/:path*",
        permanent: true,
      },
      /* ── Results short-slug redirects ── */
      {
        source: "/results/botox",
        destination: "/results/botox-dysport",
        permanent: true,
      },
      {
        source: "/results/dysport",
        destination: "/results/botox-dysport",
        permanent: true,
      },
      {
        source: "/results/fillers",
        destination: "/results/dermal-fillers",
        permanent: true,
      },
      {
        source: "/results/microneedling",
        destination: "/results/rf-microneedling",
        permanent: true,
      },
      {
        source: "/results/glp1",
        destination: "/results/glp1-weight-management",
        permanent: true,
      },
      {
        source: "/results/weight-loss",
        destination: "/results/glp1-weight-management",
        permanent: true,
      },
      {
        source: "/results/peels",
        destination: "/results/chemical-peels",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
