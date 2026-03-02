import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "sonner";
import { VocabInspectorProvider } from "@/components/vocabulary/VocabInspectorProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const lexend = Lexend({
 variable: "--font-lexend",
 subsets: ["latin", "vietnamese"],
 weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

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
   <body className={`${lexend.variable} ${geistMono.variable} antialiased`}>
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
