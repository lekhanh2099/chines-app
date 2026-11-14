import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import messages from "../../../../messages/vi/tts-studio.json";
import type { createTtsFolder, fetchTtsLibrary, saveTtsClip } from "./tts-studio-api";
import { useTtsStudioSave } from "./useTtsStudioSave";
import { buildCacheKey } from "@/lib/audio/tts-cache";

const api = vi.hoisted(() => ({
 folder: vi.fn<typeof createTtsFolder>(),
 clip: vi.fn<typeof saveTtsClip>(),
 library: vi.fn<typeof fetchTtsLibrary>(),
}));
vi.mock("./tts-studio-api", () => ({
 createTtsFolder: api.folder,
 saveTtsClip: api.clip,
 fetchTtsLibrary: api.library,
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "owner-1", isResolved: true }),
}));
const generateAudio = vi.fn<Parameters<typeof useTtsStudioSave>[0]["generateAudio"]>();
const onFolderCreated = vi.fn<Parameters<typeof useTtsStudioSave>[0]["onFolderCreated"]>();
let client: QueryClient;
const folder: Awaited<ReturnType<typeof createTtsFolder>> = {
 id: "00000000-0000-4000-8000-000000000001",
 user_id: "00000000-0000-4000-8000-000000000002",
 name: "Lesson",
 revision: 0,
 created_at: "2026-10-04T00:00:00Z",
 updated_at: "2026-10-04T00:00:00Z",
};
function controller(overrides: Partial<Parameters<typeof useTtsStudioSave>[0]> = {}) {
 const captures: ReturnType<typeof useTtsStudioSave>[] = [];
 function Probe() {
  captures.push(
   useTtsStudioSave({
    text: "  你好。  ",
    title: "  Lesson  ",
    folderName: "  Lesson  ",
    folderId: null,
    rate: 1.25,
    selectedVoice: {
     name: "Xiaoxiao",
     shortName: "zh-CN-XiaoxiaoNeural",
     gender: "Female",
     locale: "zh-CN",
    },
    generateAudio,
    onFolderCreated,
    ...overrides,
   }),
  );
  return null;
 }
 renderToStaticMarkup(
  <QueryClientProvider client={client}>
   <NextIntlClientProvider
    locale="vi"
    messages={{ TtsStudio: messages }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <Probe />
   </NextIntlClientProvider>
  </QueryClientProvider>,
 );
 const result = captures[0];
 if (!result) throw new Error("Missing save hook");
 return result;
}
beforeEach(() => {
 client = new QueryClient({
  defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
 });
 vi.resetAllMocks();
 vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
 vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
 api.folder.mockResolvedValue(folder);
 api.clip.mockResolvedValue({
  id: "00000000-0000-4000-8000-000000000003",
  user_id: folder.user_id,
  folder_id: null,
  title: "Lesson",
  text: "你好。",
  voice: "zh-CN-XiaoxiaoNeural",
  rate: 1.25,
  cache_key: buildCacheKey("你好。", "zh-CN-XiaoxiaoNeural", 1.25),
  revision: 0,
  created_at: folder.created_at,
  updated_at: folder.updated_at,
 });
});
afterEach(() => {
 client.clear();
 vi.restoreAllMocks();
});

it("waits for generated audio before persisting the canonical clip draft", async () => {
 let complete: (blob: Blob) => void = () => {};
 generateAudio.mockImplementation(
  () =>
   new Promise((resolve) => {
    complete = resolve;
   }),
 );
 const pending = controller().saveClip();
 expect(api.clip).not.toHaveBeenCalled();
 complete(new Blob(["audio"]));
 await pending;
 expect(api.clip).toHaveBeenCalledOnce();
 expect(api.clip.mock.calls[0]?.[0]).toEqual({
  folderId: null,
  title: "Lesson",
  text: "你好。",
  voice: "zh-CN-XiaoxiaoNeural",
  rate: 1.25,
  cacheKey: buildCacheKey("你好。", "zh-CN-XiaoxiaoNeural", 1.25),
 });
});
it("does not write when audio generation fails or settings are invalid", async () => {
 generateAudio.mockResolvedValue(null);
 await controller().saveClip();
 expect(api.clip).not.toHaveBeenCalled();
 generateAudio.mockClear();
 await controller({ rate: 0 }).saveClip();
 await controller({ selectedVoice: undefined }).saveClip();
 await controller({ text: "  " }).saveClip();
 expect(generateAudio).not.toHaveBeenCalled();
 expect(api.clip).not.toHaveBeenCalled();
});
it("uses the folder acknowledgement before changing the selected folder", async () => {
 let complete: (value: typeof folder) => void = () => {};
 api.folder.mockImplementationOnce(
  () =>
   new Promise((resolve) => {
    complete = resolve;
   }),
 );
 const pending = controller().saveFolder();
 await vi.waitFor(() => expect(api.folder).toHaveBeenCalledOnce());
 expect(api.folder.mock.calls[0]?.[0]).toBe("Lesson");
 expect(onFolderCreated).not.toHaveBeenCalled();
 complete(folder);
 await pending;
 expect(onFolderCreated).toHaveBeenCalledExactlyOnceWith(folder);
 api.folder.mockRejectedValueOnce(new Error("write failed"));
 await controller().saveFolder();
 expect(onFolderCreated).toHaveBeenCalledOnce();
});
