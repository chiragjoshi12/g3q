import { resolveBackendOrigin } from "./config/backend-origin.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/status-bar",
    "@capacitor/splash-screen",
    "@capacitor/keyboard",
  ],
  images: {
    // Quiz banners come from whatever URL an admin pastes into the JSON/CMS
    // data (imgbb, imgur, etc.), so the host isn't known ahead of time —
    // allow any remote host rather than maintaining an allowlist.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // This dev sandbox resolves public hosts through a NAT64 gateway
    // (64:ff9b::/96), which Next's built-in SSRF guard treats as a private
    // IP and blocks. Banner URLs are admin-entered mock data, not end-user
    // input, so the SSRF exposure here is low — but revisit this if the app
    // ever accepts image URLs from untrusted users.
    dangerouslyAllowLocalIP: true,
  },
  async rewrites() {
    // Local (`next dev`) → http://localhost:4000
    // Production (Vercel build) → https://g3q-backend.azurewebsites.net
    // Override anytime with BACKEND_ORIGIN.
    const backend = resolveBackendOrigin();
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
