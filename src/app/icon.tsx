import { ImageResponse } from "next/og";

export function generateImageMetadata() {
 return [
  { id: "32.png", size: { width: 32, height: 32 }, contentType: "image/png" },
  { id: "192.png", size: { width: 192, height: 192 }, contentType: "image/png" },
  { id: "512.png", size: { width: 512, height: 512 }, contentType: "image/png" },
  { id: "maskable.png", size: { width: 512, height: 512 }, contentType: "image/png" },
 ];
}

export default async function Icon({
 id,
}: {
 id: Promise<ReturnType<typeof generateImageMetadata>[number]["id"]>;
}) {
 const imageId = await id;
 const dimension = imageId === "32.png" ? 32 : imageId === "192.png" ? 192 : 512;
 const maskable = imageId === "maskable.png";

 return new ImageResponse(
  <svg width={dimension} height={dimension} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
   <rect width="48" height="48" rx={maskable ? 0 : 10} fill="#111C3A" />
   <g
    transform={maskable ? "translate(14.064 18) scale(0.552)" : "translate(11.58 16.5) scale(0.69)"}
   >
    <path
     d="M-0.5 -4.5 L18 -15.5 L36.5 -4.5"
     fill="none"
     stroke="#8DA2FF"
     strokeWidth="5.5"
     strokeLinecap="round"
     strokeLinejoin="round"
    />
    <rect x="0" y="0" width="8.5" height="40" rx="2" fill="#F1F4FB" />
    <rect x="27.5" y="0" width="8.5" height="40" rx="2" fill="#F1F4FB" />
    <line x1="5" y1="20" x2="31" y2="20" stroke="#2DD4BF" strokeWidth="6.5" strokeLinecap="round" />
   </g>
  </svg>,
  { width: dimension, height: dimension },
 );
}
