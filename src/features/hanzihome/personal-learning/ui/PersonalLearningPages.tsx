"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Brain, CheckCircle2, CircleAlert, Gauge, Play, Pause } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 getCurrentCalibrationItem,
} from "@/features/hanzihome/personal-learning/application/personal-learning.calibration";
import {
 personalLearningKnowledgeNodes,
 getKnowledgeNode,
} from "@/features/hanzihome/personal-learning/data/knowledge-registry";
import {
 emptyPersonalLearningStore,
 type Confidence,
 type ErrorAnnotation,
 type KnowledgeNodeId,
 type LearnerNodeStatus,
} from "@/features/hanzihome/personal-learning/domain/personal-learning.schemas";

const statusLabel: Record<LearnerNodeStatus, string> = {
 UNOBSERVED: "Chưa quan sát",
 PRIOR_ONLY: "Mới có prior",
 PROVISIONAL_WEAKNESS: "Điểm yếu tạm thời",
 CONFIRMED_GAP: "Lỗ hổng đã xác nhận",
 DECLARATIVE_ONLY: "Biết lý thuyết",
 CONTROLLED_MASTERY: "Làm được có kiểm soát",
 AUTOMATING: "Đang tự động hóa",
 STABLE_TRANSFER: "Chuyển giao ổn định",
 CONTESTED: "Cần xem lại",
};

const navItems = [
 ["/personal-learning", "Tổng quan"],
 ["/personal-learning/today", "Hôm nay"],
 ["/personal-learning/progress", "Tiến độ"],
 ["/personal-learning/knowledge", "Kiến thức"],
 ["/personal-learning/errors", "Lỗi cần xem"],
 ["/personal-learning/calibration", "Hiệu chuẩn"],
] as const;

type HubMode = "dashboard" | "today" | "progress" | "knowledge" | "errors";

function PersonalLearningNav() {
 const pathname = usePathname();
 return (
  <nav className="flex min-w-0 flex-wrap gap-2" aria-label="Điều hướng học cá nhân">
   {navItems.map(([href, label]) => {
    const active = href === "/personal-learning" ? pathname === href : pathname.startsWith(href);
    return (
     <Button key={href} asChild size="toolbar" variant={active ? "active" : "navigation"}>
      <Link href={href}>{label}</Link>
     </Button>
    );
   })}
  </nav>
 );
}

function StateBadge({ state }: { state: LearnerNodeStatus }) {
 const variant =
  state === "STABLE_TRANSFER" || state === "AUTOMATING"
   ? "success"
   : state === "CONFIRMED_GAP" || state === "DECLARATIVE_ONLY"
     ? "warning"
     : state === "CONTESTED"
       ? "danger"
       : "default";
 return <Badge variant={variant}>{statusLabel[state]}</Badge>;
}

function LoadingSurface() {
 return (
  <Card variant="section" padding="lg">
   <Typography tone="muted">Đang tải hồ sơ học cá nhân…</Typography>
  </Card>
 );
}

