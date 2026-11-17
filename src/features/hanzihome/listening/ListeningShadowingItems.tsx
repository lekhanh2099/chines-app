"use client";

import { useTranslations } from "next-intl";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Checkbox } from "@/components/ui/forms/checkbox";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import { groupListeningShadowingItems } from "./listening-exercise-utils";
import type { ListeningRuntimeItem } from "./listening.types";

export function ShadowingItems({
 items,
 displayMode,
 onSpeak,
}: {
 items: ListeningRuntimeItem[];
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
}) {
 const t = useTranslations("Listening");
 const [done, setDone] = useState<Record<string, boolean>>({});
 const groups = useMemo(() => groupListeningShadowingItems(items), [items]);

 return groups.map(([groupId, groupItems]) => (
  <Card key={groupId} variant="section" padding="md" className="grid gap-2">
   <StudyInstructionText tone="default" weight="black">
    {groupItems[0]?.metadata.groupTitleZh} · {groupItems[0]?.metadata.groupTitleVi}
   </StudyInstructionText>
   {groupItems.map((item) => (
    <div
     key={item.id}
     className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 border-b border-border-default py-2 last:border-b-0"
    >
     <Checkbox
      checked={done[item.id] ?? false}
      aria-label={t("markPracticed", { text: item.promptZh ?? item.id })}
      onCheckedChange={(checked) =>
       setDone((current) => ({ ...current, [item.id]: checked === true }))
      }
     />
     <span lang="zh-CN" className="min-w-0">
      <ReaderHanziText displayMode={displayMode} as="span" tone="default" className="block">
       {item.promptZh}
      </ReaderHanziText>
      <StudyInstructionText variant="bodySmall" tone="accent" weight="semibold" className="block">
       {item.metadata.pinyin}
      </StudyInstructionText>
      <StudyInstructionText variant="bodySmall" tone="muted" className="block">
       {item.metadata.translationVi}
      </StudyInstructionText>
     </span>
     <span className="flex items-center gap-1">
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       onClick={() => onSpeak(item.promptZh ?? "")}
      >
       <Play data-icon="inline-start" />
       {t("shadowing")}
      </Button>
     </span>
    </div>
   ))}
  </Card>
 ));
}
