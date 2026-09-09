"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
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
 return (
  <Sheet
   open={open}
   onOpenChange={actions.setOutlineOpen}
   side="bottom"
   height="tall"
   onCloseAutoFocus={(event) => {
    event.preventDefault();
    registry.focusOutlineTrigger();
   }}
  >
   <SheetHeader title={t("aria")} onClose={actions.closeOutline} />
   <SheetBody className="grid content-start gap-4">
    <nav aria-label={t("aria")} className="grid min-w-0 gap-2">
     {content.segmentIds.map((id, index) => (
      <Button
       key={id}
       variant={active === id ? "active" : "ghost"}
       size="touch"
       align="start"
       wrap="normal"
       aria-current={active === id ? "location" : undefined}
       onClick={() => {
        commands.selectSegment(id);
        actions.closeOutline();
       }}
      >
       {t("segment", { number: index + 1 })}
      </Button>
     ))}
    </nav>
    {content.metadata.length > 0 ? (
     <section className="grid min-w-0 gap-2">
      <Typography as="h3" variant="sectionTitle">
       {t("metadata")}
      </Typography>
      {content.metadata.map((item) => (
       <div key={item.id} className="grid min-w-0 gap-1">
        <Typography variant="caption" tone="muted" wrapping="breakWords">
         {item.label}
        </Typography>
        <Typography wrapping="breakWords">{item.value}</Typography>
       </div>
      ))}
     </section>
    ) : null}
   </SheetBody>
  </Sheet>
 );
}