export function PersonalLearningHubPage({ mode }: { mode: HubMode }) {
 const learning = useLearningState();
 const store = learning.state.progress.personalLearning ?? emptyPersonalLearningStore;
 const nodeStateMap = new Map(store.nodeStates.map((item) => [item.knowledgeNodeId, item]));
 const pendingHypotheses = store.hypotheses.filter(
  (item) => item.status === "pending" || item.status === "needs-intent" || item.status === "uncertain",
 );
 const confirmedGaps = store.nodeStates.filter((item) => item.state === "CONFIRMED_GAP").length;
 const stable = store.nodeStates.filter(
  (item) => item.state === "STABLE_TRANSFER" || item.state === "AUTOMATING",
 ).length;
 const reviewNodes = personalLearningKnowledgeNodes.filter((node) => {
  const state = nodeStateMap.get(node.id)?.state ?? "UNOBSERVED";
  return state !== "STABLE_TRANSFER" && state !== "AUTOMATING";
 });

 if (learning.isLoading) {
  return (
   <PageContainer>
    <LoadingSurface />
   </PageContainer>
  );
 }

 const title =
  mode === "today"
   ? "Hôm nay nên học gì"
   : mode === "progress"
     ? "Tiến độ năng lực"
     : mode === "knowledge"
       ? "Bản đồ kiến thức"
       : mode === "errors"
         ? "Lỗi cần xem lại"
         : "Học cá nhân";
 const description =
  mode === "dashboard"
   ? "Theo dõi bằng chứng thật từ lúc đọc, viết, nói, dịch và luyện tập thay vì tự gán một điểm phần trăm chung."
   : mode === "today"
     ? "Ưu tiên các điểm chưa ổn định và những lỗi đang cần thêm bằng chứng."
     : mode === "progress"
       ? "Mỗi trạng thái được suy ra từ bằng chứng M1–M5; CONFIRMED_GAP không thể gán thủ công."
       : mode === "knowledge"
         ? "Sáu knowledge node nguồn của Hanzi Studio, giữ nguyên trạng thái source-checked và các research gap."
         : "Giả thuyết chỉ trở thành lỗi đã xác nhận sau khi có ý định người học và review chất lượng.";

 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader eyebrow="HanziHome · Personal Learning" title={title} description={description} />
    <PersonalLearningNav />

    {mode === "dashboard" ? (
     <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tóm tắt học cá nhân">
       <MetricCard label="Lần thử đã ghi" value={store.attempts.length} icon={<Brain />} />
       <MetricCard label="Lỗi đang chờ" value={pendingHypotheses.length} icon={<CircleAlert />} />
       <MetricCard label="Lỗ hổng xác nhận" value={confirmedGaps} icon={<Gauge />} />
       <MetricCard label="Đang ổn định" value={stable} icon={<CheckCircle2 />} />
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
       <Card variant="section" padding="lg" className="grid gap-3">
        <div className="grid gap-1">
         <Typography as="h2" variant="sectionTitle" weight="black">Việc nên làm tiếp</Typography>
         <Typography tone="secondary">Hiệu chuẩn trước nếu chưa có đủ bằng chứng; sau đó app mới tăng độ tin cậy của trạng thái.</Typography>
        </div>
        <div className="flex flex-wrap gap-2">
         <Button asChild size="toolbar"><Link href="/personal-learning/calibration"><Play data-icon="inline-start" />Hiệu chuẩn</Link></Button>
         <Button asChild size="toolbar" variant="outline"><Link href="/personal-learning/today">Xem kế hoạch hôm nay<ArrowRight data-icon="inline-end" /></Link></Button>
        </div>
       </Card>
       <Card variant="section" padding="lg" className="grid gap-3">
        <Typography as="h2" variant="sectionTitle" weight="black">Bằng chứng gần đây</Typography>
        {store.evidence.length === 0 ? (
         <Typography tone="muted">Chưa có bằng chứng. Bắt đầu bằng calibration hoặc luyện tập.</Typography>
        ) : (
         store.evidence.slice(-4).reverse().map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
           <Typography weight="bold">{getKnowledgeNode(item.knowledgeNodeId).shortLabelVi} · {item.dimension}</Typography>
           <Badge variant={item.outcome === "success" ? "success" : item.outcome === "failure" ? "warning" : "default"}>{item.outcome}</Badge>
          </div>
         ))
        )}
       </Card>
      </section>
     </>
    ) : null}

    {mode === "today" ? (
     <section className="grid gap-3">
      {reviewNodes.map((node) => {
       const state = nodeStateMap.get(node.id)?.state ?? "UNOBSERVED";
       return (
        <Card key={node.id} variant="section" padding="lg" className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
         <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2"><Typography as="h2" variant="sectionTitle" weight="black">{node.titleVi}</Typography><StateBadge state={state} /></div>
          <Typography tone="secondary">{node.coreQuestionVi}</Typography>
         </div>
         <Button asChild size="toolbar" variant="outline"><Link href={`/personal-learning/knowledge/${node.id}`}>Ôn node này<ArrowRight data-icon="inline-end" /></Link></Button>
        </Card>
       );
      })}
     </section>
    ) : null}

    {mode === "progress" ? (
     <section className="grid gap-3">
      {personalLearningKnowledgeNodes.map((node) => {
       const state = nodeStateMap.get(node.id);
       const resolvedState = state?.state ?? "UNOBSERVED";
       return (
        <Card key={node.id} variant="section" padding="lg" className="grid gap-3">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography as="h2" variant="sectionTitle" weight="black">{node.titleVi}</Typography>
          <StateBadge state={resolvedState} />
         </div>
         <div className="flex flex-wrap gap-2">
          {(["M1", "M2", "M3", "M4", "M5"] as const).map((dimension) => (
           <Badge key={dimension} variant="default">{dimension}: {state?.evidenceCoverage[dimension] ?? 0}</Badge>
          ))}
         </div>
         <Button asChild variant="link" size="inline" align="start"><Link href={`/personal-learning/evidence/${node.id}`}>Xem bằng chứng</Link></Button>
        </Card>
       );
      })}
     </section>
    ) : null}

    {mode === "knowledge" ? (
     <section className="grid gap-3 xl:grid-cols-2">
      {personalLearningKnowledgeNodes.map((node) => (
       <Card key={node.id} variant="section" padding="lg" className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
         <Typography as="h2" variant="sectionTitle" weight="black">{node.titleVi}</Typography>
         <Badge variant="info">{node.reviewStatus}</Badge>
        </div>
        <Typography tone="secondary">{node.coreQuestionVi}</Typography>
        <Button asChild size="toolbar" variant="outline" align="start"><Link href={`/personal-learning/knowledge/${node.id}`}>Mở kiến thức<ArrowRight data-icon="inline-end" /></Link></Button>
       </Card>
      ))}
     </section>
    ) : null}

    {mode === "errors" ? (
     <section className="grid gap-3">
      {store.hypotheses.length === 0 ? (
       <Card variant="subtle" padding="lg"><Typography tone="muted">Chưa có giả thuyết lỗi nào.</Typography></Card>
      ) : (
       [...store.hypotheses].reverse().map((hypothesis) => {
        const attempt = store.attempts.find((item) => item.id === hypothesis.attemptId);
        return (
         <Card key={hypothesis.id} variant="section" padding="lg" className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-1">
           <div className="flex flex-wrap items-center gap-2"><Typography weight="black">{getKnowledgeNode(hypothesis.knowledgeNodeId).shortLabelVi}</Typography><Badge variant="default">{hypothesis.status}</Badge></div>
           <Typography tone="secondary">{attempt?.originalInput ?? hypothesis.proposedSubtype}</Typography>
           <Typography variant="caption" tone="muted">{hypothesis.explanationVi}</Typography>
          </div>
          <Button asChild size="toolbar" variant="outline"><Link href={`/personal-learning/errors/${hypothesis.id}`}>Review<ArrowRight data-icon="inline-end" /></Link></Button>
         </Card>
        );
       })
      )}
     </section>
    ) : null}
   </main>
  </PageContainer>
 );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
 return (
  <Card variant="section" padding="lg" className="grid gap-2">
   <div className="flex items-center gap-2"><span className="text-text-muted">{icon}</span><Typography variant="caption" tone="muted" weight="bold">{label}</Typography></div>
   <Typography variant="pageTitle" weight="black">{value}</Typography>
  </Card>
 );
}

