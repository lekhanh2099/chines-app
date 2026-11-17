"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Chip } from "@/components/ui/actions/chip";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import { getUniqueChineseCharacters } from "@/features/dictionary/utils";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

/** Stroke order and writing practice for each character of a store word. */
export function WordStrokePanel({ hanzi }: { hanzi: string }) {
 const t = useTranslations("Inspector.store");
 const characters = getUniqueChineseCharacters(hanzi);
 const [selected, setSelected] = useState("");
 const [firstCharacter] = characters;
 if (firstCharacter === undefined) return null;
 const activeCharacter = characters.includes(selected) ? selected : firstCharacter;

 return (
  <Card asChild variant="section" padding="md">
   <aside className="grid min-w-0 content-start gap-3" aria-label={t("strokesTitle")}>
    <div className="grid gap-0.5">
     <Typography as="h2" variant="sectionTitle">
      {t("strokesTitle")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("strokesHelp")}
     </Typography>
    </div>
    {characters.length > 1 ? (
     <div className="flex flex-wrap gap-2">
      {characters.map((character) => (
       <Chip
        key={character}
        size="sm"
        pressed={activeCharacter === character}
        variant={activeCharacter === character ? "accent" : "default"}
        onClick={() => setSelected(character)}
       >
        <HanziText as="span" size="medium" leading="none">
         {character}
        </HanziText>
       </Chip>
      ))}
     </div>
    ) : null}
    <CharacterWriterCard character={activeCharacter} />
   </aside>
  </Card>
 );
}
