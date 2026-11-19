"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { cn } from "@/lib/utils";
import { diffNoteLines, type DiffKind, type DiffLine } from "@/features/notes/note-content-diff";

// Unchanged lines kept around each change for context.
const CONTEXT_LINES = 1;

const lineTone: Record<DiffKind, string> = {
 same: "text-text-secondary",
 changed: "bg-bg-subtle text-text-primary",
 added: "bg-success-subtle text-success-text",
 removed: "bg-danger-subtle text-danger-text line-through decoration-danger/60",
};
const partTone: Record<DiffKind, string> = {
 same: "",
 changed: "",
 added: "rounded-sm bg-success-subtle px-0.5 text-success-text",
 removed: "rounded-sm bg-danger-subtle px-0.5 text-danger-text line-through decoration-danger/60",
};
const marker: Record<DiffKind, string> = { same: " ", changed: "~", added: "+", removed: "−" };

type VisibleRow = { line: DiffLine; hidden: number };

/** Shows changed lines with a little context and folds the unchanged runs. */
function visibleRows(lines: DiffLine[]): VisibleRow[] {
 const keep = lines.map((line, index) =>
  lines
   .slice(Math.max(0, index - CONTEXT_LINES), index + CONTEXT_LINES + 1)
   .some((near) => near.kind !== "same"),
 );
 const rows: VisibleRow[] = [];
 let hidden = 0;
 lines.forEach((line, index) => {
  if (keep[index]) {
   rows.push({ line, hidden });
   hidden = 0;
  } else hidden += 1;
 });
 if (hidden > 0) rows.push({ line: { kind: "same", parts: [] }, hidden });
 return rows;
}

/**
 * The difference between the server version (`before`) and the version on this
 * device (`after`): green is only on this device, red only on the server.
 */
export function NoteContentDiff({
 before,
 after,
}: {
 before: readonly string[];
 after: readonly string[];
}) {
 const t = useTranslations("Notes.editor.conflict");
 const lines = useMemo(() => diffNoteLines(before, after), [after, before]);
 const changed = lines.filter((line) => line.kind !== "same").length;

 if (changed === 0) {
  return (
   <Typography as="p" variant="bodySmall" tone="muted">
    {t("identical")}
   </Typography>
  );
 }

 return (
  <div className="grid gap-2">
   <Typography as="p" variant="caption" tone="muted">
    {t("changedCount", { count: changed })}
   </Typography>
   <ol className="grid gap-0.5 text-sm leading-6">
    {visibleRows(lines).map(({ line, hidden }, index) => (
     <li key={index} className="grid gap-0.5">
      {hidden > 0 ? (
       <Typography as="span" variant="caption" tone="muted" className="px-2">
        {t("sameLines", { count: hidden })}
       </Typography>
      ) : null}
      {line.parts.length > 0 ? (
       <div className={cn("flex gap-2 rounded-md px-2 py-0.5", lineTone[line.kind])}>
        <span aria-hidden="true" className="w-3 shrink-0 select-none text-center opacity-70">
         {marker[line.kind]}
        </span>
        <span className="min-w-0 whitespace-pre-wrap break-words">
         {line.parts.map((part, partIndex) => (
          <span key={partIndex} className={partTone[part.kind]}>
           {part.text}
          </span>
         ))}
        </span>
       </div>
      ) : null}
     </li>
    ))}
   </ol>
  </div>
 );
}
