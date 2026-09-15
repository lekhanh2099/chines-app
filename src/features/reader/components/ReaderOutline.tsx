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
 const commandLabels = useTranslations("Reader.study.chrome.commands");
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
 const hasSections = sections.length > 0;
 const items = hasSections
  ? sections.map((section, index) => ({
     id: section.id,
     label: section.title || t("lesson", { number: index + 1 }),
     targetSegmentId: section.segmentIds[0],
    }))
  : content.segmentIds.map((id, index) => ({
     id,
     label: t("segment", { number: index + 1 }),
     targetSegmentId: id,
    }));
 const activeValue = hasSections
  ? (activeSection?.id ?? sections[0]?.id ?? "")
  : (active ?? content.segmentIds[0] ?? "");

 return (
  <Select
   open={open}
   onOpenChange={actions.setOutlineOpen}
   value={activeValue}
   onValueChange={(itemId) => {
    const item = items.find((entry) => entry.id === itemId);
    if (item?.targetSegmentId) commands.selectSegment(item.targetSegmentId);
    actions.closeOutline();
    registry.focusOutlineTrigger();
   }}
  >
   <SelectTrigger
    size="sm"
    hideIcon
    aria-label={commandLabels("openOutline")}
    title={t("aria")}
    className="w-9 justify-center"
    disabled={items.length === 0}
    ref={(element) => {
     if (element) registry.setOutlineTrigger(element);
    }}
   >
    <List />
   </SelectTrigger>
   <SelectContent>
    {items.map((item) => (
     <SelectItem key={item.id} value={item.id}>
      {item.label}
     </SelectItem>
    ))}
   </SelectContent>
  </Select>
 );
}
