import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import {
 HanziAwareText,
 HanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function DailyReadingGrammarPanel({
 grammarItems,
}: {
 grammarItems: ReadonlyArray<GrammarViewModel>;
}) {
 if (grammarItems.length === 0) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Bài này chưa có mục ngữ pháp riêng.
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-4">
   {grammarItems.map((grammar, index) => {
    const evidence = grammar.examplesParsed[0];
    const pattern = grammar.title || grammar.cleanTitle;

    return (
     <Card key={grammar.id} variant="section" padding="md" className="grid min-w-0 gap-4">
      <div className="flex min-w-0 items-center gap-3">
       <Badge variant="warning" casing="natural">
        {index + 1}
       </Badge>
       <HanziAwareText
        as="h2"
        text={pattern}
        variant="sectionTitle"
        weight="black"
        wrapping="breakWords"
       />
      </div>

      <Typography variant="bodySmall" tone="muted" leading="relaxed">
       {grammar.core}
      </Typography>

      {evidence?.zh ? (
       <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
        <Separator orientation="vertical" decorative />
        <HanziText as="p" size="large" leading="relaxed" wrapping="breakWords">
         {evidence.zh}
        </HanziText>
       </div>
      ) : null}

      {evidence?.zh ? (
       <Typography
        variant="caption"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        Câu dẫn chứng nằm trong bài đọc
       </Typography>
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}
