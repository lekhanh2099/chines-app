"use client";

import {
 BookOpenText,
 Check,
 Info,
 Keyboard,
 Languages,
 List,
 NotebookPen,
 Type,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type {
 ReaderProgressOwner,
 useReaderStudyState,
} from "@/features/reading/hooks/useReaderStudyState";
import {
 groupReaderWorkspaceTabs,
 type ReaderWorkspaceTab,
 type ReaderWorkspaceTabItem,
} from "@/features/reading/workspaces/reader-document-study-model";

/** Owns the selected Reader study tab and resolves which tabs/groups this document offers. */
export function useReaderWorkspaceTabs({
 resource,
 study,
 stateOwner,
 translationSegmentCount,
}: {
 resource: ReaderDocumentResource;
 study: ReturnType<typeof useReaderStudyState>;
 stateOwner: ReaderProgressOwner;
 translationSegmentCount: number;
}) {
 const t = useTranslations("Reader.study");
 const readerWorkspaceTabs = useMemo<ReadonlyArray<ReaderWorkspaceTabItem>>(
  () => [
   { id: "overview", label: t("chrome.tabs.overview"), icon: Info },
   { id: "reader", label: t("chrome.tabs.reader"), icon: BookOpenText },
   { id: "exercises", label: t("chrome.tabs.exercises"), icon: Check },
   { id: "vocabulary", label: t("chrome.tabs.vocabulary"), icon: Type },
   { id: "translation", label: t("chrome.tabs.translation"), icon: Languages },
   { id: "dictation", label: t("chrome.tabs.dictation"), icon: Keyboard },
   { id: "analysis", label: t("chrome.tabs.analysis"), icon: List },
   { id: "summary", label: t("chrome.tabs.summary"), icon: List },
   { id: "notes", label: t("chrome.tabs.notes"), icon: NotebookPen },
  ],
  [t],
 );
 const [workspaceTab, setWorkspaceTab] = useState<ReaderWorkspaceTab>("reader");
 const workspaceTabsEnabled = stateOwner !== "daily";
 const availableTabs = useMemo(
  () =>
   workspaceTabsEnabled
    ? readerWorkspaceTabs.filter((tab) => {
       if (tab.id === "exercises") return resource.exerciseItems.length > 0;
       if (tab.id === "vocabulary") return resource.vocabulary.length > 0;
       if (tab.id === "translation") return translationSegmentCount > 0;
       if (tab.id === "analysis") return study.documentModel.capabilities.includes("analysis");
       if (tab.id === "summary") return study.documentModel.capabilities.includes("summary");
       return true;
      })
    : [],
  [
   readerWorkspaceTabs,
   resource.exerciseItems.length,
   resource.vocabulary.length,
   study.documentModel.capabilities,
   translationSegmentCount,
   workspaceTabsEnabled,
  ],
 );
 const activeWorkspaceTab = availableTabs.some((tab) => tab.id === workspaceTab)
  ? workspaceTab
  : "reader";
 const tabGroups = groupReaderWorkspaceTabs(availableTabs, activeWorkspaceTab);

 return { workspaceTabsEnabled, activeWorkspaceTab, setWorkspaceTab, tabGroups };
}
