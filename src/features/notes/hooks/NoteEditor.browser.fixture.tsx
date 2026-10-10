import { NextIntlClientProvider } from "next-intl";
import { loadAppMessages } from "@/i18n/messages";
import { DbNoteSchema } from "@/types/database";
import { NoteConflictError, NoteFolderColorSchema } from "../../../services/notes/notes.service";
export { NoteConflictError, NoteFolderColorSchema };
import { NoteConflictDialog } from "../components/NoteConflictDialog";
import { NoteTabContainer } from "../components/NoteTabContainer";
import { NotesWorkspace } from "../components/NotesWorkspace";
import { NoteEditorPanel as ActualNoteEditorPanel } from "../components/NoteEditorPanel";
import "@/app/globals.css";
import { Profiler, useState, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { createClient as browserCreateClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { SplitViewEditor } from "@/components/editor/SplitViewEditor";
import { LessonSplitNoteEditor } from "@/features/hanzihome/components/notes/LessonSplitNoteEditor";
import { convertProseMirrorToLexical } from "@/lib/editor/editor-document";
import { Typography } from "@/components/ui/display/typography";
import { AppToaster } from "@/components/layout/runtime/AppToaster";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import type { getClientSessionUser as sessionUser } from "@/lib/supabase/client-session";
import type { Database } from "@/types/supabase.generated";
import type * as NotesService from "@/services/notes/notes.service";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import type { usePathname as navigationPathname } from "next/navigation";
import type { useSearchParams as navigationSearchParams } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/dist/client/components/navigation.react-server";
import type { AppLocale } from "@/i18n/config";
import type { HanziHomeCatalogData } from "@/features/hanzihome/types";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { useRouter as navigationRouter } from "@/i18n/navigation";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { splitViewStore } from "@/stores/notes/split-view-store";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { noteQueryKeys } from "../query-keys";
import {
 clearNoteDraft,
 getNoteDraft,
 getOtherNoteDrafts,
 openNotesDraftDb,
 saveNoteDraft,
 type NoteDraftRecord,
} from "../local/note-draft-store";
import { useNoteEditor as actualUseNoteEditor } from "./useNoteEditor";

// Isolated fixture owners. No real API/DB/auth/provider requests.
const ownerId = "audit-notes-owner-20261004";
const navigations: string[] = [];
let quickGuest = false;
export const getClientSessionUser: typeof sessionUser = async () =>
 quickGuest
  ? null
  : {
     id: ownerId,
     aud: "authenticated",
     app_metadata: {},
     user_metadata: {},
     created_at: "2026-10-10T00:00:00Z",
    };
const noteIds = ["audit-note-a", "audit-note-b"];
const supabase = createSupabaseClient<Database>("http://127.0.0.1:43197", "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
export const createClient: typeof browserCreateClient = () => supabase;
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: ownerId, isResolved: true };
}
export const usePathname: typeof navigationPathname = () => "/notes";
export const useSearchParams: typeof navigationSearchParams = () =>
 new ReadonlyURLSearchParams(location.search);
const fixtureRouter: ReturnType<typeof navigationRouter> = {
 push: (href) => {
  if (typeof href === "string") navigations.push(href);
 },
 replace: () => {},
 prefetch: () => {},
 back: () => {},
 forward: () => {},
 refresh: () => {},
 bfcacheId: "notes-fixture",
};
export function useRouter(): ReturnType<typeof navigationRouter> {
 return fixtureRouter;
}
export default function FixtureLink(props: ComponentProps<"a">) {
 return <a {...props} />;
}
export { FixtureLink as Link };
function initialNote(id: string): NotesService.NoteDetail {
 return {
  id,
  user_id: ownerId,
  title: "Fixture note",
  category: "general",
  tags: [],
  content: { text: "server" },
  reading_content: null,
  folder_id: null,
  split_view_enabled: false,
  reading_status: null,
  linked_lesson_id: null,
  is_published: false,
  status: "draft",
  short_id: null,
  source_url: null,
  source_host: null,
  source_label: null,
  source_author: null,
  source_published_at: null,
  source_captured_at: null,
  revision: 0,
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
  links: [],
 };
}
const storedServerNotes = sessionStorage.getItem("notes-fixture-server");
const serverNotes = new Map(
 (storedServerNotes
  ? DbNoteSchema.array()
     .parse(JSON.parse(storedServerNotes))
     .map((note) => ({ ...note, links: [] }))
  : noteIds.map(initialNote)
 ).map((note) => [note.id, note]),
);
const requests: {
 noteId: string;
 pane: string;
 text: Parameters<typeof NotesService.updateReadingContent>[2];
}[] = [];
const held: (() => void)[] = [];
let holdWrites = false;
let failNext = false;
let commits = 0;
let lexicalMode = sessionStorage.getItem("notes-fixture-lexical") === "1";
let lessonMode = false;
let tabsMode = false;
let libraryMode = false;
let creationEnabled = false;
let holdCreation = false;
let failFolderCreation = false;
let failFolderUpdate = false;
let failFolderDelete = false;
let failNoteCreation = false;
const heldCreation: (() => void)[] = [];
const createdNotes: Parameters<typeof NotesService.createNote>[2][] = [];
const createdFolders: Parameters<typeof NotesService.createNoteFolder>[2][] = [];
const updatedFolders: {
 id: Parameters<typeof NotesService.updateNoteFolder>[1];
 changes: Parameters<typeof NotesService.updateNoteFolder>[2];
}[] = [];
const deletedFolders: Parameters<typeof NotesService.deleteNoteFolder>[1][] = [];
const metadataWrites: {
 noteId: Parameters<typeof NotesService.updateNoteLibraryMetadata>[1];
 input: Parameters<typeof NotesService.updateNoteLibraryMetadata>[2];
 revision: Parameters<typeof NotesService.updateNoteLibraryMetadata>[3];
 owner: Parameters<typeof NotesService.updateNoteLibraryMetadata>[4];
}[] = [];
let holdLibraryReads = false;
let failLibraryReads = false;
const heldLibraryReads: (() => void)[] = [];
let libraryNotes: NotesService.NoteListItem[] = [];
const libraryFolders: NotesService.NoteFolder[] = [
 {
  id: "reading-folder",
  userId: ownerId,
  parentId: null,
  name: "Reading folder",
  color: "purple",
  position: 0,
  createdAt: "2026-10-10T00:00:00Z",
  updatedAt: "2026-10-10T00:00:00Z",
 },
 {
  id: "other-folder",
  userId: ownerId,
  parentId: "reading-folder",
  name: "Other folder",
  color: "blue",
  position: 1,
  createdAt: "2026-10-10T00:00:00Z",
  updatedAt: "2026-10-10T00:00:00Z",
 },
];
const panelCommits = new Map<string, number>();
const panelRenderCounts = new Map<string, number>();
const detailReads: string[] = [];
let folderReads = 0;
let listReads = 0;
const registeredListeners = new Map<
 EventTarget,
 Map<string, Set<Parameters<typeof EventTarget.prototype.addEventListener>[1]>>
>();
const originalAddListener = EventTarget.prototype.addEventListener;
const originalRemoveListener = EventTarget.prototype.removeEventListener;
EventTarget.prototype.addEventListener = function (
 this: EventTarget,
 ...args: Parameters<typeof originalAddListener>
) {
 const [type, listener, options] = args;
 if (
  listener &&
  ((this === window && (type === "beforeunload" || type === "open-note-tab")) ||
   (this === document && type === "keydown"))
 ) {
  const capture = typeof options === "boolean" ? options : (options?.capture ?? false);
  const targetListeners =
   registeredListeners.get(this) ??
   new Map<string, Set<Parameters<typeof originalAddListener>[1]>>();
  const key = `${type}:${capture}`;
  const listeners =
   targetListeners.get(key) ?? new Set<Parameters<typeof originalAddListener>[1]>();
  listeners.add(listener);
  targetListeners.set(key, listeners);
  registeredListeners.set(this, targetListeners);
 }
 originalAddListener.apply(this, args);
};
EventTarget.prototype.removeEventListener = function (
 this: EventTarget,
 ...args: Parameters<typeof originalRemoveListener>
) {
 const [type, listener, options] = args;
 const capture = typeof options === "boolean" ? options : (options?.capture ?? false);
 registeredListeners.get(this)?.get(`${type}:${capture}`)?.delete(listener);
 originalRemoveListener.apply(this, args);
};
export function NoteEditorPanel(props: ComponentProps<typeof ActualNoteEditorPanel>) {
 return (
  <Profiler
   id={props.noteId}
   onRender={() => panelCommits.set(props.noteId, (panelCommits.get(props.noteId) ?? 0) + 1)}
  >
   <ActualNoteEditorPanel {...props} />
  </Profiler>
 );
}
export function useNoteEditor(noteId: string): ReturnType<typeof actualUseNoteEditor> {
 panelRenderCounts.set(noteId, (panelRenderCounts.get(noteId) ?? 0) + 1);
 return actualUseNoteEditor(noteId);
}
const exported = document.createElement("pre");
exported.id = "exported-note";
const createUrl = URL.createObjectURL.bind(URL);
URL.createObjectURL = (blob) => {
 if (blob instanceof Blob && blob.type === "application/json") {
  void blob.text().then((payload) => {
   exported.textContent = payload;
  });
 }
 return createUrl(blob);
};
const report = document.createElement("pre");
report.id = "fixture-evidence";
const serverState = document.createElement("pre");
serverState.id = "server-notes";
const controls = document.createElement("nav");
const container = document.createElement("main");
document.body.append(controls, container, report, serverState, exported);

function lexicalDocument(text: string) {
 return convertProseMirrorToLexical({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
 });
}
function emit() {
 sessionStorage.setItem("notes-fixture-server", JSON.stringify([...serverNotes.values()]));
 const server = [...serverNotes.values()].map((note) => ({
  id: note.id,
  content: note.content,
  reading: note.reading_content,
 }));
 serverState.textContent = JSON.stringify(server, null, 2);
 report.textContent = JSON.stringify(
  {
   commits,
   held: held.length,
   requests,
   server,
  },
  null,
  2,
 );
}
export const getNoteById: typeof NotesService.getNoteById = async (_client, noteId) => {
 detailReads.push(noteId);
 return serverNotes.get(noteId) ?? null;
};
export const getUserNotes: typeof NotesService.getUserNotes = async () => {
 listReads += 1;
 if (libraryMode) {
  return new Promise((resolve, reject) => {
   const complete = () =>
    failLibraryReads ? reject(new Error("Library transport failed")) : resolve(libraryNotes);
   if (holdLibraryReads) heldLibraryReads.push(complete);
   else complete();
  });
 }
 return [...serverNotes.values()];
};
export const getNotesByCategory: typeof NotesService.getNotesByCategory = async (
 _client,
 _owner,
 category,
) => [...serverNotes.values()].filter((note) => note.category === category);
export const getNoteFolders: typeof NotesService.getNoteFolders = async () => {
 folderReads += 1;
 if (libraryMode) {
  return new Promise((resolve, reject) => {
   const complete = () =>
    failLibraryReads
     ? reject(new Error("Folder transport failed"))
     : resolve(libraryFolders.map((folder) => ({ ...folder })));
   if (holdLibraryReads) heldLibraryReads.push(complete);
   else complete();
  });
 }
 return [];
};
export const createNote: typeof NotesService.createNote = async (_client, owner, input) => {
 if (!creationEnabled) throw new Error("Creation is outside this read-only library fixture");
 createdNotes.push(input);
 return new Promise((resolve, reject) => {
  const complete = () => {
   if (failNoteCreation) {
    reject(new Error("Create note failed"));
    return;
   }
   const note = {
    ...initialNote(`created-note-${createdNotes.length}`),
    user_id: owner,
    title: input.title,
    category: input.category ?? "general",
    tags: input.tags,
    content: input.content ?? lexicalDocument(""),
    reading_content: input.readingContent ?? null,
    split_view_enabled: input.splitViewEnabled ?? false,
    reading_status: input.readingStatus ?? null,
    folder_id: input.folderId ?? null,
   };
   serverNotes.set(note.id, note);
   resolve(note);
  };
  if (holdCreation) heldCreation.push(complete);
  else complete();
 });
};
function performWrite(
 noteId: string,
 pane: string,
 text: Parameters<typeof NotesService.updateReadingContent>[2],
 apply: (note: NotesService.NoteDetail) => NotesService.NoteDetail,
 expectedRevision: number,
 expectedOwner: string,
) {
 requests.push({ noteId, pane, text });
 emit();
 return new Promise<Awaited<ReturnType<typeof NotesService.updateNoteContent>>>(
  (resolve, reject) => {
   const complete = () => {
    if (failNext) {
     failNext = false;
     reject(new Error("Failed to save content"));
    } else {
     const note = serverNotes.get(noteId);
     if (!note) {
      reject(new Error("Note not found"));
      return;
     }
     if (expectedOwner !== ownerId) {
      reject(new Error("Owner mismatch"));
      return;
     }
     if (note.revision !== expectedRevision) {
      reject(new NoteConflictError(note));
      return;
     }
     const saved = { ...apply(note), revision: note.revision + 1 };
     serverNotes.set(noteId, saved);
     if (libraryMode)
      libraryNotes = libraryNotes.map((item) => (item.id === noteId ? saved : item));
     resolve(saved);
    }
    emit();
   };
   if (holdWrites) held.push(complete);
   else complete();
   emit();
  },
 );
}
export const updateNoteContent: typeof NotesService.updateNoteContent = async (
 _client,
 noteId,
 text,
 revision,
 owner,
) => performWrite(noteId, "content", text, (note) => ({ ...note, content: text }), revision, owner);
export const updateReadingContent: typeof NotesService.updateReadingContent = async (
 _client,
 noteId,
 text,
 revision,
 owner,
) =>
 performWrite(
  noteId,
  "reading",
  text,
  (note) => ({ ...note, reading_content: text }),
  revision,
  owner,
 );
export const updateNoteTitle: typeof NotesService.updateNoteTitle = async (
 _client,
 noteId,
 title,
 revision,
 owner,
) => performWrite(noteId, "title", null, (note) => ({ ...note, title }), revision, owner);
export const updateNoteCategory: typeof NotesService.updateNoteCategory = async (
 _client,
 noteId,
 category,
 revision,
 owner,
) => performWrite(noteId, "category", null, (note) => ({ ...note, category }), revision, owner);
export const updateSplitViewEnabled: typeof NotesService.updateSplitViewEnabled = async (
 _client,
 noteId,
 enabled,
 revision,
 owner,
) =>
 performWrite(
  noteId,
  "split",
  null,
  (note) => ({ ...note, split_view_enabled: enabled }),
  revision,
  owner,
 );
export const deleteNote: typeof NotesService.deleteNote = async () => true;
export const updateNoteLibraryMetadata: typeof NotesService.updateNoteLibraryMetadata = async (
 _client,
 noteId,
 input,
 revision,
 owner,
) => {
 metadataWrites.push({ noteId, input, revision, owner });
 return performWrite(
  noteId,
  "metadata",
  null,
  (note) => ({
   ...note,
   title: input.title === undefined ? note.title : input.title,
   reading_status: input.readingStatus === undefined ? note.reading_status : input.readingStatus,
   folder_id: input.folderId === undefined ? note.folder_id : input.folderId,
   source_url: input.source === undefined ? note.source_url : (input.source?.url ?? null),
   source_host: input.source === undefined ? note.source_host : (input.source?.host ?? null),
   source_label: input.source === undefined ? note.source_label : (input.source?.label ?? null),
   source_author: input.source === undefined ? note.source_author : (input.source?.author ?? null),
   source_published_at:
    input.source === undefined ? note.source_published_at : (input.source?.publishedAt ?? null),
   source_captured_at:
    input.source === undefined ? note.source_captured_at : (input.source?.capturedAt ?? null),
  }),
  revision,
  owner,
 );
};
export const deleteNoteFolder: typeof NotesService.deleteNoteFolder = async (_client, id) => {
 if (!creationEnabled) throw new Error("Not used in fixture");
 deletedFolders.push(id);
 return new Promise((resolve, reject) => {
  const complete = () => {
   if (failFolderDelete) {
    reject(new Error("Delete folder failed"));
    return;
   }
   const index = libraryFolders.findIndex((folder) => folder.id === id);
   if (index >= 0) libraryFolders.splice(index, 1);
   for (const [position, folder] of libraryFolders.entries()) {
    if (folder.parentId === id) libraryFolders[position] = { ...folder, parentId: null };
   }
   libraryNotes = libraryNotes.map((note) =>
    note.folder_id === id ? { ...note, folder_id: null } : note,
   );
   resolve();
  };
  if (holdCreation) heldCreation.push(complete);
  else complete();
 });
};
export const updateNoteFolder: typeof NotesService.updateNoteFolder = async (
 _client,
 id,
 changes,
) => {
 if (!creationEnabled) throw new Error("Not used in fixture");
 updatedFolders.push({ id, changes });
 return new Promise((resolve, reject) => {
  const complete = () => {
   if (failFolderUpdate) {
    reject(new Error("Update folder failed"));
    return;
   }
   const index = libraryFolders.findIndex((folder) => folder.id === id);
   const folder = libraryFolders[index];
   if (!folder) {
    reject(new Error("Missing fixture folder"));
    return;
   }
   const saved = {
    ...folder,
    name: changes.name === undefined ? folder.name : changes.name.trim(),
    color: changes.color ?? folder.color,
    parentId: changes.parentId === undefined ? folder.parentId : changes.parentId,
    position: changes.position ?? folder.position,
   };
   libraryFolders[index] = saved;
   resolve(saved);
  };
  if (holdCreation) heldCreation.push(complete);
  else complete();
 });
};
export const createNoteFolder: typeof NotesService.createNoteFolder = async (
 _client,
 owner,
 input,
) => {
 if (!creationEnabled) throw new Error("Not used in fixture");
 createdFolders.push(input);
 return new Promise((resolve, reject) => {
  const complete = () => {
   if (failFolderCreation) {
    reject(new Error("Create folder failed"));
    return;
   }
   const folder: NotesService.NoteFolder = {
    id: `created-folder-${createdFolders.length}`,
    userId: owner,
    parentId: input.parentId ?? null,
    name: input.name.trim(),
    color: input.color ?? "purple",
    position: input.position ?? 0,
    createdAt: "2026-10-10T00:00:00Z",
    updatedAt: "2026-10-10T00:00:00Z",
   };
   libraryFolders.push(folder);
   resolve(folder);
  };
  if (holdCreation) heldCreation.push(complete);
  else complete();
 });
};

function Probe({ noteId }: { noteId: string }) {
 const hook = useNoteEditor(noteId);
 const [error, setError] = useState("");
 return (
  <section>
   {hook.conflict && hook.note ? (
    <NoteConflictDialog
     localNote={hook.note}
     serverNote={hook.conflict}
     onResolve={hook.resolveConflict}
     recoverableDrafts={hook.recoverableDrafts}
     onRecover={hook.recoverDraft}
    />
   ) : null}
   <Typography as="h1" variant="pageTitle">
    Mounted Notes hook fixture: {noteId}
   </Typography>
   {lexicalMode && hook.note && !hook.isLoading ? (
    <SplitViewEditor
     key={hook.importVersion}
     noteId={noteId}
     noteContent={hook.noteContent}
     readingContent={hook.readingContent}
     onNoteChange={hook.handleChange}
     onReadingChange={hook.handleReadingChange}
     readOnly={hook.isImporting}
     toolbarVisible={false}
    />
   ) : lexicalMode ? (
    <Typography as="p">Loading Lexical fixture</Typography>
   ) : (
    <>
     <label>
      Content
      <Input
       aria-label="Content"
       value={typeof hook.noteContent?.text === "string" ? hook.noteContent.text : ""}
       onChange={(event) => hook.handleChange({ text: event.target.value })}
      />
     </label>
     <label>
      Reading
      <Input
       aria-label="Reading"
       value={typeof hook.readingContent?.text === "string" ? hook.readingContent.text : ""}
       onChange={(event) => hook.handleReadingChange({ text: event.target.value })}
      />
     </label>
    </>
   )}
   <Typography as="p" role="status">
    {hook.displaySaveStatus}
   </Typography>
   <Button onClick={hook.exportNote}>Export latest</Button>
   <Button
    disabled={hook.isImporting}
    onClick={() => {
     void hook
      .importNote(
       new File(
        [
         JSON.stringify({
          version: 1,
          note: {
           title: "Fixture note",
           category: "general",
           content: lexicalMode ? lexicalDocument("import A") : { text: "import A" },
           readingContent: lexicalMode
            ? lexicalDocument("import reading")
            : { text: "import reading" },
          },
         }),
        ],
        "fixture.json",
       ),
      )
      .catch((failure: Error) => setError(failure.message));
    }}
   >
    Import A
   </Button>
   <Button
    onClick={() => {
     void hook.retrySave().catch((failure: Error) => setError(failure.message));
    }}
   >
    Retry save
   </Button>
   {error ? (
    <Typography as="p" role="alert">
     {error}
    </Typography>
   ) : null}
  </section>
 );
}
let messages = await loadAppMessages("vi");
let fixtureLocale: AppLocale = "vi";
let root = createRoot(container);
let client = new QueryClient({
 defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
let currentNote = noteIds[0] ?? "audit-note-a";
let exportHeaderEnabled = false;
function FixtureHeaderToolbar() {
 return (
  <header className="shrink-0">{useSelector(headerToolbarStore, (state) => state.content)}</header>
 );
}
function mount() {
 const workspace = (
  <Profiler
   id="notes"
   onRender={() => {
    commits += 1;
    emit();
   }}
  >
   {libraryMode ? (
    <NotesWorkspace />
   ) : tabsMode ? (
    <NoteTabContainer />
   ) : lessonMode ? (
    <LessonSplitNoteEditor key={currentNote} noteId={currentNote} />
   ) : (
    <Probe key={currentNote} noteId={currentNote} />
   )}
  </Profiler>
 );
 root.render(
  <NextIntlClientProvider locale={fixtureLocale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
   <QueryClientProvider client={client}>
    {exportHeaderEnabled ? (
     <div className="flex h-dvh min-h-0 flex-col">
      <FixtureHeaderToolbar />
      <div className="min-h-0 flex-1">{workspace}</div>
     </div>
    ) : (
     workspace
    )}
    {creationEnabled ? <AppToaster /> : null}
   </QueryClientProvider>
  </NextIntlClientProvider>,
 );
}
function button(label: string, action: () => void) {
 const control = document.createElement("button");
 control.textContent = label;
 control.onclick = action;
 controls.append(control);
}
button("Hold transport", () => {
 holdWrites = true;
 emit();
});
button("Resume transport", () => {
 holdWrites = false;
 while (held.length) held.shift()?.();
 emit();
});
button("Fail next transport", () => {
 failNext = true;
 emit();
});
button("Unmount", () => {
 root.unmount();
 emit();
});
button("Remount", () => {
 root = createRoot(container);
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 mount();
});
button("Switch note", () => {
 currentNote = currentNote === "audit-note-a" ? "audit-note-b" : "audit-note-a";
 mount();
});
button("Mount Lexical split", () => {
 lexicalMode = true;
 sessionStorage.setItem("notes-fixture-lexical", "1");
 root.unmount();
 serverNotes.set(currentNote, {
  ...initialNote(currentNote),
  content: lexicalDocument("lexical server"),
  reading_content: lexicalDocument("reading server"),
 });
 root = createRoot(container);
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 mount();
});
button("Write from another device", () => {
 const current = serverNotes.get(currentNote);
 if (!current) throw new Error("Missing fixture note");
 serverNotes.set(currentNote, {
  ...current,
  content: lexicalDocument("other device version"),
  reading_content: lexicalDocument("other device reading"),
  revision: current.revision + 1,
 });
 emit();
});
button("Mount lesson note", () => {
 lessonMode = true;
 const current = serverNotes.get(currentNote);
 if (!current) throw new Error("Missing fixture note");
 serverNotes.set(currentNote, { ...current, split_view_enabled: true });
 client.removeQueries();
 mount();
});
button("Read local draft", () => {
 void getNoteDraft(ownerId, currentNote).then((draft) => {
  const output = document.createElement("pre");
  output.id = "local-draft";
  output.textContent = JSON.stringify(draft);
  document.querySelector("#local-draft")?.remove();
  document.body.append(output);
 });
});
button("Clear fixture drafts", () => {
 void Promise.all(noteIds.map((id) => clearNoteDraft(ownerId, id))).then(() => {
  document.querySelector("#local-draft")?.remove();
  emit();
 });
});
const draftHarness = {
 current: () => getNoteDraft(ownerId, currentNote),
 others: () => getOtherNoteDrafts(ownerId, currentNote),
 async seedLegacy() {
  const draft: NoteDraftRecord = {
   key: `${ownerId}:${currentNote}`,
   userId: ownerId,
   noteId: currentNote,
   content: lexicalDocument("legacy recovery"),
   readingContent: lexicalDocument("legacy reading"),
   updatedAt: Date.now(),
  };
  const db = await openNotesDraftDb();
  await new Promise<void>((resolve, reject) => {
   const tx = db.transaction("note_drafts", "readwrite");
   tx.objectStore("note_drafts").put(draft);
   tx.oncomplete = () => resolve();
   tx.onerror = () => reject(tx.error);
   tx.onabort = () => reject(tx.error);
  });
 },
};
const scaleNoteIds = Array.from({ length: 20 }, (_, index) => `audit-scale-note-${index + 1}`);
const tabHarness = {
 mount(renderHeader = false) {
  root.unmount();
  client.clear();
  client = new QueryClient({
   defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  root = createRoot(container);
  tabsMode = true;
  exportHeaderEnabled = renderHeader;
  noteTabsStore.actions.setOwner(ownerId);
  noteTabsStore.actions.closeAll();
  for (const id of scaleNoteIds) {
   serverNotes.set(id, { ...initialNote(id), title: id, content: lexicalDocument(id) });
   splitViewStore.actions.setSplitView(id, false);
  }
  detailReads.length = 0;
  folderReads = 0;
  listReads = 0;
  panelCommits.clear();
  mount();
 },
 open(count: number) {
  for (const id of scaleNoteIds.slice(0, count)) noteTabsStore.actions.openTab(id, id);
 },
 activate: noteTabsStore.actions.setActive,
 closeAll: noteTabsStore.actions.closeAll,
 toggleSplit: splitViewStore.actions.toggleSplitView,
 measureSplitToggle(noteId: string) {
  // Read only commits caused by this store transition. Later Query/Lexical
  // work belongs to independent lifecycle measurements, not its fan-out.
  flushSync(() => {});
  panelCommits.clear();
  panelRenderCounts.clear();
  flushSync(() => splitViewStore.actions.toggleSplitView(noteId));
  return {
   panelCommits: [...panelCommits.entries()],
   panelRenderCounts: [...panelRenderCounts.entries()],
  };
 },
 snapshot() {
  const details = client.getQueryCache().findAll({ queryKey: ["notes", ownerId, "detail"] });
  const beforeUnload = registeredListeners.get(window)?.get("beforeunload:false")?.size ?? 0;
  const keydown = registeredListeners.get(document)?.get("keydown:false")?.size ?? 0;
  const openTab = registeredListeners.get(window)?.get("open-note-tab:false")?.size ?? 0;
  return {
   tabs: noteTabsStore.get().tabs.length,
   editors: container.querySelectorAll("[data-editor-wrapper]").length,
   visibleEditors: [...container.querySelectorAll("[data-editor-wrapper]")].filter(
    (editor) => editor instanceof HTMLElement && editor.offsetHeight > 0,
   ).length,
   domNodes: container.querySelectorAll("*").length,
   cachedDetails: details.length,
   activeDetails: details.filter((query) => query.getObserversCount() > 0).length,
   fetchingNotes: client.isFetching({ queryKey: noteQueryKeys.root(ownerId) }),
   pendingWrites: client.isMutating(),
   beforeUnload,
   keydown,
   openTab,
   detailReads: detailReads.length,
   folderReads,
   listReads,
   cachedDetailBytes: new Blob([
    JSON.stringify(
     scaleNoteIds.map((id) =>
      client.getQueryData<NotesService.NoteDetail>(noteQueryKeys.detail(ownerId, id)),
     ),
    ),
   ]).size,
   panelCommits: [...panelCommits.entries()],
   panelRenderCounts: [...panelRenderCounts.entries()],
  };
 },
 draft: (id: string) => getNoteDraft(ownerId, id),
};
const libraryHarness = {
 async mount(size: number, locale: AppLocale = "vi", hold = false) {
  toast.dismiss();
  root.unmount();
  client.clear();
  client = new QueryClient({
   defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  root = createRoot(container);
  libraryMode = true;
  holdLibraryReads = hold;
  failLibraryReads = false;
  fixtureLocale = locale;
  messages = await loadAppMessages(locale);
  libraryNotes = Array.from({ length: size }, (_, index) => ({
   ...initialNote(`library-note-${index}`),
   title: `Library note ${index}`,
   category: index < 30 ? "grammar" : "vocabulary",
   reading_status: index < 30 ? "reading" : "completed",
   source_host: index < 30 ? "alpha.test" : "beta.test",
   source_label: index < 30 ? "Alpha" : "Beta",
   folder_id: index < 30 ? "reading-folder" : "other-folder",
   updated_at: index < 30 ? "2026-09-15T12:00:00Z" : "2026-10-15T12:00:00Z",
  }));
  const catalog: HanziHomeCatalogData = {
   source: "empty",
   courses: [],
   books: [],
   lessons: [],
   radicals: [],
   meta: {
    app: "hanzihome",
    dataset: "fixture",
    version: "0",
    generatedAt: "",
    sourceFiles: [],
    counts: { lessons: 0, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
   },
  };
  client.setQueryData(hanzihomeQueryKeys.catalog(true, false), catalog);
  listReads = 0;
  folderReads = 0;
  detailReads.length = 0;
  container.style.height = "100vh";
  // Match the app layout's bounded shell: diagnostic controls/logs must not
  // create a second document scrollbar outside the real library viewport.
  container.className = "app-shell h-dvh w-full min-w-0 overflow-hidden";
  controls.hidden = true;
  report.hidden = true;
  serverState.hidden = true;
  exported.hidden = true;
  document.body.style.overflow = "hidden";
  mount();
 },
 release(fail = false) {
  failLibraryReads = fail;
  holdLibraryReads = false;
  while (heldLibraryReads.length) heldLibraryReads.shift()?.();
 },
 async refresh(fail: boolean) {
  failLibraryReads = fail;
  await Promise.all([
   client.refetchQueries({ queryKey: noteQueryKeys.listRoot(ownerId) }),
   client.refetchQueries({ queryKey: noteQueryKeys.folders(ownerId) }),
  ]);
 },
 shrink(size: number) {
  libraryNotes = libraryNotes.slice(0, size);
  client.setQueryData(noteQueryKeys.list(ownerId), libraryNotes);
 },
 snapshot() {
  return {
   rows: container.querySelectorAll("article").length,
   domNodes: container.querySelectorAll("*").length,
   listReads,
   folderReads,
   detailReads: detailReads.length,
   heldReads: heldLibraryReads.length,
   serverWrites: requests.length,
   firstTitle: container.querySelector("article")?.textContent,
   lastTitle: container.querySelector("article:last-child")?.textContent,
  };
 },
 configureCreation(hold = false, failFolder = false, failNote = false) {
  creationEnabled = true;
  holdCreation = hold;
  failFolderCreation = failFolder;
  failNoteCreation = failNote;
  createdNotes.length = 0;
  createdFolders.length = 0;
  navigations.length = 0;
  mount();
 },
 releaseCreation: () => heldCreation.shift()?.(),
 creationSnapshot: () => ({
  notes: createdNotes,
  folders: createdFolders,
  navigations,
  held: heldCreation.length,
 }),
 configureQuick(guest = false, focus = false, hold = false, fail = false) {
  quickGuest = guest;
  focusModeStore.actions.setEnabled(focus);
  this.configureCreation(hold, false, fail);
 },
 configureFolderWrites(hold = false, failUpdate = false, failDelete = false) {
  failFolderUpdate = failUpdate;
  failFolderDelete = failDelete;
  updatedFolders.length = 0;
  deletedFolders.length = 0;
  this.configureCreation(hold);
 },
 folderWrites: () => ({ updates: updatedFolders, deletes: deletedFolders }),
 async configureMetadata(hold = false, fail = false) {
  creationEnabled = true;
  holdWrites = hold;
  failNext = fail;
  metadataWrites.length = 0;
  const summary = libraryNotes[0];
  if (!summary) throw new Error("Missing metadata fixture note");
  const note = { ...initialNote(summary.id), ...summary };
  serverNotes.set(note.id, note);
  const content = lexicalDocument("dirty content");
  const readingContent = lexicalDocument("dirty reading");
  client.setQueryData(noteQueryKeys.detail(ownerId, note.id), {
   ...note,
   content,
   reading_content: readingContent,
  });
  await clearNoteDraft(ownerId, note.id);
  if (
   !(await saveNoteDraft(ownerId, note.id, {
    baseRevision: note.revision,
    content,
    readingContent,
   }))
  )
   throw new Error("Could not seed metadata fixture draft");
  mount();
 },
 releaseMetadata() {
  holdWrites = false;
  held.shift()?.();
 },
 writeMetadataFromOtherDevice(title: string) {
  const note = serverNotes.get("library-note-0");
  if (!note) throw new Error("Missing metadata fixture note");
  serverNotes.set(note.id, {
   ...note,
   title,
   source_url: "https://server.example/article",
   source_host: "server.example",
   source_label: "Server source",
   source_captured_at: "2026-10-09T00:00:00Z",
   revision: note.revision + 1,
  });
 },
 async metadataSnapshot() {
  return {
   writes: metadataWrites,
   server: serverNotes.get("library-note-0"),
   cached: client.getQueryData<NotesService.NoteDetail>(
    noteQueryKeys.detail(ownerId, "library-note-0"),
   ),
   draft: await getNoteDraft(ownerId, "library-note-0"),
  };
 },
};
declare global {
 interface Window {
  notesDraftHarness: typeof draftHarness;
  notesTabHarness: typeof tabHarness;
  notesLibraryHarness: typeof libraryHarness;
 }
}
window.notesDraftHarness = draftHarness;
window.notesTabHarness = tabHarness;
window.notesLibraryHarness = libraryHarness;
mount();
