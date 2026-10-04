import { Profiler, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { SplitViewEditor } from "@/components/editor/SplitViewEditor";
import { convertProseMirrorToLexical } from "@/lib/editor/editor-document";
import { Typography } from "@/components/ui/display/typography";
import type { Database } from "@/types/supabase.generated";
import type * as NotesService from "@/services/notes/notes.service";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import type { usePathname as navigationPathname } from "next/navigation";
import { clearNoteDraft, getNoteDraft } from "../local/note-draft-store";
import { useNoteEditor } from "./useNoteEditor";

// Isolated fixture owners. No real API/DB/auth/provider requests.
const ownerId = "audit-notes-owner-20261004";
const noteIds = ["audit-note-a", "audit-note-b"];
const supabase = createClient<Database>("http://127.0.0.1:43197", "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: ownerId, isResolved: true };
}
export const usePathname: typeof navigationPathname = () => "/notes";
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
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
  links: [],
 };
}
const serverNotes = new Map(noteIds.map((id) => [id, initialNote(id)]));
const requests: {
 noteId: string;
 pane: string;
 text: Parameters<typeof NotesService.updateReadingContent>[2];
}[] = [];
const held: (() => void)[] = [];
let holdWrites = false;
let failNext = false;
let commits = 0;
let lexicalMode = false;
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
export const getNoteById: typeof NotesService.getNoteById = async (_client, noteId) =>
 serverNotes.get(noteId) ?? null;
export const getNoteFolders: typeof NotesService.getNoteFolders = async () => [];
function performWrite(
 noteId: string,
 pane: string,
 text: Parameters<typeof NotesService.updateReadingContent>[2],
 apply: (note: NotesService.NoteDetail) => NotesService.NoteDetail,
) {
 requests.push({ noteId, pane, text });
 emit();
 return new Promise<boolean>((resolve) => {
  const complete = () => {
   if (failNext) {
    failNext = false;
    resolve(false);
   } else {
    const note = serverNotes.get(noteId);
    if (!note) {
     resolve(false);
     return;
    }
    serverNotes.set(noteId, apply(note));
    resolve(true);
   }
   emit();
  };
  if (holdWrites) held.push(complete);
  else complete();
  emit();
 });
}
export const updateNoteContent: typeof NotesService.updateNoteContent = async (
 _client,
 noteId,
 text,
) => performWrite(noteId, "content", text, (note) => ({ ...note, content: text }));
export const updateReadingContent: typeof NotesService.updateReadingContent = async (
 _client,
 noteId,
 text,
) => performWrite(noteId, "reading", text, (note) => ({ ...note, reading_content: text }));
export const updateNoteTitle: typeof NotesService.updateNoteTitle = async () => true;
export const updateNoteCategory: typeof NotesService.updateNoteCategory = async () => true;
export const updateSplitViewEnabled: typeof NotesService.updateSplitViewEnabled = async () => true;
export const deleteNote: typeof NotesService.deleteNote = async () => true;
export const updateNoteLibraryMetadata: typeof NotesService.updateNoteLibraryMetadata =
 async () => {};
export const deleteNoteFolder: typeof NotesService.deleteNoteFolder = async () => {};
export const updateNoteFolder: typeof NotesService.updateNoteFolder = async () => {
 throw new Error("Not used in fixture");
};
export const createNoteFolder: typeof NotesService.createNoteFolder = async () => {
 throw new Error("Not used in fixture");
};

function Probe({ noteId }: { noteId: string }) {
 const hook = useNoteEditor(noteId);
 const [error, setError] = useState("");
 return (
  <section>
   <Typography as="h1" variant="pageTitle">
    Mounted Notes hook fixture: {noteId}
   </Typography>
   {lexicalMode && hook.note ? (
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
let root = createRoot(container);
let client = new QueryClient({
 defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
let currentNote = noteIds[0] ?? "audit-note-a";
function mount() {
 root.render(
  <QueryClientProvider client={client}>
   <Profiler
    id="notes"
    onRender={() => {
     commits += 1;
     emit();
    }}
   >
    <Probe key={currentNote} noteId={currentNote} />
   </Profiler>
  </QueryClientProvider>,
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
mount();
