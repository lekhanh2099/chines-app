"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BookOpen, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VocabWritingCue } from "@/features/hanzihome/components/VocabWritingCue";
import { SaveMemoryTipButton } from "@/features/hanzihome/memory-tips/SaveMemoryTipButton";
import type {
 HanziHomeVocabItem,
 LearningStatus,
} from "@/features/hanzihome/types";
import type {
 CharacterAnalysis,
 Collocation,
 Comparison,
 CultureNote,
 Meaning,
 Warning,
 WordFormation,
} from "@/features/hanzihome/static-json/schemas/vocab.schema";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

type SectionView =
 | "all"
 | "meaning"
 | "etymology"
 | "comparisons"
 | "examples"
 | "notes";

const sectionShortcutTabs: Array<{
 key: SectionView;
 label: string;
 shortcut: string;
}> = [
 { key: "all", label: "Tất cả", shortcut: "1" },
 { key: "examples", label: "Ví dụ", shortcut: "5" },
 { key: "meaning", label: "Nghĩa", shortcut: "2" },
 { key: "comparisons", label: "So sánh", shortcut: "4" },
];

function isTypingTarget(element: Element | null) {
 return (
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement ||
  element?.getAttribute("role") === "textbox" ||
  Boolean(element?.closest("[contenteditable='true'], [data-editor-root]"))
 );
}

function hasText(value: string | undefined) {
 return Boolean(value?.trim());
}

function hasMeaningContent(meaning: Meaning) {
 return [
  meaning.short_definition_vi,
  meaning.meaning_vi,
  meaning.meaning_en,
  meaning.textbook_focus_vi,
  meaning.register_vi,
  meaning.usage_domain_vi,
  ...meaning.natural_translations_vi,
  ...meaning.notes.map((note) => note.text_vi),
 ].some(hasText);
}

function hasWordFormationContent(formation: WordFormation) {
 return (
  formation.characters.length > 0 ||
  [
   formation.word_logic_vi,
   formation.memory_tip_vi,
   formation.warning_vi,
   ...formation.notes.map((note) => note.text_vi),
  ].some(hasText)
 );
}

function hasComparisonContent(comparison: Comparison) {
 return (
  comparison.near_synonyms.length > 0 ||
  comparison.antonyms.length > 0 ||
  comparison.contrast_pairs.length > 0 ||
  comparison.usage_rules.length > 0 ||
  comparison.notes.length > 0
 );
}

function hasCultureContent(culture: CultureNote | undefined) {
 return Boolean(culture && [culture.title, culture.content_vi].some(hasText));
}

function hasWarningContent(warnings: Warning[]) {
 return warnings.some((warning) =>
  [
   warning.rule_vi,
   warning.explanation_vi,
   ...warning.notes.map((note) => note.text_vi),
  ].some(hasText),
 );
}

function hasSectionInItem(item: HanziHomeVocabItem, section: SectionView) {
 if (section === "all") return true;
 if (section === "examples") return item.examples.length > 0;
 if (section === "meaning") return hasMeaningContent(item.meaning);
 if (section === "etymology")
  return hasWordFormationContent(item.word_formation);
 if (section === "comparisons") return hasComparisonContent(item.comparison);
 if (section === "notes") {
  return (
   hasCultureContent(item.culture_note) ||
   hasWarningContent(item.warnings) ||
   item.notes.length > 0
  );
 }

 return false;
}

type VocabDetailPanelProps = {
 word: HanziHomeVocabItem | null;
 status: LearningStatus;
 bookmarked: boolean;
 onBookmark: () => void;
 lessonId?: string;
 onMarkStatus: (status: LearningStatus) => void;
};

