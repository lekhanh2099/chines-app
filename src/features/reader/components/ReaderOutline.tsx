"use client";

import { useTranslations } from "next-intl";
import { List } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
 useReaderCommands,
 useReaderRegistry,
 useReaderSelector,
 useReaderStore,
} from "../runtime/reader-context";

export function ReaderOutline() {
 const t = useTranslations("Reader.study.chrome.outline");
 const commands = useReaderCommands();
 const registry = useReaderRegistry();
 const { actions } = useReaderStore();
 const open = useReaderSelector((state) => state.ui.outlineOpen);
 const content = useReaderSelector((state) => state.content);
 const active = useReaderSelector((state) => state.navigation.activeSegmentId);
 const sections = content.sectionIds
  .map((id) => content.sectionsById[id])
  .filter((section) => section !== undefined);
 const activeSection = sections.find((section) => section.segmentIds.includes(active ?? ""));
 return (
  <Select
   open={open}
   onOpenChange={actions.setOutlineOpen}
   value={activeSection?.id ?? sections[0]?.id ?? ""}
   onValueChange={(sectionId) => {
    const section = sections.find((item) => item.id === sectionId);
    const firstSegmentId = section?.segmentIds[0];
    if (firstSegmentId) commands.selectSegment(firstSegmentId);
    actions.closeOutline();
    registry.focusOutlineTrigger();
   }}
  >
   <SelectTrigger
    size="sm"
    aria-label={t("aria")}
    className="w-11 [&>svg:last-child]:hidden"
    disabled={sections.length === 0}
    ref={(element) => {
     if (element) registry.setOutlineTrigger(element);
    }}
   >
    <List />
   </SelectTrigger>
   <SelectContent>
    {sections.map((section, index) => (
     <SelectItem key={section.id} value={section.id}>
      {section.title || t("lesson", { number: index + 1 })}
     </SelectItem>
    ))}
   </SelectContent>
  </Select>
 );
}