export function PersonalLearningKnowledgeDetailPage({ nodeId }: { nodeId: string }) {
 const node = personalLearningKnowledgeNodes.find((item) => item.id === nodeId);
 const learning = useLearningState();
 const store = learning.state.progress.personalLearning ?? emptyPersonalLearningStore;
 if (node === undefined) return <PersonalLearningNotFound title="Không tìm thấy knowledge node" />;
 const state = store.nodeStates.find((item) => item.knowledgeNodeId === node.id)?.state ?? "UNOBSERVED";
 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader eyebrow="Personal Learning · Knowledge" title={node.titleVi} description={node.coreQuestionVi} meta={<div className="flex flex-wrap gap-2"><StateBadge state={state} /><Badge variant="info">{node.reviewStatus}</Badge></div>} />
    <PersonalLearningNav />
    <Card variant="section" padding="lg" className="grid gap-3">
     <Typography as="h2" variant="sectionTitle" weight="black">Bản chất</Typography>
     <Typography tone="secondary">{node.functionVi}</Typography>
     <Typography tone="secondary">{node.whyVi}</Typography>
    </Card>
    <Card variant="section" padding="lg" className="grid gap-3">
     <Typography as="h2" variant="sectionTitle" weight="black">Cách quyết định</Typography>
     <ol className="grid gap-2 pl-5 list-decimal">
      {node.decisionStepsVi.map((step) => <li key={step}><Typography tone="secondary">{step}</Typography></li>)}
     </ol>
     <div className="flex flex-wrap gap-2">{node.frames.map((frame) => <Badge key={frame} variant="default">{frame}</Badge>)}</div>
    </Card>
    <Card variant="section" padding="lg" className="grid gap-3">
     <Typography as="h2" variant="sectionTitle" weight="black">Đối chiếu tối thiểu</Typography>
     {node.minimalContrasts.map((contrast) => (
      <Card key={contrast.id} variant="subtle" padding="sm" className="grid gap-1">
       <Typography weight="black">{contrast.firstZh}</Typography>
       <Typography weight="black">{contrast.secondZh}</Typography>
       <Typography variant="caption" tone="secondary">{contrast.explanationVi}</Typography>
      </Card>
     ))}
    </Card>
    <Card variant="section" padding="lg" className="grid gap-3">
     <Typography as="h2" variant="sectionTitle" weight="black">Case cần dè chừng</Typography>
     <ul className="grid gap-2 pl-5 list-disc">{node.markedCasesVi.map((item) => <li key={item}><Typography tone="secondary">{item}</Typography></li>)}</ul>
    </Card>
    <Card variant="section" padding="lg" className="grid gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2"><Typography as="h2" variant="sectionTitle" weight="black">Nguồn & khoảng trống nghiên cứu</Typography><Badge variant="warning">Không tự nâng review status</Badge></div>
     {node.sources.map((source) => <div key={source.id} className="grid gap-1"><Typography weight="bold">{source.title}</Typography><Typography variant="caption" tone="muted">{source.locator} · {source.noteVi}</Typography></div>)}
     <ul className="grid gap-2 pl-5 list-disc">{node.researchGapsVi.map((gap) => <li key={gap}><Typography tone="secondary">{gap}</Typography></li>)}</ul>
    </Card>
   </main>
  </PageContainer>
 );
}