export function VocabDetailPanel({
 word,
 bookmarked,
 onBookmark,
 lessonId,
}: VocabDetailPanelProps) {
 const [sectionView, setSectionView] = useState<SectionView>("all");

 useEffect(() => {
  if (!word) return;

  const availableTabs = sectionShortcutTabs.filter((item) => {
   return hasSectionInItem(word, item.key);
  });

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
   }

   if (isTypingTarget(document.activeElement)) return;

   const nextTab = availableTabs.find((item) => item.shortcut === event.key);

   if (!nextTab) return;

   event.preventDefault();
   setSectionView(nextTab.key);
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
   window.removeEventListener("keydown", handleKeyDown);
  };
 }, [word]);

 if (!word) {
  return (
   <Card
    padding="lg"
    className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
   >
    <p className="text-sm font-semibold text-text-muted">
     Chọn một từ để xem chi tiết.
    </p>
   </Card>
  );
 }

 const sectionTabs = [...sectionShortcutTabs].filter((item) => {
  return hasSectionInItem(word, item.key);
 });
 const effectiveSectionView = sectionTabs.some(
  (item) => item.key === sectionView,
 )
  ? sectionView
  : "all";

 return (
  <article className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
   <div className="grid min-w-0 gap-4">
    <Card
     padding="lg"
     className="rounded-2xl border border-border-default bg-bg-primary shadow-theme-sm"
    >
     <div className="grid gap-4">
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,46rem)]">
       <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-3">
         <h2 className="text-6xl font-black leading-none tracking-normal text-text-primary">
          {word.hanzi}
         </h2>

         <p className="text-xl font-black text-accent-text">{word.pinyin}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
         {word.pos.raw_vi && <Badge variant="info">{word.pos.raw_vi}</Badge>}

         {word.level_tag !== "unknown" && (
          <Badge variant="danger">{word.level_tag}</Badge>
         )}
         <Button
          variant={bookmarked ? "default" : "outline"}
          onClick={onBookmark}
         >
         <Bookmark className="h-4 w-4" />
         {bookmarked ? "Đã lưu" : "Lưu"}
        </Button>

        <SaveMemoryTipButton
         payload={{
          tipType: "vocab",
          title: `${word.hanzi} · ${word.pinyin}`,
          body: `${word.meaning.hanviet} · ${getVocabDisplayMeaning(word)}`,
          exampleZh: word.examples[0]?.zh,
          examplePinyin: word.examples[0]?.pinyin,
          exampleVi: word.examples[0]?.vi,
          sourceType: "vocab",
          sourceLessonId: lessonId,
          sourceItemId: word.runtimeId,
          sourceLabel: word.hanzi,
          tags: ["vocab", word.category, ...word.tags].filter(Boolean),
          weight: 2,
         }}
        />
        </div>

        <p className="mt-2 max-w-2xl text-base font-black leading-relaxed text-text-secondary">
         {word.meaning.hanviet} · {getVocabDisplayMeaning(word)}
        </p>
       </div>

       <div className="min-w-0 overflow-x-auto rounded-xl border border-border-default bg-bg-subtle p-3">
        <div className="w-max min-w-full">
         <WordFormationSection formation={word.word_formation} />
        </div>
       </div>
      </div>

      <nav
       className="flex gap-2 overflow-x-auto pb-1"
       aria-label="Điều hướng phần từ vựng"
      >
       {sectionTabs.map((item) => (
        <Button
         key={item.key}
         type="button"
         onClick={() => setSectionView(item.key)}
         variant={item.key === effectiveSectionView ? "default" : "outline"}
        >
         <span>{item.label}</span>
         <kbd className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-[0.65rem] font-black text-text-muted">
          {item.shortcut}
         </kbd>
        </Button>
       ))}
      </nav>
     </div>
    </Card>

    <div className="grid gap-4">
     <StructuredVocabSections
      item={word}
      sectionView={effectiveSectionView}
      keyword={word.hanzi}
     />
    </div>
   </div>

   <aside className="grid gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
    <VocabWritingCue word={word} size={168} compact autoPlay />
    {hasCultureContent(word.culture_note) && (
     <CultureSection culture={word.culture_note} />
    )}
    {hasWarningContent(word.warnings) && (
     <WarningSection warnings={word.warnings} />
    )}
   </aside>
  </article>
 );
}

function StructuredVocabSections({
 item,
 sectionView,
 keyword,
}: {
 item: HanziHomeVocabItem;
 sectionView: SectionView;
 keyword: string;
}) {
 const show = (section: SectionView) =>
  sectionView === "all" || sectionView === section;

 return (
  <>
   {show("examples") && item.examples.length > 0 && (
    <StructuredExamplesSection item={item} keyword={keyword} />
   )}
   {show("meaning") && hasMeaningContent(item.meaning) && (
    <MeaningSection meaning={item.meaning} />
   )}
   {show("comparisons") && hasComparisonContent(item.comparison) && (
    <ComparisonSection comparison={item.comparison} />
   )}
   {show("all") && item.collocations.length > 0 && (
    <CollocationSection collocations={item.collocations} />
   )}
   {show("notes") && hasCultureContent(item.culture_note) && (
    <CultureSection culture={item.culture_note} />
   )}
   {show("notes") && hasWarningContent(item.warnings) && (
    <WarningSection warnings={item.warnings} />
   )}
  </>
 );
}

