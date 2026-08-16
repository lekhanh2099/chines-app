"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Square } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 ReaderHanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useShadowingRecorder } from "@/features/hanzihome/reader/useShadowingRecorder";
import {
 fetchPracticeAttempts,
 savePracticeAttempt,
} from "@/features/hanzihome/practice/practice-attempt-api";
import { evaluateHumanitiesAnswer, type HumanitiesEvaluationResult } from "./humanities-evaluator";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";

import type { ReaderDocumentResource } from "@/features/hanzihome/reader/reader-content-api";
import type { ReaderDocumentRow } from "@/features/hanzihome/reader/reader.schemas";

function sourceKind(resource: ReaderDocumentResource["document"]): string {
 const value = resource.source_metadata.source_kind;
 return typeof value === "string" ? value : "humanities";
}

function courseModuleOrder(track: string, lessonIndex: number): number {
 if (track === "translation") {
  if (lessonIndex === 1) return 1;
  if (lessonIndex <= 6) return 6;
  if (lessonIndex <= 10) return 7;
  if (lessonIndex <= 15) return 8;
  return 9;
 }
 if (lessonIndex === 1) return 1;
 if (lessonIndex <= 3) return 10;
 if (lessonIndex <= 5) return 11;
 return 12;
}

function trackTitle(track: string): string {
 return track === "translation" ? "Biên dịch" : "Phiên dịch";
}

function trackDescription(track: string): string {
 return track === "translation"
  ? "Không gian thực hành dịch viết hai chiều, lưu từng lần sửa và kiểm tra theo đơn vị ý thay vì so khớp một đáp án mẫu."
  : "Không gian thực hành phiên dịch nối tiếp và dịch nhìn, ghi lại cách truyền đạt ý thay vì chỉ so khớp từng từ.";
}

const translationWorkflow: string[] = [
 "Đọc yêu cầu dịch và phân tích văn bản nguồn",
 "Đánh dấu đơn vị ý",
 "Tra cứu và lập bảng thuật ngữ",
 "Viết bản đầu không nhìn phương án tham khảo",
 "Sửa bản dịch theo bộ tiêu chí",
 "Dịch ngược và tự nhận xét",
];

const interpretingWorkflow: string[] = [
 "Nghe hoặc đọc hết đoạn và nắm thông điệp chính",
 "Ghi chú người, hành động, số liệu và quan hệ logic",
 "Truyền đạt đủ đơn vị thông tin bằng lời tự nhiên",
 "Tự đánh dấu ý đã giữ và ý còn thiếu",
 "Nghe lại bản ghi và sửa cách diễn đạt",
];

const translationFoundationLessons: string[][] = [
 [
  "Biên dịch là gì?",
  "Vì sao biết tiếng Trung chưa đồng nghĩa biết dịch?",
  "Người dịch phải hiểu thông điệp, mục đích, người đọc và viết lại bằng tiếng đích; tra nghĩa từ chỉ là một phần nhỏ.",
 ],
 [
  "Đọc yêu cầu dịch",
  "Ai sẽ đọc bản dịch và dùng nó để làm gì?",
  "Yêu cầu dịch quyết định sắc thái, mức giải thích và cách chọn từ trong bản đích.",
 ],
 [
  "Chia câu thành đơn vị ý",
  "Phải giữ những gì dù câu chữ thay đổi?",
  "Đơn vị ý gồm người, hành động, đối tượng, thời gian, nơi chốn, số liệu, phủ định và quan hệ logic.",
 ],
 [
  "Tạo bản nháp",
  "Có cần dịch từng chữ theo thứ tự không?",
  "Bản nháp nên giữ đủ ý trước; sau đó mới đổi trật tự, tách–gộp câu và chọn từ tự nhiên.",
 ],
 [
  "Tra cứu và quản lý thuật ngữ",
  "Dùng từ điển thế nào để không chọn nghĩa đầu tiên?",
  "Tra cả từ, ngữ cảnh, kết hợp từ và lĩnh vực; ghi nguồn và giữ thuật ngữ nhất quán.",
 ],
 [
  "Sửa và kiểm tra bản dịch",
  "Sửa câu trôi có đủ chưa?",
  "Kiểm tra đúng nghĩa, đủ ý, đúng logic, đúng thuật ngữ, đúng sắc thái rồi mới tới độ tự nhiên.",
 ],
];

