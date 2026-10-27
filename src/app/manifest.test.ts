import { describe, expect, it } from "vitest";
import AppleIcon, { generateImageMetadata as appleImageMetadata } from "./apple-icon";
import Icon, { generateImageMetadata as iconImageMetadata } from "./icon";
import manifest from "./manifest";
import OpenGraphImage, { generateImageMetadata as openGraphImageMetadata } from "./opengraph-image";

describe("manifest", () => {
 it("returns valid PWA manifest properties", () => {
  const result = manifest();
  expect(result.name).toBe("HanziHome — Chinese Learning Workspace");
  expect(result.short_name).toBe("HanziHome");
  expect(result.display).toBe("standalone");
  expect(result.start_url).toBe("/");
  expect(result.theme_color).toBe("#111C3A");
  expect(result.background_color).toBe("#111C3A");
  expect(result.icons).toEqual([
   { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
   { src: "/icon/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
   { src: "/icon/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
   { src: "/icon/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ]);
 });

 it.each(iconImageMetadata())("renders $id with its declared PNG dimensions", async (image) => {
  const response = await Icon({ id: Promise.resolve(image.id) });
  const png = Buffer.from(await response.arrayBuffer());

  expect(response.headers.get("content-type")).toBe(image.contentType);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(image.size.width);
  expect(png.readUInt32BE(20)).toBe(image.size.height);
 });

 it("renders a 180px Apple touch icon", async () => {
  const response = AppleIcon();
  const png = Buffer.from(await response.arrayBuffer());

  expect(appleImageMetadata()).toEqual([
   { id: "180.png", size: { width: 180, height: 180 }, contentType: "image/png" },
  ]);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(png.readUInt32BE(16)).toBe(180);
  expect(png.readUInt32BE(20)).toBe(180);
 });

 it("renders a 1200x630 Open Graph image", async () => {
  const response = OpenGraphImage();
  const png = Buffer.from(await response.arrayBuffer());

  expect(openGraphImageMetadata()).toEqual([
   {
    id: "1200x630.png",
    alt: "HanziHome — Chinese Learning Workspace",
    size: { width: 1200, height: 630 },
    contentType: "image/png",
   },
  ]);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
 });
});
