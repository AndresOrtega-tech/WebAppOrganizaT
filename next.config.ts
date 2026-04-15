import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from stripping trailing slashes before they reach
  // the internal proxy route handler. Without this, POST /api/backend/tasks/
  // gets silently redirected to /api/backend/tasks, the proxy forwards
  // without slash, FastAPI issues a 307, and the POST body is lost → 502.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
