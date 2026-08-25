import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import "../globals.css";
import "../theme-palettes.css";
import "../surface-system.css";
import "../responsive-system.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppToaster } from "@/components/layout/AppToaster";
import { VocabInspectorProvider } from "@/features/dictionary/components/VocabInspectorProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { routing } from "@/i18n/routing";
import {
 DEFAULT_THEME_MODE,
 DEFAULT_THEME_PALETTE,
 THEME_MODE_STORAGE_KEY,
 THEME_PALETTE_STORAGE_KEY,
 ThemeModeSchema,
 ThemePaletteSchema,
} from "@/components/layout/theme-contract";

const themeBootstrapScript = `(function(){try{var modes=${JSON.stringify(ThemeModeSchema.options)};var palettes=${JSON.stringify(ThemePaletteSchema.options)};var mode=localStorage.getItem(${JSON.stringify(THEME_MODE_STORAGE_KEY)});var palette=localStorage.getItem(${JSON.stringify(THEME_PALETTE_STORAGE_KEY)});if(!modes.includes(mode))mode=${JSON.stringify(DEFAULT_THEME_MODE)};if(!palettes.includes(palette))palette=${JSON.stringify(DEFAULT_THEME_PALETTE)};var theme=mode==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):mode;var root=document.documentElement;root.setAttribute("data-theme",theme);root.setAttribute("data-theme-mode",mode);root.setAttribute("data-palette",palette);root.classList.toggle("dark",theme==="dark")}catch{}})()`;

export const metadata: Metadata = {
 title: "HanziHome — Chinese Learning Workspace",
 description: "A focused workspace for learning Chinese with HanziHome.",
 icons: {
  icon: "/favicon.svg",
  shortcut: "/favicon.svg",
  apple: "/favicon.svg",
 },
};

export function generateStaticParams() {
 return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
 const { locale } = await params;

 if (!hasLocale(routing.locales, locale)) notFound();

 setRequestLocale(locale);
 const messages = await getMessages();

 return (
  <html
   lang={locale}
   data-theme="light"
   data-theme-mode="system"
   data-palette="editorial"
   suppressHydrationWarning
   className="font-sans"
  >
   <head>
    <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
   </head>
   <body className="antialiased">
    <NextIntlClientProvider locale={locale} messages={messages}>
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
    </NextIntlClientProvider>
   </body>
  </html>
 );
}