const interpretingFoundationLessons: string[][] = [
 [
  "Phiên dịch khác biên dịch",
  "Vì sao phiên dịch cần giữ ý trước câu chữ?",
  "Phiên dịch diễn ra dưới áp lực thời gian; phải ưu tiên thông điệp, độ đủ ý và sự rõ ràng.",
 ],
 [
  "Nghe ý và ghi chú",
  "Ghi gì để không quên quan hệ giữa các ý?",
  "Ghi người, hành động, số liệu, phủ định và quan hệ logic thay vì chép nguyên câu.",
 ],
 [
  "Bắt đầu từ đoạn ngắn",
  "Làm sao tăng độ dài mà không mất ý?",
  "Tăng dần độ dài, mật độ thông tin, tốc độ và số lần nghe lại.",
 ],
 [
  "Trình bày bằng lời",
  "Nói thế nào để người nghe theo kịp?",
  "Ưu tiên câu rõ, nhịp ổn định và từ nối giúp người nghe nhận ra cấu trúc.",
 ],
 [
  "Phục hồi khi quên",
  "Làm gì khi bỏ sót một chi tiết?",
  "Giữ mạch thông điệp, đánh dấu phần chưa chắc và phục hồi sau khi hoàn thành ý chính.",
 ],
 [
  "Tự đánh giá bản ghi",
  "Dựa vào đâu để biết mình đã truyền đạt đủ?",
  "Đối chiếu từng đơn vị thông tin và nghe lại để sửa nội dung lẫn cách diễn đạt.",
 ],
];

type HumanitiesUnitMark = "kept" | "partial" | "missed" | "unsure";
const interpretingMarks: HumanitiesUnitMark[] = ["kept", "partial", "missed", "unsure"];

