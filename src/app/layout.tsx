import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppToaster } from "@/components/layout/AppToaster";
import { VocabInspectorProvider } from "@/components/vocabulary/VocabInspectorProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
 Geist,
 Ma_Shan_Zheng,
 Noto_Sans_SC,
 Noto_Serif_SC,
 ZCOOL_XiaoWei,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans", preload: false });
const notoSerifSc = Noto_Serif_SC({
 weight: "variable",
 variable: "--font-reading-noto-serif",
 preload: false,
 fallback: ["Songti SC", "STSong", "Noto Serif CJK SC", "SimSun", "serif"],
});
const notoSansSc = Noto_Sans_SC({
 weight: "variable",
 variable: "--font-reading-noto-sans",
 preload: false,
 fallback: ["PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "sans-serif"],
});
const maShanZheng = Ma_Shan_Zheng({
 weight: "400",
 variable: "--font-reading-ma-shan",
 preload: false,
 fallback: ["Kaiti SC", "KaiTi", "serif"],
});
const zcoolXiaoWei = ZCOOL_XiaoWei({
 weight: "400",
 variable: "--font-reading-xiaowei",
 preload: false,
 fallback: ["Kaiti SC", "KaiTi", "serif"],
});

export const metadata: Metadata = {
 title: "KMS — Chinese Learning Portal",
 description: "Knowledge Management System for learning Chinese",
 icons: {
  icon: "/favicon.svg",
  shortcut: "/favicon.svg",
  apple: "/favicon.svg",
 },
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html
   lang="en"
   data-theme="light"
   suppressHydrationWarning
   className={cn(
    "font-sans",
    geist.variable,
    notoSerifSc.variable,
    notoSansSc.variable,
    maShanZheng.variable,
    zcoolXiaoWei.variable,
   )}
  >
   <body className="antialiased">
    <ThemeProvider>
     <TooltipProvider>
      <QueryProvider>
       <MandarinTtsProvider>
        <VocabInspectorProvider>{children}</VocabInspectorProvider>
       </MandarinTtsProvider>
      </QueryProvider>
      <AppToaster />
     </TooltipProvider>
    </ThemeProvider>
   </body>
  </html>
 );
}
