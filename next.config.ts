import type { NextConfig } from "next";

/**
 * Content Security Policy:
 * - default-src 'self': only allow resources from same origin by default
 * - script-src 'self' 'unsafe-inline': allow inline scripts (Next.js requires this in dev)
 *   Note: 'unsafe-inline' is needed because Next.js injects inline scripts for hydration.
 *   In a future hardening pass, replace with nonces.
 * - style-src 'self' 'unsafe-inline': allow inline styles (Next.js, styled components)
 * - img-src 'self' data: blob:: allow data: URIs (PNG export), blob: for clipboard
 * - font-src 'self' data:: allow data: font URIs
 * - connect-src 'self': only same-origin API calls
 * - object-src 'none': block <object>, <embed>, <applet>
 * - base-uri 'self': restrict <base> tag
 * - form-action 'self': restrict form submissions
 * - frame-ancestors 'none': prevent clickjacking (X-Frame-Options: DENY equivalent)
 * - upgrade-insecure-requests: force HTTPS
 */
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = {
  'Content-Security-Policy': cspHeader,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  allowedDevOrigins: ["*.space-z.ai"],
  basePath: "/cardcraft",
  assetPrefix: "/cardcraft",
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
