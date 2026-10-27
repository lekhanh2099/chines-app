import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export function generateImageMetadata() {
 return [{ id: "180.png", size, contentType }];
}

export default function AppleIcon() {
 return new ImageResponse(
  <svg
   width={size.width}
   height={size.height}
   viewBox="0 0 48 48"
   xmlns="http://www.w3.org/2000/svg"
  >
   <rect width="48" height="48" fill="#111C3A" />
   <g transform="translate(11.58 16.5) scale(0.69)">
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
  size,
 );
}