function MeaningSection({ meaning }: { meaning: Meaning }) {
 return (
  <ReadingSection id="vocab-meaning" title="Nghĩa">
   <div className="grid gap-2">
    {meaning.short_definition_vi && (
     <p className="text-lg font-black text-text-primary">
      {meaning.short_definition_vi}
     </p>
    )}
    <p>{meaning.meaning_vi}</p>
    {meaning.natural_translations_vi.length > 0 && (
     <p>Tự nhiên: {meaning.natural_translations_vi.join(", ")}</p>
    )}
    {meaning.textbook_focus_vi && <p>{meaning.textbook_focus_vi}</p>}
    {meaning.register_vi && <p>Sắc thái: {meaning.register_vi}</p>}
    {meaning.usage_domain_vi && <p>Phạm vi dùng: {meaning.usage_domain_vi}</p>}
    {meaning.notes.map((note) => (
     <p key={note.text_vi}>{note.text_vi}</p>
    ))}
   </div>
  </ReadingSection>
 );
}

function WordFormationSection({ formation }: { formation: WordFormation }) {
 return (
  <div className="flex gap-3">
   {formation.characters.map((character) => (
    <CharacterAnalysisCard key={character.hanzi} character={character} />
   ))}
  </div>
 );
}

function CharacterAnalysisCard({
 character,
}: {
 character: CharacterAnalysis;
}) {
 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <div className="flex flex-wrap items-center gap-2">
    <span className="text-3xl font-black text-text-primary">
     {character.hanzi}
    </span>
    {character.lishu_vi && (
     <span className="font-bold text-accent-text">{character.lishu_vi}</span>
    )}
    {character.main_radical && (
     <span className="rounded-full bg-bg-subtle px-2 py-1 text-xs font-black text-text-muted">
      {[
       character.main_radical.radical_name_vi,
       character.main_radical.radical_variant || character.main_radical.radical,
      ]
       .filter(Boolean)
       .join(" · ")}
     </span>
    )}
   </div>

   {character.modern_meaning_vi && <p>{character.modern_meaning_vi}</p>}
   {character.modern_logic_vi && <p>{character.modern_logic_vi}</p>}
   {character.structure_note_vi && (
    <p className="text-sm text-text-muted">{character.structure_note_vi}</p>
   )}

   {character.components.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {character.components.map((component) => (
      <span
       key={`${character.hanzi}-${component.text}-${component.meaning_vi}`}
       className="rounded-lg border border-border-default px-2 py-1 text-sm font-semibold"
      >
       {[
        component.text,
        component.hanviet,
        component.meaning_vi,
        component.position_vi,
       ]
        .filter(Boolean)
        .join(" · ")}
      </span>
     ))}
    </div>
   )}
  </div>
 );
}

function ComparisonSection({ comparison }: { comparison: Comparison }) {
 return (
  <ReadingSection id="vocab-comparisons" title="So sánh / phân biệt">
   <div className="grid gap-3">
    {comparison.near_synonyms.length > 0 && (
     <ComparisonGroup
      title="Gần nghĩa"
      rows={comparison.near_synonyms.map((entry) => ({
       key: entry.word,
       title: entry.word,
       body: entry.difference_vi || entry.meaning_vi,
       example: entry.example_zh || entry.example_vi,
      }))}
     />
    )}
    {comparison.antonyms.length > 0 && (
     <ComparisonGroup
      title="Trái nghĩa"
      rows={comparison.antonyms.map((entry) => ({
       key: entry.word,
       title: entry.word,
       body: entry.difference_vi || entry.meaning_vi,
       example: entry.example_zh || entry.example_vi,
      }))}
     />
    )}
    {comparison.contrast_pairs.length > 0 && (
     <ComparisonGroup
      title="Cặp dễ nhầm"
      rows={comparison.contrast_pairs.map((entry) => ({
       key: `${entry.left}-${entry.right}`,
       title: `${entry.left} / ${entry.right}`,
       body: entry.meaning_vi || entry.note_vi,
      }))}
     />
    )}
    {comparison.usage_rules.map((rule) => (
     <p key={rule}>{rule}</p>
    ))}
   </div>
  </ReadingSection>
 );
}

function ComparisonGroup({
 title,
 rows,
}: {
 title: string;
 rows: Array<{ key: string; title: string; body?: string; example?: string }>;
}) {
 return (
  <div className="grid gap-2">
   <h4 className="text-sm font-black uppercase tracking-wide text-text-muted">
    {title}
   </h4>
   <div className="grid gap-2">
    {rows.map((row) => (
     <div
      key={row.key}
      className="rounded-xl border border-border-default bg-bg-primary p-3"
     >
      <p className="font-black text-text-primary">{row.title}</p>
      {row.body && <p>{row.body}</p>}
      {row.example && <p className="text-sm text-text-muted">{row.example}</p>}
     </div>
    ))}
   </div>
  </div>
 );
}

