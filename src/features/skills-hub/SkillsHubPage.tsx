"use client";

import { ChevronRight, Headphones } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import { YoutubeLinkForm } from "@/features/youtube-shadowing/components/YoutubeLinkForm";
import { Link } from "@/i18n/navigation";

import { skillsHubSections } from "./skills-hub-sections";

export function SkillsHubPage() {
 const t = useTranslations("SkillsHub");
 const tShell = useTranslations("Shell");

 const shadowingSection = skillsHubSections[0];
 const otherSections = skillsHubSections.slice(1);
 const ShadowingIcon = shadowingSection.icon;

 return (
  <PageContainer>
   <div className="grid min-w-0 gap-5 sm:gap-7">
    <div className="flex min-w-0 items-start gap-3 border-b border-border-default pb-4">
     <IconTile tone="accent" size="md">
      <Headphones aria-hidden="true" />
     </IconTile>
     <PageHeader
      title={t("header.title")}
      description={t("header.description")}
      className="min-w-0 flex-1"
     />
    </div>

    <div className="grid min-w-0 gap-3">
     <Card variant="section" padding="lg" className="grid min-w-0 gap-4">
      <div className="flex min-w-0 items-start gap-3">
       <IconTile tone={shadowingSection.tone} size="md">
        <ShadowingIcon aria-hidden="true" />
       </IconTile>
       <div className="grid min-w-0 flex-1 gap-1">
        <Typography as="h2" variant="sectionTitle">
         {t("sections.shadowing.title")}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="secondary">
         {t("sections.shadowing.description")}
        </Typography>
       </div>
      </div>

      <YoutubeLinkForm density="compact" />
     </Card>

     <div className="grid min-w-0 gap-3 lg:grid-cols-2">
      {otherSections.map((section) => {
       const SectionIcon = section.icon;
       return (
        <Card key={section.id} variant="interactive" padding="lg" asChild>
         <Link href={section.href} prefetch={false} className="grid min-w-0 gap-3">
          <div className="flex min-w-0 items-start gap-3">
           <IconTile tone={section.tone} size="md">
            <SectionIcon aria-hidden="true" />
           </IconTile>
           <div className="grid min-w-0 flex-1 gap-1">
            <Typography as="h2" variant="cardTitle">
             {tShell(`navigation.items.${section.id}`)}
            </Typography>
            <Typography as="p" variant="bodySmall" tone="secondary" clamp="two">
             {t(`sections.${section.id}.description`)}
            </Typography>
           </div>
          </div>
          <div className="flex items-center justify-end gap-1">
           <Typography as="span" variant="label" tone="accent">
            {t(`sections.${section.id}.action`)}
           </Typography>
           <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
          </div>
         </Link>
        </Card>
       );
      })}
     </div>
    </div>
   </div>
  </PageContainer>
 );
}
