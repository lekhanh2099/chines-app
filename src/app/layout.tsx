import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "sonner";
import { VocabInspectorProvider } from "@/components/vocabulary/VocabInspectorProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
 title: "KMS — Chinese Learning Portal",
 description: "Knowledge Management System for learning Chinese",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html lang="en" data-theme="light" suppressHydrationWarning>
   <body className="antialiased">
    <ThemeProvider>
     <QueryProvider>
      <VocabInspectorProvider>{children}</VocabInspectorProvider>
     </QueryProvider>
     <Toaster position="top-right" richColors />
    </ThemeProvider>
   </body>
  </html>
 );
}
