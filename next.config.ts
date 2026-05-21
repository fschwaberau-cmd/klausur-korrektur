import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@react-pdf/renderer"],
};

export default nextConfig;
