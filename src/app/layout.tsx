import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppToaster } from "@/components/layout/AppToaster";
import { VocabInspectorProvider } from "@/components/vocabulary/VocabInspectorProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Geist, LXGW_WenKai_Mono_TC } from "next/font/google";
import { cn } from "@/lib/utils";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans", preload: false });
const lxgwWenKaiMonoTc = LXGW_WenKai_Mono_TC({
 weight: ["400", "700"],
 variable: "--font-lxgw-wenkai-mono-tc",
 preload: false,
 fallback: ["PingFang TC", "PingFang SC", "Microsoft JhengHei", "Microsoft YaHei"],
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
   className={cn("font-sans", geist.variable, lxgwWenKaiMonoTc.variable)}
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
