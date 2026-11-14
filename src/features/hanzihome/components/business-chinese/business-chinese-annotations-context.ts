import { createContext } from "react";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";

export type BusinessChineseAnnotationsContextValue = {
 readerAnnotations: readonly ReaderAnnotationRow[];
 onOpenReaderAnnotation: (annotation: ReaderAnnotationRow, rect: DOMRect) => void;
};

export const BusinessChineseAnnotationsContext =
 createContext<BusinessChineseAnnotationsContextValue | null>(null);
