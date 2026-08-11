import { BookOpen, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/server";
import { parseErrorLike, type ErrorInput } from "@/types/error";
import type { JsonFieldValue } from "@/types/json";

type DictionarySrsPageProps = {
 searchParams?: Promise<{
  q?: string;
 }>;
};

const progressRowSchema = z.object({
 vocab_id: z.string(),
 dictionary_id: z.string().nullable().optional(),
 proficiency_level: z.number().nullable().optional(),
 is_favorited: z.boolean().nullable().optional(),
 personal_note: z.string().nullable().optional(),
 personal_note_mode: z.enum(["normal", "important"]).nullable().optional(),
 updated_at: z.string().nullable().optional(),
});

const legacyProgressRowSchema = progressRowSchema.omit({
 dictionary_id: true,
 personal_note: true,
 personal_note_mode: true,
 updated_at: true,
});

const vocabRowSchema = z.object({
 id: z.string(),
 hanzi: z.string(),
 pinyin: z.string().nullable().optional(),
 sino_vietnamese: z.string().nullable().optional(),
 meaning: z.string().nullable().optional(),
});

const dictionaryRowSchema = z.object({
 id: z.string(),
 headword: z.string(),
 pinyin: z.string().nullable().optional(),
 sino_vietnamese: z.string().nullable().optional(),
 ai_analysis: z.json().nullable().optional(),
});

type ProgressRow = z.infer<typeof progressRowSchema>;
type VocabRow = z.infer<typeof vocabRowSchema>;
type DictionaryRow = z.infer<typeof dictionaryRowSchema>;

type SavedVocabItem = {
 id: string;
 dictionaryId?: string;
 hanzi: string;
 pinyin: string;
 hanViet: string;
 meaning: string;
 level: number;
 saved: boolean;
 note: string;
 updatedAt: string;
};

function isMissingTableError(code: ReturnType<typeof getErrorCode>) {
 return code === "42P01" || code === "PGRST205";
}

function getErrorCode(error: ErrorInput) {
 return parseErrorLike(error).code || undefined;
}

function getMeaningFromAnalysis(value: JsonFieldValue) {
 const parsed = z
  .object({
   meaning_summary: z.string().optional(),
   sino_vietnamese: z.string().optional(),
   han_viet: z.string().optional(),
   definitions: z
    .array(
     z.object({
      meaning: z.string().optional(),
      text: z.string().optional(),
     }),
    )
    .optional(),
  })
  .loose()
  .safeParse(value);

 if (!parsed.success) return { meaning: "", hanViet: "" };

 const firstDefinition = parsed.data.definitions?.find((item) => item.meaning || item.text);

 return {
  meaning: parsed.data.meaning_summary || firstDefinition?.meaning || firstDefinition?.text || "",
  hanViet: parsed.data.sino_vietnamese || parsed.data.han_viet || "",
 };
}

function normalizeProgressRows(data: JsonFieldValue[], legacy: boolean): ProgressRow[] {
 return data.flatMap((row) => {
  if (legacy) {
   const parsed = legacyProgressRowSchema.safeParse(row);
   if (!parsed.success) return [];

   return [
    {
     ...parsed.data,
     dictionary_id: null,
     personal_note: null,
     personal_note_mode: null,
     updated_at: null,
    },
   ];
  }

  const parsed = progressRowSchema.safeParse(row);
  return parsed.success ? [parsed.data] : [];
 });
}

function buildSavedItems({
 progressRows,
 vocabRows,
 dictionaryRows,
}: {
 progressRows: ProgressRow[];
 vocabRows: VocabRow[];
 dictionaryRows: DictionaryRow[];
}): SavedVocabItem[] {
 const vocabById = new Map(vocabRows.map((row) => [row.id, row]));
 const dictionaryById = new Map(dictionaryRows.map((row) => [row.id, row]));

 return progressRows.flatMap((progress) => {
  const vocab = vocabById.get(progress.vocab_id);
  const dictionary = progress.dictionary_id ? dictionaryById.get(progress.dictionary_id) : null;
  const hanzi = dictionary?.headword || vocab?.hanzi;

  if (!hanzi) return [];

  const analysis = getMeaningFromAnalysis(dictionary?.ai_analysis);

  return [
   {
    id: progress.vocab_id,
    dictionaryId: progress.dictionary_id || undefined,
    hanzi,
    pinyin: dictionary?.pinyin || vocab?.pinyin || "",
    hanViet: dictionary?.sino_vietnamese || vocab?.sino_vietnamese || analysis.hanViet || "",
    meaning: analysis.meaning || vocab?.meaning || "",
    level: progress.proficiency_level ?? 0,
    saved: progress.is_favorited ?? true,
    note: progress.personal_note || "",
    updatedAt: progress.updated_at || "",
   },
  ];
 });
}

function matchesQuery(item: SavedVocabItem, query: string) {
 if (!query) return true;
 const haystack = [item.hanzi, item.pinyin, item.hanViet, item.meaning, item.note].join(" ");
 return haystack.toLocaleLowerCase("vi-VN").includes(query);
}

function getLevelLabel(level: number) {
 if (level <= 0) return "Mới";
 if (level <= 2) return "Đang ôn";
 if (level <= 4) return "Tốt";
 return "Thuần thục";
}

export async function DictionarySrsPage({ searchParams }: DictionarySrsPageProps) {
 const resolvedSearchParams = await searchParams;
 const query = (resolvedSearchParams?.q ?? "").trim().toLocaleLowerCase("vi-VN");
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) redirect("/login");

 let progressRows: ProgressRow[] = [];
 let missingSchema = false;

 const progressResult = await supabase
  .from("user_vocab_progress")
  .select(
   "vocab_id, dictionary_id, proficiency_level, is_favorited, personal_note, personal_note_mode, updated_at",
  )
  .eq("user_id", user.id)
  .eq("is_favorited", true)
  .order("updated_at", { ascending: false });

 if (progressResult.error) {
  const code = getErrorCode(progressResult.error);

  if (isMissingTableError(code)) {
   missingSchema = true;
  } else {
   const fallbackResult = await supabase
    .from("user_vocab_progress")
    .select("vocab_id, proficiency_level, is_favorited")
    .eq("user_id", user.id)
    .eq("is_favorited", true);

   if (fallbackResult.error) {
    missingSchema = isMissingTableError(getErrorCode(fallbackResult.error));
   } else {
    progressRows = normalizeProgressRows(fallbackResult.data ?? [], true);
   }
  }
 } else {
  progressRows = normalizeProgressRows(progressResult.data ?? [], false);
 }

 const vocabIds = Array.from(new Set(progressRows.map((row) => row.vocab_id)));
 const dictionaryIds = Array.from(
  new Set(
   progressRows
    .map((row) => row.dictionary_id)
    .filter((dictionaryId): dictionaryId is string => Boolean(dictionaryId)),
  ),
 );

 const [vocabResult, dictionaryResult] = await Promise.all([
  vocabIds.length > 0
   ? supabase
      .from("vocabularies")
      .select("id, hanzi, pinyin, sino_vietnamese, meaning")
      .in("id", vocabIds)
   : Promise.resolve({ data: [], error: null }),
  dictionaryIds.length > 0
   ? supabase
      .from("dictionary_core")
      .select("id, headword, pinyin, sino_vietnamese, ai_analysis")
      .in("id", dictionaryIds)
   : Promise.resolve({ data: [], error: null }),
 ]);

 const vocabRows = (vocabResult.data ?? []).flatMap((row) => {
  const parsed = vocabRowSchema.safeParse(row);
  return parsed.success ? [parsed.data] : [];
 });
 const dictionaryRows = (dictionaryResult.data ?? []).flatMap((row) => {
  const parsed = dictionaryRowSchema.safeParse(row);
  return parsed.success ? [parsed.data] : [];
 });
 const savedItems = buildSavedItems({ progressRows, vocabRows, dictionaryRows }).filter((item) =>
  matchesQuery(item, query),
 );

 return (
  <PageContainer>
   <main className="grid w-full gap-5">
    <PageHeader
     eyebrow="SRS từ vựng"
     title="Kho ôn tập từ đã lưu"
     description="Tìm lại những từ đã lưu từ từ điển hoặc inspector và mở thẳng vào mục cần ôn."
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {savedItems.length} từ đang hiển thị
      </Typography>
     }
     actions={
      <Button asChild variant="outline" size="toolbar">
       <Link href="/vocab">
        <BookOpen data-icon="inline-start" />
        Tổng hợp từ
       </Link>
      </Button>
     }
    />

    <Card variant="section" padding="sm">
     <form className="flex min-w-0 items-center gap-2">
      <div className="relative min-w-0 flex-1">
       <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
       <Input
        name="q"
        defaultValue={resolvedSearchParams?.q ?? ""}
        aria-label="Tìm trong kho ôn tập từ vựng"
        placeholder="Tìm Hán tự, pinyin, Hán Việt, nghĩa..."
        density="compact"
        adornment="start"
       />
      </div>
      <Button type="submit" size="toolbar">
       Tìm
      </Button>
     </form>
    </Card>

    {missingSchema ? (
     <Card variant="subtle" padding="md">
      <Typography as="p" variant="bodySmall" tone="warning" weight="bold">
       Chưa thấy bảng SRS từ vựng trong database hiện tại. Cần migration cho
       `user_vocab_progress` trước khi route này có dữ liệu.
      </Typography>
     </Card>
    ) : null}

    {!missingSchema && savedItems.length === 0 ? (
     <EmptyState
      surface="subtle"
      size="spacious"
      icon={<Sparkles />}
      title={query ? "Không tìm thấy từ phù hợp" : "Chưa có từ trong SRS"}
      description={
       query
        ? "Thử một từ khóa khác hoặc xóa nội dung tìm kiếm."
        : "Mở một từ ở từ điển rồi bấm “Lưu vào SRS” để thêm vào kho ôn."
      }
     />
    ) : null}

    {savedItems.length > 0 ? (
     <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Từ đã lưu">
      {savedItems.map((item) => (
       <Card
        key={`${item.id}:${item.dictionaryId ?? "legacy"}`}
        asChild
        variant="interactive"
        padding="md"
       >
        <Link href={`/dictionary/${encodeURIComponent(item.hanzi)}`} className="grid gap-3">
         <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
           <LearnerHanziText
            as="h2"
            variant="sectionTitle"
            tone="default"
            weight="black"
            leading="none"
           >
            {item.hanzi}
           </LearnerHanziText>
           <Typography as="p" tone="accent" weight="black" clamp="one" className="mt-1">
            {item.pinyin || "Chưa có pinyin"}
           </Typography>
          </div>
          <Badge variant={item.saved ? "success" : "default"}>{getLevelLabel(item.level)}</Badge>
         </div>

         <div className="grid gap-1">
          {item.hanViet ? (
           <Typography
            as="p"
            variant="overline"
            tone="default"
            weight="black"
            tracking="wide"
           >
            {item.hanViet}
           </Typography>
          ) : null}
          <Typography as="p" variant="bodySmall" tone="secondary" weight="semibold" clamp="two">
           {item.meaning || "Chưa có nghĩa phù hợp"}
          </Typography>
          {item.note ? (
           <Card variant="subtle" padding="sm" className="mt-1">
            <Typography as="p" variant="caption" tone="muted" weight="bold" clamp="two">
             {item.note}
            </Typography>
           </Card>
          ) : null}
         </div>
        </Link>
       </Card>
      ))}
     </section>
    ) : null}
   </main>
  </PageContainer>
 );
}
