"use client";

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

import { skillsHubSections, type SkillsHubSectionId } from "./skills-hub-sections";

const HEADER_OWNER_ID = "skills-hub";

export function SkillsHubHeaderContext({ sectionId }: { sectionId?: SkillsHubSectionId }) {
 const t = useTranslations("SkillsHub");
 const tShell = useTranslations("Shell");
 const router = useRouter();

 useEffect(() => {
  const hubLabel = tShell("navigation.items.skillsHub");
  const currentSection = sectionId
   ? skillsHubSections.find((section) => section.id === sectionId)
   : undefined;

  const content = currentSection ? (
   <AppHeaderBreadcrumb aria-label={t("header.breadcrumbAria")} className="min-w-0 max-w-full">
    <AppHeaderBreadcrumbItem className="hidden shrink-0 sm:inline-flex">
     <AppHeaderBreadcrumbLink href="/skills" className="shrink-0">
      {hubLabel}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden sm:inline-flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button
        type="button"
        variant="ghost"
        size="toolbar"
        aria-label={t("header.switchSectionAria")}
        className="min-w-0 justify-between"
       >
        <span className="truncate">{tShell(`navigation.items.${currentSection.id}`)}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" width="md">
       <DropdownMenuItem className="sm:hidden" onSelect={() => router.push("/skills")}>
        <span className="truncate">{hubLabel}</span>
       </DropdownMenuItem>
       <DropdownMenuSeparator className="sm:hidden" />
       <DropdownMenuRadioGroup
        value={currentSection.id}
        onValueChange={(nextId) => {
         const target = skillsHubSections.find((candidate) => candidate.id === nextId);
         if (target && target.id !== currentSection.id) {
          router.push(target.href);
         }
        }}
       >
        {skillsHubSections.map((section) => (
         <DropdownMenuRadioItem key={section.id} value={section.id}>
          <span className="truncate">{tShell(`navigation.items.${section.id}`)}</span>
         </DropdownMenuRadioItem>
        ))}
       </DropdownMenuRadioGroup>
      </DropdownMenuContent>
     </DropdownMenu>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ) : (
   <AppHeaderBreadcrumb aria-label={t("header.breadcrumbAria")} className="min-w-0 max-w-full">
    <AppHeaderBreadcrumbItem className="min-w-0">
     <AppHeaderBreadcrumbPage>{hubLabel}</AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  );

  headerToolbarStore.actions.setOwnedContent(HEADER_OWNER_ID, content);
 }, [router, sectionId, t, tShell]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(HEADER_OWNER_ID);
  },
  [],
 );

 return null;
}