export function HumanitiesPracticeWorkspace({
 initialDocuments,
 initialResource,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
}) {
 const tts = useSharedMandarinTts();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [activeTrack, setActiveTrack] = useState(() =>
  searchParams.get("track") === "interpreting" ? "interpreting" : "translation",
 );
 const [directionPreference, setDirectionPreference] = useState<TranslationDirection | null>(null);
 const [activeIndex, setActiveIndex] = useState(0);
 const [drafts, setDrafts] = useState<Record<string, string>>({});
 const [backTranslations, setBackTranslations] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState<Record<string, boolean>>({});
 const [humanitiesResult, setHumanitiesResult] = useState<HumanitiesEvaluationResult | null>(null);
 const [replayCount, setReplayCount] = useState(0);
 const [preparationState, setPreparationState] = useState({ key: "", remaining: 0 });
 const [interpretingNotes, setInterpretingNotes] = useState("");
 const [learnerTranscript, setLearnerTranscript] = useState("");
 const [unitMarks, setUnitMarks] = useState<Record<string, HumanitiesUnitMark>>({});
 const [saveError, setSaveError] = useState("");
 const startedAtRef = useRef<Record<string, number>>({});
 const lastRecordingRef = useRef<Blob | null>(null);
 const recorder = useShadowingRecorder();
 const requestedDocumentId = searchParams.get("document") ?? "";
 const selectedIdValue = initialDocuments.some((document) => document.id === requestedDocumentId)
  ? requestedDocumentId
  : "";
 const resource = selectedIdValue.length > 0 ? initialResource : null;
 const selectDocument = (documentId: string) => {
  const next = new URLSearchParams(searchParams.toString());
  next.set("document", documentId);
  router.push(`${pathname}?${next.toString()}`, { scroll: false });
 };
 const clearDocument = () => {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("document");
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };
 const segments = useMemo(
  () =>
   resource?.paragraphs.map((paragraph) => ({
    id: paragraph.id,
    order: paragraph.paragraph_order,
    zh: paragraph.zh,
    pinyin: paragraph.pinyin,
    vi: paragraph.vi,
   })) ?? [],
  [resource],
 );
 const segment = segments[activeIndex];
 const evaluation = resource?.exerciseItems.find((item) => item.payload.evaluation)?.payload
  .evaluation;
 const direction = directionPreference ?? evaluation?.direction ?? "zh-vi";
 const humanitiesEvaluation =
  evaluation !== undefined && evaluation.direction === direction ? evaluation : undefined;
 const isInterpreting = humanitiesEvaluation?.mode === "interpreting";
 const preparationKey = `${segment?.id ?? ""}:${direction}`;
 const preparationLimit = isInterpreting ? (humanitiesEvaluation.preparationSeconds ?? 0) : 0;
 const preparationRemaining =
  preparationState.key === preparationKey ? preparationState.remaining : preparationLimit;
 const key = segment ? `${segment.id}:${direction}` : "";
 const historyQuery = useQuery({
  queryKey: hanzihomeQueryKeys.practiceAttempts("translation", segment?.id ?? ""),
  queryFn: () => fetchPracticeAttempts({ surface: "translation", contentId: segment?.id ?? "" }),
  enabled: segment !== undefined,
  staleTime: 0,
 });
 const draft = key ? (drafts[key] ?? "") : "";
 const backTranslation = key ? (backTranslations[key] ?? "") : "";
 const isChecked = key ? checked[key] === true : false;
 const score =
  segment && isChecked
   ? (humanitiesResult?.score ?? scoreTranslationAttempt(segment, direction, draft))
   : null;

 useEffect(() => {
  if (!isInterpreting || preparationRemaining <= 0) return;
  const timer = window.setTimeout(
   () =>
    setPreparationState((current) => ({
     key: preparationKey,
     remaining: Math.max(
      0,
      (current.key === preparationKey ? current.remaining : preparationLimit) - 1,
     ),
    })),
   1_000,
  );
  return () => window.clearTimeout(timer);
 }, [isInterpreting, preparationKey, preparationLimit, preparationRemaining]);

 useEffect(() => {
  if (!isInterpreting || segment === undefined || recorder.audioBlob === null) return;
  if (lastRecordingRef.current === recorder.audioBlob) return;
  lastRecordingRef.current = recorder.audioBlob;
  void savePracticeAttempt({
   surface: "translation",
   contentId: segment.id,
   direction,
   answer: {
    kind: "interpreting-recording",
    transcript: learnerTranscript,
    notes: interpretingNotes,
    unitMarks,
    durationSeconds: recorder.durationSeconds,
   },
   scorePercent: null,
   responseMs: recorder.durationSeconds * 1_000,
  }).catch((error: Error) => setSaveError(error.message));
 }, [
  direction,
  interpretingNotes,
  isInterpreting,
  learnerTranscript,
  recorder.audioBlob,
  recorder.durationSeconds,
  segment,
  unitMarks,
 ]);

 const updateDraft = (value: string) => {
  if (!key) return;
  if (value.trim() && startedAtRef.current[key] === undefined)
   startedAtRef.current[key] = Date.now();
  setDrafts((current) => ({ ...current, [key]: value }));
  setChecked((current) => ({ ...current, [key]: false }));
  setHumanitiesResult(null);
 };

 const checkAnswer = (submittedAt: number) => {
  if (!segment || !key || !draft.trim()) return;
  const startedAt = startedAtRef.current[key];
  const responseMs = startedAt === undefined ? null : Math.max(0, submittedAt - startedAt);
  const attempt = createTranslationAttempt(segment, direction, draft, responseMs);
  const evaluationResult =
   humanitiesEvaluation === undefined
    ? null
    : evaluateHumanitiesAnswer(draft, humanitiesEvaluation);
  delete startedAtRef.current[key];
  setHumanitiesResult(evaluationResult);
  setChecked((current) => ({ ...current, [key]: true }));
  setSaveError("");
  void savePracticeAttempt({
   surface: "translation",
   contentId: segment.id,
   direction,
   answer: {
    answer: attempt.answer,
    reference:
     humanitiesEvaluation?.references[0]?.text ?? (direction === "zh-vi" ? segment.vi : segment.zh),
    missingUnitIds: evaluationResult?.missingRequiredUnitIds ?? [],
   },
   scorePercent: evaluationResult?.score ?? attempt.score,
   responseMs: attempt.responseMs,
  })
   .then(() => historyQuery.refetch())
   .catch((error: Error) => setSaveError(error.message));
 };

 const trackDocuments = initialDocuments.filter((document) => {
  return sourceKind(document) === activeTrack;
 });
 if (trackDocuments.length === 0) {
  return (
   <Typography variant="bodySmall" tone="muted">
    Chưa có bài Translation/Interpreting đã import.
   </Typography>
  );
 }
 const workflow = activeTrack === "translation" ? translationWorkflow : interpretingWorkflow;

 if (selectedIdValue.length === 0) {
  const title = trackTitle(activeTrack);
  return (
   <div className="grid min-w-0 gap-5">
    <header className="grid gap-2">
     <Typography as="span" variant="overline" tone="accent" weight="black">
      Đọc sâu · Lập luận · Chuyển ngữ
     </Typography>
     <Typography as="h1" variant="pageTitle" weight="black">
      {title}
     </Typography>
     <Typography as="p" variant="body" tone="muted" className="max-w-3xl">
      {trackDescription(activeTrack)}
     </Typography>
    </header>
    <nav
     className="grid grid-cols-2 gap-2 sm:grid-cols-5"
     aria-label="Điều hướng Văn sử & Dịch thuật"
    >
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/humanities">Văn sử &amp; Dịch</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/reader">Reader</Link>
     </Button>
     <div className="col-span-2 sm:col-span-3">
      <SegmentedControl
       value={activeTrack}
       items={[
        { key: "translation", label: "Biên dịch" },
        { key: "interpreting", label: "Phiên dịch" },
       ]}
       onChange={setActiveTrack}
       aria-label="Chọn lộ trình dịch thuật"
      />
     </div>
    </nav>
    <Card variant="section" padding="md" className="grid gap-3">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="grid gap-1">
       <Typography as="span" variant="caption" tone="accent" weight="black">
        Có lộ trình cho người mới
       </Typography>
       <Typography as="h2" variant="sectionTitle" weight="black">
        {title}
       </Typography>
      </div>
      <Badge>{trackDocuments.length} bài trong học phần</Badge>
     </div>
     <Typography as="p" variant="bodySmall" tone="muted">
      {activeTrack === "translation"
       ? "Biên dịch là chuyển một thông điệp viết sang ngôn ngữ khác cho đúng mục đích và người đọc, không phải thay từng từ Trung bằng một từ Việt."
       : "Phiên dịch là nghe hoặc đọc một thông điệp rồi chuyển bằng lời nói gần như ngay lập tức; người học phải đồng thời hiểu, nhớ, chọn ý, diễn đạt và tự kiểm soát."}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      Chọn một bài nền bên dưới để mở khu luyện tập. Bài đầu dùng câu ngắn và khung phân tích; bản
      tham khảo chỉ mở sau khi bạn tự làm.
     </Typography>
     <Card variant="subtle" padding="sm" className="grid gap-1">
      <Typography as="strong" variant="caption" tone="accent" weight="black">
       Bắt đầu từ đây
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {activeTrack === "translation"
        ? "Đầu tiên học cách đọc yêu cầu, chia đơn vị ý, dịch nháp và kiểm tra; chỉ sau đó mới học thuật ngữ, văn phong và công nghệ."
        : "Đầu tiên học cách nghe ý, ghi chú, truyền đạt và tự kiểm tra; chỉ sau đó mới tăng độ dài và tốc độ."}
      </Typography>
     </Card>
    </Card>
    <section className="grid gap-3" aria-labelledby="humanities-practice-levels">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-practice-levels">
       Ba mức thực hành
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Đi từ quan sát có hướng dẫn đến tự dịch và tự sửa.
      </Typography>
     </div>
     <div className="grid gap-3 md:grid-cols-3">
      {(activeTrack === "translation"
       ? [
          [
           "Xem bài dịch mẫu từng bước",
           "Mỗi quyết định được giải thích từ yêu cầu đến lần sửa cuối.",
          ],
          ["Dịch có khung đơn vị ý", "Hệ thống cho câu hỏi dẫn và phần bắt buộc phải giữ."],
          ["Tự dịch và tự sửa", "Chỉ mở phương án tham khảo sau khi đã nộp bản đầu."],
         ]
       : [
          ["Xem bài mẫu từng bước", "Theo dõi cách nghe ý, ghi chú và phục hồi thông điệp."],
          ["Phiên dịch có khung", "Đánh dấu các đơn vị thông tin bắt buộc phải truyền đạt."],
          ["Tự phiên dịch và tự sửa", "Ghi âm, tự đánh dấu ý và xem lại sau khi hoàn thành."],
         ]
      ).map(([levelTitle, levelDescription], index) => (
       <Card key={levelTitle} variant="subtle" padding="md" className="grid gap-2">
        <Badge variant="purple" className="w-fit">
         {index + 1}
        </Badge>
        <Typography as="h3" variant="cardTitle" weight="black">
         {levelTitle}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="muted">
         {levelDescription}
        </Typography>
       </Card>
      ))}
     </div>
    </section>
    <section className="grid gap-3" aria-labelledby="humanities-foundation-lessons">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-foundation-lessons">
       Các bài nền phải học trước
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Mỗi bài nền trả lời một câu hỏi cốt lõi trước khi mở phần luyện tập.
      </Typography>
     </div>
     <div className="grid gap-2">
      {(activeTrack === "translation"
       ? translationFoundationLessons
       : interpretingFoundationLessons
      ).map(([lessonTitle, question, explanation], index) => (
       <Card asChild key={lessonTitle} variant="default" padding="none" className="group">
        <details open={index === 0}>
         <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
          <Badge variant="purple">{index + 1}</Badge>
          <span className="grid gap-1">
           <Typography as="strong" variant="bodySmall" weight="black">
            {lessonTitle}
           </Typography>
           <Typography as="span" variant="caption" tone="muted">
            {question}
           </Typography>
          </span>
         </summary>
         <div className="grid gap-2 border-t border-border-default p-4">
          <Typography as="p" variant="bodySmall" tone="muted">
           {explanation}
          </Typography>
          <Typography as="p" variant="caption" tone="muted">
           Dấu hiệu đã hiểu: có thể giải thích lựa chọn và tự kiểm tra trước khi mở bản tham khảo.
          </Typography>
         </div>
        </details>
       </Card>
      ))}
     </div>
    </section>
    <section className="grid gap-3 lg:grid-cols-2">
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       Kiến thức nền
      </Typography>
      {(activeTrack === "translation"
       ? [
          "Yêu cầu dịch, người đọc đích, sắc thái và văn phong",
          "Logic, tình thái, phủ định và thuật ngữ",
          "Tra cứu, lần sửa và kiểm soát chất lượng",
         ]
       : [
          "Thông điệp chính và quan hệ giữa các ý",
          "Ghi chú, trí nhớ và số liệu",
          "Tốc độ, phục hồi và tự đánh giá bản ghi",
         ]
      ).map((item) => (
       <Typography key={item} as="p" variant="bodySmall" tone="muted">
        ✓ {item}
       </Typography>
      ))}
     </Card>
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       Kỹ năng phải luyện
      </Typography>
      {(activeTrack === "translation"
       ? [
          "Phân tích nguồn trước khi dịch",
          "Giữ đủ ý và số liệu",
          "Tạo nhiều phương án hợp lệ",
          "Sửa bản dịch và dịch ngược",
         ]
       : [
          "Nghe và ghi chú theo đơn vị ý",
          "Truyền đạt rõ dưới áp lực thời gian",
          "Tự đánh dấu ý đã giữ",
          "Nghe lại và phục hồi",
         ]
      ).map((item) => (
       <Typography key={item} as="p" variant="bodySmall" tone="muted">
        ✓ {item}
       </Typography>
      ))}
     </Card>
    </section>
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       Quy trình chuẩn
      </Typography>
      {workflow.map((step, index) => (
       <Typography key={step} as="p" variant="bodySmall" tone="muted">
        {index + 1}. {step}
       </Typography>
      ))}
     </Card>
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       Sai lầm người mới thường gặp
      </Typography>
      {(activeTrack === "translation"
       ? [
          "Thay từng từ và giữ nguyên trật tự câu Trung.",
          "Mở bản tham khảo trước khi tự phân tích.",
          "Chỉ sửa cho câu trôi mà không kiểm tra phần bị mất hoặc thêm.",
         ]
       : [
          "Chép nguyên câu thay vì ghi ý.",
          "Nghe lại quá nhiều lần mà không tự nói.",
          "Bỏ qua phần chưa chắc thay vì đánh dấu để phục hồi.",
         ]
      ).map((item) => (
       <Typography key={item} as="p" variant="caption" tone="muted">
        • {item}
       </Typography>
      ))}
     </Card>
    </section>
    <section className="grid gap-3" aria-labelledby="humanities-library">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-library">
       Thư viện bài luyện
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Chọn bài theo đúng thứ tự học phần; mỗi bài mở khu luyện riêng.
      </Typography>
     </div>
     <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {trackDocuments.map((document, index) => {
       const lessonIndex = index + 1;
       const directionLabel = document.genre_vi || "Bài luyện dịch";
       return (
        <Button
         key={document.id}
         type="button"
         size="lg"
         align="start"
         wrap="normal"
         layout="grid"
         variant="surfaceCard"
         onClick={() => {
          selectDocument(document.id);
          setActiveIndex(0);
          setDirectionPreference(null);
          setHumanitiesResult(null);
          setReplayCount(0);
          setPreparationState({ key: "", remaining: 0 });
          setInterpretingNotes("");
          setLearnerTranscript("");
          setUnitMarks({});
          recorder.clear();
         }}
        >
         <Typography
          as="span"
          variant="caption"
          tone="accent"
          weight="black"
          className="w-full text-left"
         >
          Mô-đun {courseModuleOrder(activeTrack, lessonIndex)} · Bài {lessonIndex}/
          {trackDocuments.length}
         </Typography>
         <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
          {document.title_zh}
         </Typography>
         <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
          {document.title_vi} · {directionLabel}
         </Typography>
        </Button>
       );
      })}
     </div>
    </section>
   </div>
  );
 }

 if (resource === null || segment === undefined) {
  return (
   <Typography variant="bodySmall" tone="muted">
    Chưa có nội dung bài học đã import.
   </Typography>
  );
 }
 const selectedLessonIndex = Math.max(
  1,
  trackDocuments.findIndex((document) => document.id === selectedIdValue) + 1,
 );
 const selectedPayload = resource.exerciseItems.find((item) => item.payload.evaluation)?.payload;
 const practiceMetadata = selectedPayload?.translation ?? selectedPayload?.interpreting;

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <Button
     type="button"
     variant="ghost"
     align="start"
     className="w-fit"
     onClick={() => {
      clearDocument();
      setActiveIndex(0);
      setHumanitiesResult(null);
     }}
    >
     ← Danh sách bài {trackTitle(activeTrack)}
    </Button>
    <div className="grid gap-1">
     <Badge variant="purple" className="w-fit">
      Mô-đun {courseModuleOrder(activeTrack, selectedLessonIndex)} · Bài {selectedLessonIndex}/
      {trackDocuments.length}
     </Badge>
     <Typography as="h1" variant="sectionTitle" weight="black">
      {resource.document.title_zh}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {resource.document.title_vi} · {resource.document.genre_vi}
     </Typography>
    </div>
   </Card>
   <nav
    className="grid grid-cols-2 gap-2 sm:grid-cols-5"
    aria-label="Điều hướng Văn sử & Dịch thuật"
   >
    <Button type="button" variant="outline" onClick={clearDocument}>
     Danh sách bài
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={selectedLessonIndex <= 1}
     onClick={() => {
      const previous = trackDocuments[selectedLessonIndex - 2];
      if (previous !== undefined) selectDocument(previous.id);
     }}
    >
     Bài trước
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={selectedLessonIndex >= trackDocuments.length}
     onClick={() => {
      const next = trackDocuments[selectedLessonIndex];
      if (next !== undefined) selectDocument(next.id);
     }}
    >
     Bài sau
    </Button>
    <Button
     type="button"
     variant={activeTrack === "translation" ? "active" : "outline"}
     onClick={() => {
      setActiveTrack("translation");
      clearDocument();
     }}
    >
     Biên dịch
    </Button>
    <Button
     type="button"
     variant={activeTrack === "interpreting" ? "active" : "outline"}
     onClick={() => {
      setActiveTrack("interpreting");
      clearDocument();
     }}
    >
     Phiên dịch
    </Button>
   </nav>
   <Card variant="subtle" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       Có lộ trình cho người mới
      </Typography>
      <Typography as="strong" variant="bodySmall" weight="black">
       {activeTrack === "translation"
        ? "Đầu tiên học cách đọc yêu cầu, chia đơn vị ý, dịch nháp và kiểm tra; chỉ sau đó mới học thuật ngữ, văn phong và công nghệ."
        : "Đầu tiên học cách nghe ý, ghi chú, truyền đạt và tự kiểm tra; chỉ sau đó mới tăng độ dài và tốc độ."}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {activeTrack === "translation"
        ? "Bài đầu dùng câu ngắn đời sống và cho sẵn khung phân tích; chưa yêu cầu văn phong chuyên nghiệp ngay."
        : "Bài đầu dùng đoạn ngắn và giới hạn số lần nghe lại để người học hình thành thói quen nghe ý."}
      </Typography>
     </div>
     <Badge>{trackDocuments.length} bài trong học phần</Badge>
    </div>
    <div className="grid gap-2">
     <Typography as="strong" variant="caption" weight="black">
      Làm bài này theo thứ tự
     </Typography>
     <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {workflow.map((step, index) => (
       <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Badge variant="purple">{index + 1}</Badge>
        <Typography as="span" variant="caption" tone="muted">
         {step}
        </Typography>
       </li>
      ))}
     </ol>
    </div>
   </Card>
   {practiceMetadata !== undefined && humanitiesEvaluation !== undefined ? (
    <Card variant="section" padding="md" className="grid gap-3">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       Hướng dẫn cho người mới
      </Typography>
      <Typography as="h2" variant="sectionTitle" weight="black">
       {activeTrack === "translation"
        ? "Biên dịch là giải quyết một bài toán truyền đạt"
        : "Phiên dịch là giữ đủ thông điệp dưới áp lực thời gian"}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {activeTrack === "translation"
        ? "Trước khi viết câu tiếng Việt, cần xác định người nói muốn truyền đạt điều gì, cho ai và trong hoàn cảnh nào. Không dịch bằng cách thay từng chữ Trung bằng từng chữ Việt."
        : "Trước khi nói, cần nắm người, hành động, số liệu và quan hệ logic. Không cố nhớ từng chữ rồi bỏ mất thông điệp chính."}
      </Typography>
     </div>
     <Typography as="strong" variant="bodySmall" weight="black">
      Bài này có {humanitiesEvaluation.informationUnits.length} đơn vị ý cần giữ
     </Typography>
     <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {workflow.slice(0, 5).map((step, index) => (
       <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Badge variant="purple">{index + 1}</Badge>
        <Typography as="span" variant="caption" tone="muted">
         {step}
        </Typography>
       </li>
      ))}
     </ol>
     <Typography as="p" variant="caption" tone="muted">
      Bản tham khảo chỉ mở sau lần làm đầu. Một cách diễn đạt khác vẫn đúng khi giữ đủ nghĩa, quan
      hệ logic, thuật ngữ và sắc thái cần thiết.
     </Typography>
    </Card>
   ) : null}
   {historyQuery.data && historyQuery.data.length > 0 ? (
    <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
     <Typography as="p" variant="caption" tone="muted" weight="black">
      Lịch sử đoạn này: {historyQuery.data.length} lần
     </Typography>
     {historyQuery.data.slice(0, 3).map((attempt) => (
      <Badge key={attempt.id}>
       {attempt.score === null ? "review" : `${Math.round(attempt.score * 100)}/100`}
      </Badge>
     ))}
    </Card>
   ) : null}
   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
    <Card variant="section" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       Văn bản nguồn
      </Typography>
      <Badge>{direction === "zh-vi" ? "Trung → Việt" : "Việt → Trung"}</Badge>
     </div>
     <Typography as="p" variant="caption" tone="muted">
      Đoạn {segment.order}/{segments.length} · {sourceKind(resource.document)}
     </Typography>
     {direction === "zh-vi" ? (
      <ReaderHanziText
       displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: true, showMeaning: false }}
       leading="learner"
       wrapping="preWrap"
      >
       {segment.zh}
      </ReaderHanziText>
     ) : (
      <Typography as="p" variant="body" wrapping="preWrap" leading="relaxed">
       {segment.vi || resource.document.title_vi}
      </Typography>
     )}
     {segment.pinyin ? (
      <PinyinText variant="bodySmall" tone="accent" weight="semibold">
       {segment.pinyin}
      </PinyinText>
     ) : null}
     <div className="grid gap-2 border-t border-border-default pt-3">
      <Typography as="span" variant="caption" tone="muted" weight="black">
       Thuật ngữ cần giữ
      </Typography>
      {selectedPayload?.glossary === undefined || selectedPayload.glossary.length === 0 ? (
       <Typography as="p" variant="caption" tone="muted">
        Bài này không có thuật ngữ bắt buộc bổ sung.
       </Typography>
      ) : (
       selectedPayload.glossary.map((entry) => (
        <div
         key={entry.id}
         className="grid gap-1 border-b border-border-default pb-2 last:border-0"
        >
         <Typography as="strong" variant="bodySmall" weight="black">
          {entry.headword} {entry.pinyin === null ? "" : entry.pinyin}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
          {entry.meaningVi}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
          {entry.noteVi}
         </Typography>
        </div>
       ))
      )}
     </div>
     <div className="grid grid-cols-2 gap-2">
      <Button
       type="button"
       variant={direction === "zh-vi" ? "active" : "outline"}
       onClick={() => {
        setDirectionPreference("zh-vi");
        setHumanitiesResult(null);
       }}
      >
       中文 → Tiếng Việt
      </Button>
      <Button
       type="button"
       variant={direction === "vi-zh" ? "active" : "outline"}
       onClick={() => {
        setDirectionPreference("vi-zh");
        setHumanitiesResult(null);
       }}
      >
       Tiếng Việt → 中文
      </Button>
     </div>
    </Card>
    <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="grid gap-0.5">
       <Typography as="strong" variant="bodySmall" weight="black">
        Bản dịch của bạn
       </Typography>
       <Typography as="span" variant="caption" tone="muted">
        Chưa lưu thay đổi mới
       </Typography>
      </div>
      <Button
       type="button"
       variant="outline"
       disabled={!draft.trim()}
       onClick={() => {
        if (!segment || !draft.trim()) return;
        void savePracticeAttempt({
         surface: "translation",
         contentId: segment.id,
         direction,
         answer: { answer: draft, reference: null, missingUnitIds: [] },
         scorePercent: null,
         responseMs: null,
        })
         .then(() => historyQuery.refetch())
         .catch((error: Error) => setSaveError(error.message));
       }}
      >
       Lưu lần sửa
      </Button>
     </div>
     <Typography as="p" variant="caption" tone="muted">
      Giữ đủ người, hành động, số liệu, phủ định và quan hệ logic.
     </Typography>
     {isInterpreting ? (
      <Card variant="subtle" padding="sm" className="grid gap-3">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography as="p" variant="caption" weight="black">
         Interpreting
        </Typography>
        <Badge>{preparationRemaining > 0 ? `Chuẩn bị ${preparationRemaining}s` : "Sẵn sàng"}</Badge>
       </div>
       {humanitiesEvaluation.noteTakingAllowed !== false ? (
        <Textarea
         value={interpretingNotes}
         onChange={(event) => setInterpretingNotes(event.target.value)}
         placeholder="Ghi chú ý chính trong lúc chuẩn bị…"
         aria-label="Ghi chú interpreting"
         rows={2}
        />
       ) : null}
       <div className="flex flex-wrap items-center gap-2">
        {recorder.isRecording ? (
         <Button type="button" variant="destructive" onClick={recorder.stop}>
          <Square data-icon="inline-start" /> Dừng ghi ({recorder.durationSeconds}s)
         </Button>
        ) : (
         <Button
          type="button"
          disabled={recorder.isRequesting || !recorder.isSupported}
          onClick={() => {
           recorder.clear();
           void recorder.start();
          }}
         >
          <Mic data-icon="inline-start" />
          {recorder.isRequesting ? "Đang xin quyền…" : "Bắt đầu ghi"}
         </Button>
        )}
        {recorder.audioUrl ? (
         <audio
          controls
          preload="metadata"
          src={recorder.audioUrl}
          className="min-w-0 max-w-full"
         />
        ) : null}
       </div>
       <Textarea
        value={learnerTranscript}
        onChange={(event) => setLearnerTranscript(event.target.value)}
        placeholder="Ghi lại transcript bạn vừa nói (không bắt buộc)…"
        aria-label="Transcript interpreting"
        rows={2}
       />
       {humanitiesEvaluation.informationUnits.length > 0 ? (
        <div className="grid gap-2">
         <Typography as="p" variant="caption" tone="muted" weight="black">
          Tự đánh dấu ý đã truyền đạt
         </Typography>
         {humanitiesEvaluation.informationUnits.map((unit) => (
          <div key={unit.id} className="flex min-w-0 flex-wrap items-center gap-1">
           <Typography as="span" variant="caption" className="min-w-40">
            {unit.canonicalMeaningVi}
           </Typography>
           {interpretingMarks.map((mark) => (
            <Button
             key={mark}
             type="button"
             size="sm"
             variant={unitMarks[unit.id] === mark ? "active" : "outline"}
             onClick={() => {
              const nextMarks = { ...unitMarks, [unit.id]: mark };
              setUnitMarks(nextMarks);
              void savePracticeAttempt({
               surface: "translation",
               contentId: segment.id,
               direction,
               answer: { kind: "interpreting-self-mark", unitMarks: nextMarks },
               scorePercent: null,
               responseMs: null,
              }).catch((error: Error) => setSaveError(error.message));
             }}
            >
             {mark === "kept"
              ? "Đủ"
              : mark === "partial"
                ? "Một phần"
                : mark === "missed"
                  ? "Thiếu"
                  : "Chưa chắc"}
            </Button>
           ))}
          </div>
         ))}
        </div>
       ) : null}
       {recorder.error ? (
        <Typography as="p" variant="caption" tone="danger">
         Không thể ghi âm trên thiết bị này hoặc microphone chưa được cấp quyền.
        </Typography>
       ) : null}
      </Card>
     ) : null}
     <Textarea
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      placeholder="Dịch tại đây. Giữ đủ người, hành động, số liệu, phủ định và quan hệ logic…"
      aria-label="Câu trả lời Humanities"
      className="min-h-32"
     />
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!draft.trim()} onClick={() => checkAnswer(Date.now())}>
       Kiểm tra
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex === 0}
       onClick={() => {
        tts.stop();
        setHumanitiesResult(null);
        setActiveIndex((index) => index - 1);
       }}
      >
       Đoạn trước
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex >= segments.length - 1}
       onClick={() => {
        tts.stop();
        setHumanitiesResult(null);
        setActiveIndex((index) => index + 1);
       }}
      >
       Đoạn sau
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={
        humanitiesEvaluation?.mode === "interpreting" &&
        humanitiesEvaluation.replayLimit !== null &&
        replayCount >= humanitiesEvaluation.replayLimit
       }
       onClick={() => {
        setReplayCount((count) => count + 1);
        tts.speakSequence([segment.zh]);
       }}
      >
       Phát nguồn
       {humanitiesEvaluation?.mode === "interpreting" && humanitiesEvaluation.replayLimit !== null
        ? ` (${replayCount}/${humanitiesEvaluation.replayLimit})`
        : ""}
      </Button>
     </div>
     {saveError ? (
      <Typography as="p" variant="caption" tone="danger">
       {saveError}
      </Typography>
     ) : null}
     <Typography as="p" variant="caption" tone="muted">
      Hệ thống chỉ chấm phần có bằng chứng rõ. Độ tự nhiên, sắc thái và văn phong phải để ở trạng
      thái chưa kết luận nếu chưa có người đánh giá phù hợp.
     </Typography>
     {activeTrack === "translation" ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography as="strong" variant="bodySmall" weight="black">
        Dịch ngược để kiểm tra mất nghĩa
       </Typography>
       <Typography as="span" variant="caption" tone="muted">
        Dịch bản của bạn trở lại ngôn ngữ nguồn; khác biệt giúp phát hiện thông tin bị rơi hoặc bị
        thêm.
       </Typography>
       <Textarea
        value={backTranslation}
        onChange={(event) =>
         setBackTranslations((current) => ({ ...current, [key]: event.target.value }))
        }
        placeholder="Nhập bản dịch ngược…"
        aria-label="Bản dịch ngược"
        rows={3}
       />
      </Card>
     ) : null}
     {isChecked ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography as="p" variant="bodySmall" weight="black">
        Điểm: {score ?? 0}/100
       </Typography>
       <TranslationText variant="bodySmall" tone="muted">
        Đáp án tham chiếu:{" "}
        {humanitiesEvaluation?.references[0]?.text ??
         (direction === "zh-vi" ? segment.vi : segment.zh)}
       </TranslationText>
       {humanitiesResult ? (
        <div className="grid gap-1">
         {humanitiesResult.unitResults.map((unit) => (
          <Typography
           key={unit.unitId}
           as="p"
           variant="caption"
           tone={
            unit.status === "covered" ? "success" : unit.status === "missing" ? "danger" : "muted"
           }
          >
           {unit.status === "covered" ? "✓" : "•"} {unit.messageVi}
          </Typography>
         ))}
        </div>
       ) : null}
      </Card>
     ) : null}
    </Card>
   </div>
  </div>
 );
}
