"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, usePathname } from "@/i18n/navigation";

export function HskSectionNav() {
 const t = useTranslations("Shell");
 const pathname = usePathname();
 const grammarActive = pathname === "/hsk/grammar" || pathname.startsWith("/hsk/grammar/");

 return (
  <Card variant="section" padding="sm">
   <nav className="grid grid-cols-2 gap-2" aria-label={t("navigation.groups.hsk")}>
    <Button asChild variant={grammarActive ? "navigation" : "active"} wrap="normal">
     <Link href="/hsk" prefetch={false} aria-current={!grammarActive ? "page" : undefined}>
      {t("navigation.items.hskReading")}
     </Link>
    </Button>
    <Button asChild variant={grammarActive ? "active" : "navigation"} wrap="normal">
     <Link href="/hsk/grammar" prefetch={false} aria-current={grammarActive ? "page" : undefined}>
      {t("navigation.items.hskGrammar")}
     </Link>
    </Button>
   </nav>
  </Card>
 );
}
