import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";

import type { GrammarReading } from "./grammar-reading";

export function GrammarReadingReader({ reading }: { reading: GrammarReading }) {
 return (
  <Card variant="section" padding="lg">
   <article className="grid gap-3">
    <div className="grid gap-1">
     <HanziAwareText
      text={reading.title}
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
     />
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black" tracking="normal">
      Bài đọc áp dụng
     </Typography>
    </div>

    <MarkdownContent content={reading.contentMd} className="gap-3" />
   </article>
  </Card>
 );
}
