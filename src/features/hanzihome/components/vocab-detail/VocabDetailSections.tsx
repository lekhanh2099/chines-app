import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";

import type {
 CharacterAnalysis,
 Collocation,
 Comparison,
 CultureNote,
 Meaning,
 Warning,
 WordFormation,
} from "@/features/hanzihome/static-json/schemas/vocab.schema";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import {
 EditableNodeWrapper,
 type DraftPatchPath,
} from "@/features/hanzihome/editing";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

import {
 hasComparisonContent,
 hasWordFormationContent,
} from "./content-checks";
import type { SectionView } from "./types";
import { Button } from "@/components/ui/button";

export function StructuredVocabSections({
 item,
 lessonId,
 itemPath,
 sectionView,
 keyword,
}: {
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: DraftPatchPath;
 sectionView: SectionView;
 keyword: string;
}) {
 const show = (section: SectionView) =>
  sectionView === "all" || sectionView === section;

 return (
  <>
   {show("examples") && item.examples.length > 0 && (
    <StructuredExamplesSection
     item={item}
     itemPath={itemPath}
     lessonId={lessonId}
     keyword={keyword}
    />
   )}
   {show("comparisons") && hasComparisonContent(item.comparison) && (
    <ComparisonSection comparison={item.comparison} />
   )}
   {show("etymology") && hasWordFormationContent(item.word_formation) && (
    <WordFormationDetailSection formation={item.word_formation} />
   )}

   {show("all") && item.collocations.length > 0 && (
    <CollocationSection
     collocations={item.collocations}
     item={item}
     itemPath={itemPath}
     lessonId={lessonId}
    />
   )}
  </>
 );
}

export function WordFormationPreview({
 formation,
 word,
}: {
 formation: WordFormation;
 word: HanziHomeVocabItem;
}) {
 return (
  <div className="flex flex-wrap gap-3">
   {formation.characters.map((character) => (
    <CharacterAnalysisCard
     key={character.hanzi}
     character={character}
     word={word}
    />
   ))}
  </div>
 );
}

export function WordFormationDetailSection({
 formation,
}: {
 formation: WordFormation;
}) {
 return (
  <ReadingSection id="vocab-word-formation" title="Logic / cấu tạo">
   {formation.word_logic_vi && <p>{formation.word_logic_vi}</p>}
   {formation.memory_tip_vi && <p>Mẹo nhớ: {formation.memory_tip_vi}</p>}
   {formation.warning_vi && <p>Lưu ý: {formation.warning_vi}</p>}
   {formation.notes.map((note) => (
    <p key={note.text_vi}>{note.text_vi}</p>
   ))}
  </ReadingSection>
 );
}

export function MeaningSection({ meaning }: { meaning: Meaning }) {
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

function CharacterAnalysisCard({
 character,
}: {
 character: CharacterAnalysis;
 word: HanziHomeVocabItem;
}) {
 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3 max-w-2xs">
   <div className="flex flex-wrap items-center gap-2">
    <span className="text-3xl font-black text-text-primary" lang="zh-CN">
     {character.hanzi}
    </span>
    {character.lishu_vi && (
     <span className="font-bold text-accent-text">{character.lishu_vi}</span>
    )}
    {character.main_radical && (
     <Button variant="destructive" size="xs">
      {[
       character.main_radical.radical_name_vi,
       character.main_radical.radical_variant || character.main_radical.radical,
      ]
       .filter(Boolean)
       .join(" · ")}
     </Button>
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

export function ComparisonSection({ comparison }: { comparison: Comparison }) {
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

function CollocationSection({
 collocations,
 item,
 lessonId,
 itemPath,
}: {
 collocations: Collocation[];
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: DraftPatchPath;
}) {
 return (
  <ReadingSection id="vocab-collocations" title="Kết hợp thường gặp">
   <div className="grid gap-2">
    {collocations.map((collocation, index) => {
     const content = (
      <div className="rounded-xl border border-border-default bg-bg-primary p-3">
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
     );

     if (!lessonId || !itemPath || !collocation.id) {
      return <div key={collocation.id || index}>{content}</div>;
     }

     return (
      <EditableNodeWrapper
       key={collocation.id}
       lessonId={lessonId}
       entityType="vocab_detail_section"
       entityId={collocation.id}
       parentEntityType="vocab_item"
       parentEntityId={getVocabItemKey(item)}
       path={[...itemPath, "collocations", index]}
       value={collocation}
       label={collocation.zh}
      >
       {content}
      </EditableNodeWrapper>
     );
    })}
   </div>
  </ReadingSection>
 );
}

function StructuredExamplesSection({
 item,
 lessonId,
 itemPath,
 keyword,
}: {
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: DraftPatchPath;
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
    {item.examples.map((example, index) => {
     const content = (
      <div
       className={[
        "grid gap-2 rounded-xl border p-4",
        index === 0
         ? "border-accent/30 bg-bg-subtle shadow-theme-sm"
         : "border-border-default bg-bg-primary",
       ].join(" ")}
      >
       <div className="border-l-4 border-accent pl-4">
        <p className="text-2xl font-black leading-relaxed text-text-primary">
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
     );

     if (!lessonId || !itemPath || !example.id) {
      return <div key={example.id || index}>{content}</div>;
     }

     return (
      <EditableNodeWrapper
       key={example.id}
       lessonId={lessonId}
       entityType="vocab_example"
       entityId={example.id}
       parentEntityType="vocab_item"
       parentEntityId={getVocabItemKey(item)}
       path={[...itemPath, "examples", index]}
       value={example}
       label={example.zh}
      >
       {content}
      </EditableNodeWrapper>
     );
    })}
   </div>
  </section>
 );
}

export function CultureSection({
 culture,
}: {
 culture: CultureNote | undefined;
}) {
 if (!culture) return null;

 return (
  <ReadingSection id="vocab-culture" title={culture.title || "Văn hóa"}>
   {culture.content_vi && <p>{culture.content_vi}</p>}
  </ReadingSection>
 );
}

export function WarningSection({ warnings }: { warnings: Warning[] }) {
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
