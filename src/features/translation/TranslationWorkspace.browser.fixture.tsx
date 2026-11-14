import {
 Profiler,
 useEffect,
 useMemo,
 useState,
 type ComponentProps,
 type ElementType,
} from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import type { HumanitiesDocumentResource } from "@/features/humanities/model/humanities-resource.schemas";
import messages from "../../../messages/vi/humanities-practice.json";
import englishMessages from "../../../messages/en/humanities-practice.json";
import chineseMessages from "../../../messages/zh-CN/humanities-practice.json";
import { defaultAppLocale, isAppLocale } from "@/i18n/config";
import { TranslationWorkspace } from "./TranslationWorkspace";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 Typography as ActualTypography,
 type TypographyProps,
} from "../../components/ui/display/typography";

let workspaceCommits = 0;
let sourceCommits = 0;
export function Typography<T extends ElementType = "p">(props: TypographyProps<T>) {
 if (props.children !== "Văn bản nguồn") return <ActualTypography {...props} />;
 return (
  <Profiler id="source-heading" onRender={() => sourceCommits++}>
   <ActualTypography {...props} />
  </Profiler>
 );
}

// Same MediaRecorder boundary as ShadowingRecorder.browser.fixture.tsx; no microphone access.
class FixtureRecorder extends EventTarget implements MediaRecorder {
 readonly audioBitsPerSecond = 0;
 readonly videoBitsPerSecond = 0;
 readonly mimeType = "audio/webm";
 state: MediaRecorder["state"] = "inactive";
 ondataavailable: MediaRecorder["ondataavailable"] = null;
 onerror: MediaRecorder["onerror"] = null;
 onpause: MediaRecorder["onpause"] = null;
 onresume: MediaRecorder["onresume"] = null;
 onstart: MediaRecorder["onstart"] = null;
 onstop: MediaRecorder["onstop"] = null;
 constructor(readonly stream: MediaStream) {
  super();
 }
 static isTypeSupported() {
  return true;
 }
 start() {
  this.state = "recording";
 }
 stop() {
  this.state = "inactive";
  this.ondataavailable?.call(
   this,
   new BlobEvent("dataavailable", { data: new Blob(["fixture-audio"], { type: this.mimeType }) }),
  );
  this.onstop?.call(this, new Event("stop"));
 }
 pause() {
  this.state = "paused";
 }
 resume() {
  this.state = "recording";
 }
 requestData() {}
}
window.MediaRecorder = FixtureRecorder;
Object.defineProperty(navigator, "mediaDevices", {
 configurable: true,
 value: { getUserMedia: async () => new MediaStream() },
});