function CollocationSection({ collocations }: { collocations: Collocation[] }) {
 return (
  <ReadingSection id="vocab-collocations" title="Kết hợp thường gặp">
   <div className="grid gap-2">
    {collocations.map((collocation) => (
     <div
      key={collocation.id}
      className="rounded-xl border border-border-default bg-bg-primary p-3"
     >
      <p className="font-black text-text-primary">{collocation.zh}</p>
      {collocation.pinyin && (
       <p className="text-sm italic text-text-muted">{collocation.pinyin}</p>
      )}
      {collocation.vi && <p>{collocation.vi}</p>}
      {collocation.pattern && (
       <p className="text-sm font-semibold text-accent-text">
        {collocation.pattern}
       </p>
      )}
      {collocation.note_vi && (
       <p className="text-sm text-text-muted">{collocation.note_vi}</p>
      )}
     </div>
    ))}
   </div>
  </ReadingSection>
 );
}

function StructuredExamplesSection({
 item,
 keyword,
}: {
 item: HanziHomeVocabItem;
 keyword: string;
}) {
 return (
  <section
   id="vocab-examples"
   className="grid gap-4 rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
  >
   <h3 className="flex items-center gap-2 text-lg font-black text-text-primary">
    <BookOpen className="h-5 w-5 text-accent-text" />
    Ví dụ
   </h3>

   <div className="grid gap-3">
    {item.examples.map((example, index) => (
     <div
      key={example.id}
      className={[
       "grid gap-2 rounded-xl border p-4",
       index === 0
        ? "border-accent/30 bg-bg-subtle shadow-theme-sm"
        : "border-border-default bg-bg-primary",
      ].join(" ")}
     >
      <div className="border-l-4 border-accent pl-4">
       <p className="font-black leading-relaxed text-text-primary text-2xl">
        {renderHighlightedText(example.zh, keyword)}
       </p>
       {example.pinyin && (
        <p className="text-sm font-bold italic leading-relaxed text-text-muted">
         {example.pinyin}
        </p>
       )}
       <p className="text-sm font-semibold leading-relaxed text-text-secondary">
        {example.vi}
       </p>
      </div>

      {example.analysis_vi && (
       <p className="border-t border-border-default pt-2 text-sm leading-relaxed text-accent-text">
        {example.analysis_vi}
       </p>
      )}
     </div>
    ))}
   </div>
  </section>
 );
}

function CultureSection({ culture }: { culture: CultureNote | undefined }) {
 if (!culture) return null;

 return (
  <ReadingSection id="vocab-culture" title={culture.title || "Văn hóa"}>
   {culture.content_vi && <p>{culture.content_vi}</p>}
  </ReadingSection>
 );
}

function WarningSection({ warnings }: { warnings: Warning[] }) {
 return (
  <ReadingSection id="vocab-notes" title="Lưu ý lỗi sai">
   <div className="grid gap-3">
    {warnings.map((warning) => (
     <div
      key={warning.id}
      className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3"
     >
      {warning.rule_vi && (
       <p className="font-black text-text-primary">{warning.rule_vi}</p>
      )}
      {warning.explanation_vi && <p>{warning.explanation_vi}</p>}
      {warning.wrong_examples.map((example) => (
       <p key={`wrong-${example.zh}`} className="text-danger">
        Sai: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </p>
      ))}
      {warning.correct_examples.map((example) => (
       <p key={`correct-${example.zh}`} className="text-success">
        Đúng: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </p>
      ))}
      {warning.natural_examples.map((example) => (
       <p key={`natural-${example.zh}`}>
        Tự nhiên: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </p>
      ))}
     </div>
    ))}
   </div>
  </ReadingSection>
 );
}

function renderHighlightedText(text: string, keyword: string) {
 if (!keyword || !text.includes(keyword)) return text;

 return text.split(keyword).map((part, index, parts) => (
  <span key={`${part}-${index}`}>
   {part}
   {index < parts.length - 1 && (
    <mark className="bg-transparent font-black text-accent-text">
     {keyword}
    </mark>
   )}
  </span>
 ));
}

function ReadingSection({
 id,
 title,
 children,
}: {
 id: string;
 title: string;
 children: ReactNode;
}) {
 return (
  <details
   id={id}
   open
   className="group rounded-xl border border-border-default bg-bg-subtle p-4"
  >
   <summary className="cursor-pointer text-base font-black text-text-primary">
    {title}
   </summary>
   <div className="grid gap-3 text-base leading-relaxed text-text-secondary">
    {children}
   </div>
  </details>
 );
}
