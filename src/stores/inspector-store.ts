"use client";

import { createStore } from "@tanstack/react-store";
import { z } from "zod";

import { containsChinese, extractChinese } from "@/lib/chinese-utils";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export type InspectorOpenOptions = {
 lessonId?: string;
 anchorRect?: DOMRect;
};

type InspectorStore = {
 isOpen: boolean;
 anchorRect: Nullable<DOMRect>;
 selectedText: string;
 lessonId: string;
};

export const inspectorStore = createStore<
 InspectorStore,
 {
  openInspector: (text: string, options?: InspectorOpenOptions) => void;
  closeInspector: () => void;
 }
>(
 {
  isOpen: false,
  anchorRect: null,
  selectedText: "",
  lessonId: "",
 },
 ({ setState, get }) => ({
  openInspector: (text, options = {}) => {
   if (!containsChinese(text)) return;
   const selectedText = extractChinese(text).trim();
   if (!selectedText) return;

   setState((state) => ({
    ...state,
    isOpen: true,
    anchorRect: options.anchorRect ?? get().anchorRect,
    selectedText,
    lessonId: options.lessonId ?? "",
   }));
  },
  closeInspector: () => {
   setState((state) => ({
    ...state,
    isOpen: false,
    anchorRect: null,
    selectedText: "",
    lessonId: "",
   }));
  },
 }),
);
