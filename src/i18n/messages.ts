import type { AppLocale } from "./config";

async function loadViMessages() {
 const [
  common,
  shell,
  auth,
  inspector,
  settings,
  notes,
  noteTabs,
  noteEditor,
  dictionary,
  reader,
  readerStudy,
  readerDocument,
 ] = await Promise.all([
  import("../../messages/vi/common.json"),
  import("../../messages/vi/shell.json"),
  import("../../messages/vi/auth.json"),
  import("../../messages/vi/inspector.json"),
  import("../../messages/vi/settings.json"),
  import("../../messages/vi/notes.json"),
  import("../../messages/vi/note-tabs.json"),
  import("../../messages/vi/note-editor.json"),
  import("../../messages/vi/dictionary.json"),
  import("../../messages/vi/reader.json"),
  import("../../messages/vi/reader-study.json"),
  import("../../messages/vi/reader-document.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
  Inspector: inspector.default,
  Settings: settings.default,
  Notes: { ...notes.default, tabs: noteTabs.default, editor: noteEditor.default },
  Dictionary: dictionary.default,
  Reader: { ...reader.default, study: readerStudy.default, document: readerDocument.default },
 };
}

export type AppMessages = Awaited<ReturnType<typeof loadViMessages>>;

async function loadEnMessages(): Promise<AppMessages> {
 const [
  common,
  shell,
  auth,
  inspector,
  settings,
  notes,
  noteTabs,
  noteEditor,
  dictionary,
  reader,
  readerStudy,
  readerDocument,
 ] = await Promise.all([
  import("../../messages/en/common.json"),
  import("../../messages/en/shell.json"),
  import("../../messages/en/auth.json"),
  import("../../messages/en/inspector.json"),
  import("../../messages/en/settings.json"),
  import("../../messages/en/notes.json"),
  import("../../messages/en/note-tabs.json"),
  import("../../messages/en/note-editor.json"),
  import("../../messages/en/dictionary.json"),
  import("../../messages/en/reader.json"),
  import("../../messages/en/reader-study.json"),
  import("../../messages/en/reader-document.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
  Inspector: inspector.default,
  Settings: settings.default,
  Notes: { ...notes.default, tabs: noteTabs.default, editor: noteEditor.default },
  Dictionary: dictionary.default,
  Reader: { ...reader.default, study: readerStudy.default, document: readerDocument.default },
 };
}

async function loadZhCnMessages(): Promise<AppMessages> {
 const [
  common,
  shell,
  auth,
  inspector,
  settings,
  notes,
  noteTabs,
  noteEditor,
  dictionary,
  reader,
  readerStudy,
  readerDocument,
 ] = await Promise.all([
  import("../../messages/zh-CN/common.json"),
  import("../../messages/zh-CN/shell.json"),
  import("../../messages/zh-CN/auth.json"),
  import("../../messages/zh-CN/inspector.json"),
  import("../../messages/zh-CN/settings.json"),
  import("../../messages/zh-CN/notes.json"),
  import("../../messages/zh-CN/note-tabs.json"),
  import("../../messages/zh-CN/note-editor.json"),
  import("../../messages/zh-CN/dictionary.json"),
  import("../../messages/zh-CN/reader.json"),
  import("../../messages/zh-CN/reader-study.json"),
  import("../../messages/zh-CN/reader-document.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
  Inspector: inspector.default,
  Settings: settings.default,
  Notes: { ...notes.default, tabs: noteTabs.default, editor: noteEditor.default },
  Dictionary: dictionary.default,
  Reader: { ...reader.default, study: readerStudy.default, document: readerDocument.default },
 };
}

const messageLoaders: Record<AppLocale, () => Promise<AppMessages>> = {
 vi: loadViMessages,
 en: loadEnMessages,
 "zh-CN": loadZhCnMessages,
};

export function loadAppMessages(locale: AppLocale) {
 return messageLoaders[locale]();
}
