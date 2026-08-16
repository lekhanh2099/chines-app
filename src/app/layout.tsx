import type { Metadata } from "next";
import "./globals.css";
import "./theme-palettes.css";
import "./surface-system.css";
import "./responsive-system.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppToaster } from "@/components/layout/AppToaster";
import { VocabInspectorProvider } from "@/components/vocabulary/VocabInspectorProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";

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
   data-theme-mode="system"
   data-palette="editorial"
   suppressHydrationWarning
   className="font-sans"
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
