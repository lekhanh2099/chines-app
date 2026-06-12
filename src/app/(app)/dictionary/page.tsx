import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BookOpen, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

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
 ai_analysis: z.unknown().nullable().optional(),
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

function isMissingTableError(code: string | undefined) {
 return code === "42P01" || code === "PGRST205";
}

function getErrorCode(error: unknown) {
 if (typeof error === "object" && error !== null && "code" in error) {
  const code = (error as { code?: unknown }).code;

  return typeof code === "string" ? code : undefined;
 }

 return undefined;
}

function getMeaningFromAnalysis(value: unknown) {
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
  .passthrough()
  .safeParse(value);

 if (!parsed.success) {
  return { meaning: "", hanViet: "" };
 }

 const firstDefinition = parsed.data.definitions?.find((item) => item.meaning || item.text);

 return {
  meaning: parsed.data.meaning_summary || firstDefinition?.meaning || firstDefinition?.text || "",
  hanViet: parsed.data.sino_vietnamese || parsed.data.han_viet || "",
 };
}

function normalizeProgressRows(data: unknown[], legacy: boolean): ProgressRow[] {
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

 return progressRows.map((progress) => {
  const vocab = vocabById.get(progress.vocab_id);
  const dictionary = progress.dictionary_id ? dictionaryById.get(progress.dictionary_id) : null;
  const analysis = getMeaningFromAnalysis(dictionary?.ai_analysis);

  return {
   id: progress.vocab_id,
   dictionaryId: progress.dictionary_id || undefined,
   hanzi: dictionary?.headword || vocab?.hanzi || progress.vocab_id,
   pinyin: dictionary?.pinyin || vocab?.pinyin || "",
   hanViet: dictionary?.sino_vietnamese || vocab?.sino_vietnamese || analysis.hanViet || "",
   meaning: analysis.meaning || vocab?.meaning || "",
   level: progress.proficiency_level ?? 0,
   saved: progress.is_favorited ?? true,
   note: progress.personal_note || "",
   updatedAt: progress.updated_at || "",
  };
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

export default async function DictionarySrsPage({ searchParams }: DictionarySrsPageProps) {
 const resolvedSearchParams = await searchParams;
 const query = (resolvedSearchParams?.q ?? "").trim().toLocaleLowerCase("vi-VN");
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  redirect("/login");
 }

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
  new Set(progressRows.map((row) => row.dictionary_id).filter(Boolean)),
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
 const savedItems = buildSavedItems({
  progressRows,
  vocabRows,
  dictionaryRows,
 }).filter((item) => matchesQuery(item, query));

 return (
  <main className="hanzihome-static-page">
   <div className="grid gap-4">
    <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
     <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-1">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">SRS từ vựng</p>
       <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
        Kho ôn tập từ đã lưu
       </h1>
       <p className=" font-semibold text-text-muted">
        Danh sách từ đã bấm lưu từ tra từ điển hoặc inspector.
       </p>
      </div>

      <div className="flex flex-wrap gap-2">
       <Badge variant="accent">{savedItems.length} từ</Badge>
       <Link
        href="/hanzihome/vocab"
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-border-default bg-bg-subtle px-3  font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
       >
        <BookOpen className="h-4 w-4" />
        Tổng hợp từ
       </Link>
      </div>
     </div>
    </Card>

    <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
     <form className="flex min-w-0 items-center gap-2 rounded-xl border border-border-default bg-bg-input px-3">
      <Search className="h-4 w-4 text-text-muted" />
      <input
       name="q"
       defaultValue={resolvedSearchParams?.q ?? ""}
       placeholder="Tìm Hán tự, pinyin, Hán Việt, nghĩa..."
       className="h-11 min-w-0 flex-1 bg-transparent  font-semibold text-text-primary outline-none placeholder:text-text-muted"
      />
      <button
       type="submit"
       className="rounded-lg bg-bg-inverse px-3 py-1.5 text-xs font-black text-text-inverse"
      >
       Tìm
      </button>
     </form>
    </Card>

    {missingSchema && (
     <Card className="rounded-xl border border-warning/30 bg-warning-subtle">
      <p className=" font-bold text-warning-text">
       Chưa thấy bảng SRS từ vựng trong database hiện tại. Cần migration cho `user_vocab_progress`
       trước khi route này có dữ liệu.
      </p>
     </Card>
    )}

    {!missingSchema && savedItems.length === 0 && (
     <Card className="rounded-xl border border-dashed border-border-default bg-bg-card">
      <div className="grid place-items-center gap-3 py-10 text-center">
       <Sparkles className="h-8 w-8 text-text-muted" />
       <div className="grid gap-1">
        <h2 className="text-xl font-black text-text-primary">Chưa có từ trong SRS</h2>
        <p className=" font-semibold text-text-muted">
         Mở một từ ở từ điển rồi bấm “Lưu vào SRS” để thêm vào kho ôn.
        </p>
       </div>
      </div>
     </Card>
    )}

    {savedItems.length > 0 && (
     <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {savedItems.map((item) => (
       <Link
        key={`${item.id}:${item.dictionaryId ?? "legacy"}`}
        href={`/dictionary/${encodeURIComponent(item.hanzi)}`}
        className="grid gap-3 rounded-xl border border-border-default bg-bg-card p-4 shadow-theme-sm transition-colors hover:border-border-hover hover:bg-bg-elevated"
       >
        <div className="flex items-start justify-between gap-3">
         <div className="min-w-0">
          <h2
           className="font-hanzi text-3xl font-black leading-none text-text-primary"
           lang="zh-CN"
          >
           {item.hanzi}
          </h2>
          <p className="mt-1 truncate  font-black text-accent-text">
           {item.pinyin || "Chưa có pinyin"}
          </p>
         </div>
         <Badge variant={item.saved ? "success" : "default"}>{getLevelLabel(item.level)}</Badge>
        </div>

        <div className="grid gap-1 text-sm">
         {item.hanViet && (
          <p className="font-black uppercase tracking-wide text-text-primary">{item.hanViet}</p>
         )}
         <p className="line-clamp-2 font-semibold text-text-secondary">
          {item.meaning || "Chưa có nghĩa phù hợp"}
         </p>
         {item.note && (
          <p className="line-clamp-2 rounded-lg bg-bg-subtle px-2.5 py-2 text-xs font-bold text-text-muted">
           {item.note}
          </p>
         )}
        </div>
       </Link>
      ))}
     </section>
    )}
   </div>
  </main>
 );
}