// Only navigation/session/network are controlled; the workspace and timers are real.
const parameters = new URLSearchParams("document=fixture&track=interpreting");
const supabase = createClient<Database>("http://127.0.0.1:43197", "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false },
});
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: null, isResolved: true };
}
export function useSearchParams() {
 return parameters;
}
export function usePathname() {
 return "/translation";
}
export function useRouter() {
 return { push: () => {} };
}
export function Link(props: ComponentProps<"a">) {
 return <a {...props} />;
}
const timestamp = "2026-10-08T00:00:00Z";
const resource: HumanitiesDocumentResource = {
 document: {
  id: "fixture",
  lesson_id: "fixture",
  owner_id: null,
  source: "seed",
  publication_status: "published",
  kind: "humanities",
  slug: "fixture",
  unit_id: null,
  reading_number: null,
  title_zh: "口译练习",
  title_pinyin: "",
  title_vi: "Luyện phiên dịch",
  genre_vi: "",
  objectives_vi: [],
  analysis: {
   mainIdeaVi: "",
   paragraphStructureVi: [],
   logicChainVi: [],
   trapsVi: [],
   keywordsZh: [],
  },
  summary: { modelZh: "", rubricVi: [] },
  source_metadata: { source_kind: "interpreting" },
  schema_version: "1",
  imported_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  deleted_at: null,
 },
 paragraphs: [1, 2].map((order) => ({
  id: `paragraph-${order}`,
  document_id: "fixture",
  source: "seed",
  paragraph_order: order,
  zh: order === 1 ? "你好。" : "谢谢。",
  vi: order === 1 ? "Xin chào." : "Cảm ơn.",
  pinyin: "",
  role_vi: "",
  source_version: 1,
  created_at: timestamp,
  updated_at: timestamp,
 })),
 vocabulary: [],
 vocabularyLinks: [],
 exerciseGroups: [],
 assets: [],
 exerciseItems: [
  {
   id: "exercise",
   group_id: "fixture",
   source: "seed",
   item_order: 1,
   item_type: "note",
   created_at: timestamp,
   updated_at: timestamp,
   payload: {
    promptZh: "",
    promptVi: "",
    pinyin: "",
    options: [],
    answer: "",
    answerZh: "",
    answerVi: "",
    scoring: "none",
    answerSource: "fixture",
    explanationVi: "",
    evaluation: {
     mode: "interpreting",
     direction: "zh-vi",
     preparationSeconds:
      new URLSearchParams(window.location.search).get("measure") === "1" ? 30 : 3,
     maxRecordingSeconds: 30,
     replayPolicy: null,
     replayLimit: null,
     noteTakingAllowed: true,
     informationUnits: [
      {
       id: "greeting",
       type: "proposition",
       canonicalMeaningVi: "Xin chào",
       required: true,
       weight: 1,
       acceptedRealizations: ["Xin chào"],
      },
     ],
     rubric: [{ id: "meaning", labelVi: "Ý nghĩa", weight: 100, deterministic: true }],
     references: [{ id: "reference", text: "Xin chào" }],
    },
   },
  },
 ],
};
const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const controls = { refresh: () => {}, setSourceLength: (_length: number) => {} };
function Probe() {
 const [render, setRender] = useState(0);
 const [sourceLength, setSourceLength] = useState(0);
 const measuredResource = useMemo(
  () =>
   sourceLength === 0
    ? resource
    : {
       ...resource,
       paragraphs: resource.paragraphs.map((paragraph, index) =>
        index === 0 ? { ...paragraph, zh: "汉".repeat(sourceLength) } : paragraph,
       ),
      },
  [sourceLength],
 );
 useEffect(() => {
  controls.refresh = () => setRender((current) => current + 1);
  controls.setSourceLength = setSourceLength;
  return () => {
   controls.refresh = () => {};
   controls.setSourceLength = () => {};
  };
 }, []);
 return (
  <section data-render={render} data-source-length={sourceLength}>
   <Profiler id="workspace" onRender={() => workspaceCommits++}>
    <TranslationWorkspace
     initialDocuments={[resource.document]}
     initialResource={measuredResource}
    />
   </Profiler>
  </section>
 );
}
const requestedLocale = new URLSearchParams(window.location.search).get("locale");
const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultAppLocale;
const localizedMessages = { vi: messages, en: englishMessages, "zh-CN": chineseMessages };
root.render(
 <NextIntlClientProvider
  locale={locale}
  messages={{ HumanitiesPractice: localizedMessages[locale] }}
  timeZone="Asia/Ho_Chi_Minh"
 >
  <QueryClientProvider client={queryClient}>
   <MandarinTtsProvider>
    <Probe />
   </MandarinTtsProvider>
  </QueryClientProvider>
 </NextIntlClientProvider>,
);
const harness = {
 refresh: () => controls.refresh(),
 setSourceLength: (length: number) => controls.setSourceLength(length),
 clearMeasurements() {
  workspaceCommits = 0;
  sourceCommits = 0;
 },
 measurements: () => ({ workspace: workspaceCommits, source: sourceCommits }),
 refetchHistory: () =>
  queryClient.refetchQueries({
   queryKey: hanzihomeQueryKeys.practiceAttempts(null, "translation", "paragraph-2"),
  }),
 unmount() {
  root.unmount();
  queryClient.clear();
 },
};
declare global {
 interface Window {
  translationHarness: typeof harness;
 }
}
window.translationHarness = harness;
