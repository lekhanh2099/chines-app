import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { parseHanziHomeModule } from "@/features/hanzihome/workspace-modules";
import type { HomeLessonTarget } from "@/features/home/types";
import { cn } from "@/lib/utils";

export function HomeSectionHeader({
 id,
 title,
 description,
 action,
 className,
}: {
 id: string;
 title: string;
 description?: string;
 action?: ReactNode;
 className?: string;
}) {
 return (
  <div className={cn("flex flex-wrap items-end justify-between gap-x-3 gap-y-2", className)}>
   <div className="grid min-w-0 flex-[1_1_14rem] gap-1">
    <Typography
     as="h2"
     variant="sectionTitle"
     id={id}
     tone="default"
     weight="black"
     tracking="tight"
    >
     {title}
    </Typography>
    {description ? (
     <Typography as="p" variant="bodySmall" tone="muted" weight="semibold" leading="compact">
      {description}
     </Typography>
    ) : null}
   </div>
   {action ? <div className="shrink-0">{action}</div> : null}
  </div>
 );
}

/** Labels a resume module: HanziHome modules by name, textbook-only tabs by their own copy. */
export function useHomeModuleLabel() {
 const t = useTranslations("Home");
 return (module: HomeLessonTarget["module"]) => {
  const hanziHomeModule = parseHanziHomeModule(module);
  if (hanziHomeModule) return t(`modules.${hanziHomeModule}`);
  if (module === "all") return t("textbookModules.all");
  if (module === "text") return t("modules.lessonText");
  if (module === "core") return t("textbookModules.core");
  if (module === "translation") return t("textbookModules.translation");
  return t("modules.overview");
 };
}

/** Lesson heading shared by Home continuation surfaces (review titles are kept verbatim). */
export function useHomeLessonTitle() {
 const t = useTranslations("Home");
 return (lesson: HomeLessonTarget) =>
  lesson.title.startsWith("ÔN TẬP ")
   ? lesson.title
   : t("continueLearning.lesson", {
      number: lesson.lessonNumber,
      title: lesson.titleZh || lesson.title,
     });
}

export function HomeArrowIcon({ className }: { className?: string }) {
 return <ArrowRight className={cn("size-4 shrink-0 text-text-muted", className)} />;
}
