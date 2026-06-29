// src/app/layout.tsx
export const metadata = {
  title: "HanziHome",
  description: "Chinese learning workspace",
  manifest: "/site.webmanifest",
  themeColor: "#7c3aed",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#7c3aed" }],
  },
};
