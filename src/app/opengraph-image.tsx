import { ImageResponse } from "next/og";

export const alt = "HanziHome — Chinese Learning Workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateImageMetadata() {
 return [{ id: "1200x630.png", alt, size, contentType }];
}

export default function OpenGraphImage() {
 return new ImageResponse(
  <div
   style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    width: "100%",
    height: "100%",
    background: "#0D1529",
    color: "#F1F4FB",
    fontFamily: "sans-serif",
   }}
  >
   <svg width="192" height="192" viewBox="-4 -18 44 58" xmlns="http://www.w3.org/2000/svg">
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
   </svg>
   <div style={{ display: "flex", fontSize: 88, fontWeight: 700, letterSpacing: -3 }}>
    HanziHome
   </div>
   <div style={{ display: "flex", fontSize: 30, color: "#cbd5e1" }}>
    A focused workspace for learning Chinese.
   </div>
  </div>,
  size,
 );
}