export function PersonalLearningEvidencePage({ nodeId }: { nodeId: string }) {
 const node = personalLearningKnowledgeNodes.find((item) => item.id === nodeId);
 const learning = useLearningState();
 const store = learning.state.progress.personalLearning ?? emptyPersonalLearningStore;
 if (node === undefined) return <PersonalLearningNotFound title="Không tìm thấy knowledge node" />;
 const evidence = store.evidence.filter((item) => item.knowledgeNodeId === node.id).reverse();
 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader eyebrow="Personal Learning · Evidence" title={`Bằng chứng · ${node.shortLabelVi}`} description="Lịch sử bằng chứng M1–M5 dùng để suy trạng thái; dữ liệu này không phải điểm phần trăm tự gán." />
    <PersonalLearningNav />
    <section className="grid gap-3">
     {evidence.length === 0 ? <Card variant="subtle" padding="lg"><Typography tone="muted">Chưa có bằng chứng cho node này.</Typography></Card> : evidence.map((item) => (
      <Card key={item.id} variant="section" padding="lg" className="grid gap-2">
       <div className="flex flex-wrap items-center gap-2"><Badge variant="info">{item.dimension}</Badge><Badge variant={item.outcome === "success" ? "success" : item.outcome === "failure" ? "warning" : "default"}>{item.outcome}</Badge><Badge variant="default">{item.opportunityType}</Badge></div>
       <Typography variant="caption" tone="muted">{item.mode} · hint {item.hintLevel} · {item.observedAt}</Typography>
       <Typography tone="secondary">{item.reasonCodes.join(" · ")}</Typography>
      </Card>
     ))}
    </section>
   </main>
  </PageContainer>
 );
}

