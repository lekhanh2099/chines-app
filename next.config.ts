import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 devIndicators: false,
 experimental: {
  useTypeScriptCli: false,
 },
 async redirects() {
  return [
   {
    source: "/hanzihome/vocab/review",
    destination: "/vocab/review",
    permanent: true,
   },
   {
    source: "/hanzihome/vocab",
    destination: "/vocab",
    permanent: true,
   },
   {
    source: "/hanzihome/grammar",
    destination: "/grammar",
    permanent: true,
   },
   {
    source: "/hanzihome/memory-tips",
    destination: "/memory-tips",
    permanent: true,
   },
   {
    source: "/hanzihome/html-artifacts",
    destination: "/html-artifacts",
    permanent: true,
   },
  ];
 },
};

export default nextConfig;
