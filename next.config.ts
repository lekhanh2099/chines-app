import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { appLocales } from "./src/i18n/config";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const legacyHanziHomeRedirects = [
 ["/hanzihome/vocab/review", "/vocab/review"],
 ["/hanzihome/vocab", "/vocab"],
 ["/hanzihome/grammar", "/grammar"],
 ["/hanzihome/memory-tips", "/memory-tips"],
 ["/hanzihome/html-artifacts", "/html-artifacts"],
] as const;

const nextConfig: NextConfig = {
 devIndicators: false,
 turbopack: {
  root: process.cwd(),
 },
 experimental: {
  useTypeScriptCli: false,
 },
 async redirects() {
  return [
   ...legacyHanziHomeRedirects.map(([source, destination]) => ({
    source,
    destination,
    permanent: true,
   })),
   ...appLocales.flatMap((locale) =>
    legacyHanziHomeRedirects.map(([source, destination]) => ({
     source: `/${locale}${source}`,
     destination: `/${locale}${destination}`,
     permanent: true,
    })),
   ),
  ];
 },
};

export default withNextIntl(nextConfig);