export function PersonalLearningErrorDetailPage({ hypothesisId }: { hypothesisId: string }) {
 const learning = useLearningState();
 const store = learning.state.progress.personalLearning ?? emptyPersonalLearningStore;
 const hypothesis = store.hypotheses.find((item) => item.id === hypothesisId);
 if (learning.isLoading) return <PageContainer><LoadingSurface /></PageContainer>;
 if (hypothesis === undefined) return <PersonalLearningNotFound title="Không tìm thấy giả thuyết lỗi" />;
 const attempt = store.attempts.find((item) => item.id === hypothesis.attemptId);
 if (attempt === undefined) return <PersonalLearningNotFound title="Không tìm thấy lần thử nguồn" />;
 const latestIntent = store.intentRevisions.filter((item) => item.attemptId === attempt.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.intendedMeaningVi ?? attempt.intendedMeaningVi ?? "";
 return <ErrorReviewForm key={`${hypothesis.id}:${latestIntent}`} learning={learning} hypothesisId={hypothesis.id} originalInput={attempt.originalInput} initialIntent={latestIntent} explanation={hypothesis.explanationVi} intentQuestion={hypothesis.intentQuestionVi} status={hypothesis.status} />;
}

function ErrorReviewForm({ learning, hypothesisId, originalInput, initialIntent, explanation, intentQuestion, status }: { learning: ReturnType<typeof useLearningState>; hypothesisId: string; originalInput: string; initialIntent: string; explanation: string; intentQuestion: string | null; status: string }) {
 const [intent, setIntent] = useState(initialIntent);
 const [grammaticality, setGrammaticality] = useState<ErrorAnnotation["grammaticality"] | null>(null);
 const [meaningAccuracy, setMeaningAccuracy] = useState<ErrorAnnotation["meaningAccuracy"] | null>(null);
 const [naturalness, setNaturalness] = useState<ErrorAnnotation["naturalness"] | null>(null);
 const [registerFit, setRegisterFit] = useState<ErrorAnnotation["registerFit"] | null>(null);
 const resolved = status === "accepted" || status === "rejected";
 const canAccept = !resolved && intent.trim().length > 0 && grammaticality !== null && meaningAccuracy !== null && naturalness !== null && registerFit !== null;
 const accept = () => {
  if (!canAccept || grammaticality === null || meaningAccuracy === null || naturalness === null || registerFit === null) return;
  if (intent.trim() !== initialIntent.trim()) learning.addPersonalLearningIntent(learning.state.progress.personalLearning?.hypotheses.find((item) => item.id === hypothesisId)?.attemptId ?? "", intent.trim());
  learning.resolvePersonalLearningHypothesis(hypothesisId, "accepted", { grammaticality, meaningAccuracy, naturalness, registerFit });
 };
 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader eyebrow="Personal Learning · Error review" title="Xác nhận trước khi học từ lỗi" description="Detector chỉ tạo giả thuyết. Chỉ khi ý định người học và bốn chiều chất lượng đã rõ thì hypothesis mới được chuyển thành annotation." meta={<Badge variant="default">{status}</Badge>} />
    <PersonalLearningNav />
    <Card variant="section" padding="lg" className="grid gap-3">
     <Typography as="h2" variant="sectionTitle" weight="black">Câu nguồn</Typography>
     <Typography weight="black">{originalInput}</Typography>
     <Typography tone="secondary">{explanation}</Typography>
     {intentQuestion ? <Typography tone="info" weight="bold">{intentQuestion}</Typography> : null}
    </Card>
    <Card variant="section" padding="lg" className="grid gap-4">
     <label className="grid gap-2"><Typography variant="label" weight="bold">Ý bạn muốn nói bằng tiếng Việt</Typography><Input value={intent} onChange={(event) => setIntent(event.target.value)} disabled={resolved} /></label>
     <QualityChoice label="Ngữ pháp" value={grammaticality} values={["valid", "invalid", "marked", "uncertain"]} onChange={setGrammaticality} disabled={resolved} />
     <QualityChoice label="Độ đúng nghĩa" value={meaningAccuracy} values={["preserved", "partially-preserved", "changed", "unknown"]} onChange={setMeaningAccuracy} disabled={resolved} />
     <QualityChoice label="Độ tự nhiên" value={naturalness} values={["natural", "acceptable", "awkward", "unknown"]} onChange={setNaturalness} disabled={resolved} />
     <QualityChoice label="Độ hợp văn phong" value={registerFit} values={["fits", "too-formal", "too-casual", "genre-bound", "unknown"]} onChange={setRegisterFit} disabled={resolved} />
     <div className="flex flex-wrap gap-2">
      <Button disabled={!canAccept} onClick={accept}>Xác nhận lỗi</Button>
      <Button variant="outline" disabled={resolved} onClick={() => learning.resolvePersonalLearningHypothesis(hypothesisId, "uncertain")}>Chưa đủ chắc</Button>
      <Button variant="secondary" disabled={resolved} onClick={() => learning.resolvePersonalLearningHypothesis(hypothesisId, "rejected")}>Bác giả thuyết</Button>
     </div>
    </Card>
   </main>
  </PageContainer>
 );
}

