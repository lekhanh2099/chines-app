import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
 return {
  name: "HanziHome — Chinese Learning Workspace",
  short_name: "HanziHome",
  description: "A focused workspace for learning Chinese with HanziHome.",
  start_url: "/",
  display: "standalone",
  background_color: "#111C3A",
  theme_color: "#111C3A",
  icons: [
   {
    src: "/favicon.svg",
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any",
   },
   {
    src: "/icon/192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
   },
   {
    src: "/icon/512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
   },
   {
    src: "/icon/maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
   },
  ],
 };
}
