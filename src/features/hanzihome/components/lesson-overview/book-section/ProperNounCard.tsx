import type { JsonFieldValue } from "@/types/json";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { RawDataDetails } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { properNounBackText, properNounFrontText, stringList } from "./proper-noun-utils";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { HanziText, PinyinText, TranslationText } from "../hanzi-typography";

export function ProperNounCard({
 item,
 displayMode,
 debugMode,
}: {
 item: JsonFieldValue;
 displayMode: LessonDisplayMode;
 debugMode: boolean;
}) {
 const record = asRecord(item);
 const flashcard = asRecord(record.flashcard);

 const hanzi = properNounFrontText(record);
 const pinyin = stringValue(record, "pinyin");
 const meaning = properNounBackText(record);
 const pos = stringValue(record, "pos");
 const posDetail = asRecord(record.pos_detail);
 const posDetailVi = stringValue(posDetail, "vi");
 const tags = stringList(record.tags);
 const modes = stringList(flashcard.modes);

 return (
  <Card asChild variant="section" padding="md">
   <article className="grid gap-3">
    <div className="grid gap-1">
     {hanzi ? (
      <div className="flex items-center gap-1.5">
       <HanziText as="h4" size="card" weight="black" leading="none">
        {hanzi}
       </HanziText>
       <MandarinSpeakButton text={hanzi} />
      </div>
     ) : null}

     {displayMode.showPinyin && pinyin ? (
      <PinyinText as="p" tone="accent" weight="black">
       {pinyin}
      </PinyinText>
     ) : null}

     {displayMode.showMeaning && meaning ? (
      <TranslationText as="p" weight="semibold" leading="relaxed">
       {meaning}
      </TranslationText>
     ) : null}
    </div>

    {pos || posDetailVi ? (
     <div className="flex flex-wrap gap-2">
      {pos ? <Badge>{pos}</Badge> : null}
      {posDetailVi && posDetailVi !== pos ? <Badge>{posDetailVi}</Badge> : null}
     </div>
    ) : null}

    {tags.length > 0 ? (
     <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
       <Badge key={tag} variant="accent">
        {tag.replaceAll("_", " ")}
       </Badge>
      ))}
     </div>
    ) : null}

    {modes.length > 0 ? (
     <Card asChild variant="subtle" padding="sm">
      <details>
       <summary className="cursor-pointer">
        <Typography
         as="span"
         variant="overline"
         tone="muted"
         weight="black"
         tracking="wide"
         transform="uppercase"
        >
         Flashcard modes
        </Typography>
       </summary>
       <div className="mt-2 flex flex-wrap gap-2">
        {modes.map((mode) => (
         <Badge key={mode}>{mode.replaceAll("_", " → ")}</Badge>
        ))}
       </div>
      </details>
     </Card>
    ) : null}

    {debugMode && <RawDataDetails value={item} />}
   </article>
  </Card>
 );
}