function QualityChoice<T extends string>({ label, value, values, onChange, disabled }: { label: string; value: T | null; values: readonly T[]; onChange: (value: T) => void; disabled: boolean }) {
 return (
  <fieldset className="grid gap-2">
   <Typography as="legend" variant="label" weight="bold">{label}</Typography>
   <div className="flex flex-wrap gap-2">{values.map((item) => <Button key={item} size="toolbar" variant={value === item ? "active" : "outline"} aria-pressed={value === item} disabled={disabled} onClick={() => onChange(item)}>{item}</Button>)}</div>
  </fieldset>
 );
}

export function PersonalLearningCalibrationPage() {
 const learning = useLearningState();
 const store = learning.state.progress.personalLearning ?? emptyPersonalLearningStore;
 const session = store.calibrationSession;
 const currentItem = session ? getCurrentCalibrationItem(session) : null;
 if (learning.isLoading) return <PageContainer><LoadingSurface /></PageContainer>;
 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader eyebrow="Personal Learning" title="Hiệu chuẩn" description="Mỗi câu tạo attempt và mastery evidence thật. Trả lời sai hoặc thiếu chắc chắn sẽ chèn thêm câu parallel thay vì gắn nhãn yếu ngay lập tức." />
    <PersonalLearningNav />
    {session === null || session.status === "completed" ? (
     <Card variant="section" padding="lg" className="grid gap-3">
      <Typography as="h2" variant="sectionTitle" weight="black">{session?.status === "completed" ? "Đợt hiệu chuẩn đã hoàn tất" : "Chưa có đợt hiệu chuẩn"}</Typography>
      <Typography tone="secondary">App sẽ bỏ qua các node đang AUTOMATING hoặc STABLE_TRANSFER; nếu tất cả đã ổn định thì dùng lại bộ primary để kiểm tra chuyển giao.</Typography>
      <Button onClick={learning.startOrResumePersonalLearningCalibration} size="toolbar"><Play data-icon="inline-start" />Bắt đầu</Button>
     </Card>
    ) : currentItem ? (
     <CalibrationItemForm key={`${session.id}:${currentItem.id}`} item={currentItem} index={session.currentIndex} total={session.itemIds.length} onSubmit={learning.submitPersonalLearningCalibrationAnswer} onPause={learning.pausePersonalLearningCalibration} />
    ) : (
     <Card variant="subtle" padding="lg"><Typography tone="muted">Không tìm thấy câu calibration hiện tại.</Typography></Card>
    )}
   </main>
  </PageContainer>
 );
}

