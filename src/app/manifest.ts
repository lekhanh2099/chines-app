import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
 return {
  name: "HanziHome — Chinese Learning Workspace",
  short_name: "HanziHome",
  description: "A focused workspace for learning Chinese with HanziHome.",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#0f172a",
  icons: [
   {
    src: "/favicon.svg",
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any",
   },
   {
    src: "/favicon.svg",
    sizes: "any",
    type: "image/svg+xml",
    purpose: "maskable",
   },
  ],
 };
}
