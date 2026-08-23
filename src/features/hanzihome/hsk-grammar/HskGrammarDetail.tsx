"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import {
 HanziAwareText,
 HanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import { HskGrammarExamples } from "./HskGrammarExamples";
import type { HskGrammarDataset, HskGrammarItem } from "./hsk-grammar.schemas";

function SectionTitle({ children }: { children: string }) {
 return (
  <Typography as="h2" variant="sectionTitle" weight="black">
   {children}
  </Typography>
 );
}

function TextList({ items }: { items: string[] }) {
 if (items.length === 0) return null;

 return (
  <ul className="grid gap-2 pl-5">
   {items.map((text, index) => (
    <li key={`${index}-${text.slice(0, 24)}`} className="list-disc marker:text-text-muted">
     <HanziAwareText as="div" text={text} variant="bodySmall" tone="default" />
    </li>
   ))}
  </ul>
 );
}

export function HskGrammarDetail({
 dataset,
 item,
 previousItem,
 nextItem,
 onNavigate,
}: {
 dataset: HskGrammarDataset;
 item: HskGrammarItem;
 previousItem: HskGrammarItem | null;
 nextItem: HskGrammarItem | null;
 onNavigate: (itemId: string) => void;
}) {
 const t = useTranslations("HskGrammar");

 return (
  <div className="grid min-w-0 gap-4">
   <Card variant="section" padding="lg" className="grid min-w-0 gap-5">
    <div className="grid min-w-0 gap-3">
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Badge variant="accent" casing="natural">
       {item.level}
      </Badge>
      <Typography variant="caption" tone="muted" weight="bold">
       #{item.source_no}
      </Typography>
      {item.categories.map((category) => (
       <Badge key={category} variant="default" size="sm" casing="natural">
        {category}
       </Badge>
      ))}
     </div>

     <HanziAwareText
      as="h1"
      text={item.title_vi}
      variant="pageTitle"
      tone="default"
      weight="black"
      leading="tight"
     />

     {item.focus.length > 0 ? (
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
       {item.focus.map((focus) => (
        <HanziText key={focus} size="large" variant="body" weight="bold">
         {focus}
        </HanziText>
       ))}
      </div>
     ) : null}
    </div>

    <Separator />

    <section className="grid min-w-0 gap-3">
     <SectionTitle>{t("sections.core")}</SectionTitle>
     <HanziAwareText text={item.core} variant="body" tone="default" leading="relaxed" />
    </section>

    {item.structures.length > 0 ? (
     <>
      <Separator />
      <section className="grid min-w-0 gap-3">
       <SectionTitle>{t("sections.structures")}</SectionTitle>
       <div className="grid gap-2">
        {item.structures.map((structure) => (
         <Card key={structure} variant="subtle" padding="sm">
          <HanziAwareText
           as="code"
           text={structure}
           variant="bodySmall"
           tone="default"
           weight="bold"
          />
         </Card>
        ))}
       </div>
      </section>
     </>
    ) : null}

    {item.usage_notes.length > 0 || item.constraints.length > 0 ? (
     <>
      <Separator />
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
       {item.usage_notes.length > 0 ? (
        <section className="grid min-w-0 content-start gap-3">
         <SectionTitle>{t("sections.usage")}</SectionTitle>
         <TextList items={item.usage_notes} />
        </section>
       ) : null}

       {item.constraints.length > 0 ? (
        <section className="grid min-w-0 content-start gap-3">
         <SectionTitle>{t("sections.constraints")}</SectionTitle>
         <TextList items={item.constraints} />
        </section>
       ) : null}
      </div>
     </>
    ) : null}

    {item.contrasts.length > 0 ? (
     <>
      <Separator />
      <section className="grid min-w-0 gap-3">
       <SectionTitle>{t("sections.contrasts")}</SectionTitle>
       <div className="grid gap-3">
        {item.contrasts.map((contrast, index) => (
         <div key={`${contrast.with ?? "contrast"}-${index}`} className="grid min-w-0 gap-1">
          {contrast.with ? (
           <HanziText size="medium" variant="bodySmall" weight="bold">
            {contrast.with}
           </HanziText>
          ) : null}
          <HanziAwareText
           text={contrast.summary_vi}
           variant="bodySmall"
           tone="default"
           leading="relaxed"
          />
         </div>
        ))}
       </div>
      </section>
     </>
    ) : null}

    {item.common_errors.length > 0 ? (
     <>
      <Separator />
      <section className="grid min-w-0 gap-3">
       <SectionTitle>{t("sections.errors")}</SectionTitle>
       <div className="grid gap-4">
        {item.common_errors.map((error, index) => (
         <div key={`${index}-${error.wrong.slice(0, 24)}`} className="grid min-w-0 gap-2">
          <div className="grid min-w-0 gap-1 sm:grid-cols-2 sm:gap-3">
           <div className="grid min-w-0 gap-1">
            <Typography variant="overline" tone="danger" weight="black">
             ✕
            </Typography>
            <HanziAwareText text={error.wrong} variant="bodySmall" tone="danger" />
           </div>
           <div className="grid min-w-0 gap-1">
            <Typography variant="overline" tone="success" weight="black">
             ✓
            </Typography>
            <HanziAwareText text={error.right} variant="bodySmall" tone="default" />
           </div>
          </div>
          <HanziAwareText
           text={error.explanation_vi}
           variant="bodySmall"
           tone="muted"
           leading="relaxed"
          />
         </div>
        ))}
       </div>
      </section>
     </>
    ) : null}

    <Separator />

    <section className="grid min-w-0 gap-3">
     <SectionTitle>{t("sections.examples")}</SectionTitle>
     <HskGrammarExamples key={item.id} item={item} />
    </section>

    <Separator />

    <section className="grid min-w-0 gap-3">
     <SectionTitle>{t("sections.source")}</SectionTitle>
     <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <div className="grid gap-1">
       <Typography variant="overline" tone="muted" weight="black">
        {t("source.primary")}
       </Typography>
       <HanziAwareText text={item.source_ref.primary} variant="bodySmall" tone="default" />
      </div>
      <div className="grid gap-1">
       <Typography variant="overline" tone="muted" weight="black">
        {t("source.verification")}
       </Typography>
       <Typography variant="bodySmall" tone="success" weight="bold">
        {t("source.reviewed")}
       </Typography>
      </div>
      <div className="grid gap-1">
       <Typography variant="overline" tone="muted" weight="black">
        {t("source.grammarNo")}
       </Typography>
       <Typography variant="bodySmall">{item.source_ref.grammar_no}</Typography>
      </div>
      <div className="grid gap-1">
       <Typography variant="overline" tone="muted" weight="black">
        {t("source.pdfPage")}
       </Typography>
       <Typography variant="bodySmall">{item.source_ref.pdf_page}</Typography>
      </div>
     </div>
     <HanziAwareText
      text={item.verification.notes}
      variant="caption"
      tone="muted"
      leading="relaxed"
     />
     <HanziAwareText text={dataset.level_basis} variant="caption" tone="muted" leading="relaxed" />
    </section>
   </Card>

   <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
    <Button
     type="button"
     variant="outline"
     disabled={!previousItem}
     onClick={() => previousItem && onNavigate(previousItem.id)}
    >
     <ArrowLeft data-icon="inline-start" />
     {t("actions.previous")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={!nextItem}
     onClick={() => nextItem && onNavigate(nextItem.id)}
    >
     {t("actions.next")}
     <ArrowRight data-icon="inline-end" />
    </Button>
   </div>
  </div>
 );
}