function CalibrationItemForm({ item, index, total, onSubmit, onPause }: { item: NonNullable<ReturnType<typeof getCurrentCalibrationItem>>; index: number; total: number; onSubmit: ReturnType<typeof useLearningState>["submitPersonalLearningCalibrationAnswer"]; onPause: () => void }) {
 const [selectedOptionId, setSelectedOptionId] = useState("");
 const [confidence, setConfidence] = useState<Confidence | null>(null);
 const [selfCorrectionText, setSelfCorrectionText] = useState("");
 const canSubmit = selectedOptionId.length > 0 && confidence !== null;
 return (
  <Card variant="section" padding="lg" className="grid gap-5">
   <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="info">{item.knowledgeNodeId} · {item.dimension}</Badge><Typography variant="caption" tone="muted">{index + 1}/{total}</Typography></div>
   <div className="grid gap-2"><Typography as="h2" variant="sectionTitle" weight="black">{item.promptVi}</Typography><Typography variant="pageTitle" weight="black">{item.contextZh}</Typography></div>
   <div className="grid gap-2"><Typography variant="label" weight="bold">Chọn đáp án</Typography><div className="flex flex-wrap gap-2">{item.options.map((option) => <Button key={option.id} variant={selectedOptionId === option.id ? "active" : "outline"} aria-pressed={selectedOptionId === option.id} onClick={() => setSelectedOptionId(option.id)}>{option.textZh}</Button>)}</div></div>
   <div className="grid gap-2"><Typography variant="label" weight="bold">Mức chắc chắn</Typography><div className="flex flex-wrap gap-2">{(["sure", "unsure", "guess"] as const).map((itemConfidence) => <Button key={itemConfidence} size="toolbar" variant={confidence === itemConfidence ? "active" : "outline"} aria-pressed={confidence === itemConfidence} onClick={() => setConfidence(itemConfidence)}>{itemConfidence}</Button>)}</div></div>
   <div className="grid gap-2"><Typography variant="label" weight="bold">Tự sửa / giải thích thêm (không bắt buộc)</Typography><Textarea value={selfCorrectionText} onChange={(event) => setSelfCorrectionText(event.target.value)} placeholder={item.selfCorrectionPromptVi} /></div>
   <Typography tone="secondary">Câu hỏi quyết định: {item.decisionQuestionVi}</Typography>
   <div className="flex flex-wrap gap-2"><Button disabled={!canSubmit} onClick={() => { if (confidence === null) return; onSubmit({ itemId: item.id, selectedOptionId, confidence, selfCorrectionText, revisionHintLevel: 0 }); }}>Ghi nhận & tiếp tục</Button><Button variant="outline" onClick={onPause}><Pause data-icon="inline-start" />Tạm dừng</Button></div>
  </Card>
 );
}

function PersonalLearningNotFound({ title }: { title: string }) {
 return (
  <PageContainer>
   <main className="grid gap-5"><PageHeader eyebrow="Personal Learning" title={title} description="Đường dẫn không khớp dữ liệu hiện có." /><Button asChild variant="outline"><Link href="/personal-learning">Về tổng quan</Link></Button></main>
  </PageContainer>
 );
}
