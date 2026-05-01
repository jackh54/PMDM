import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typedRoutes: false,
  outputFileTracingRoot: path.join(process.cwd())
};

export default nextConfig;
