"use client";

import { useState, useCallback } from "react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogBody,
 DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { classifyVocabType } from "@/services/vocab.service";

type ParsedItem = {
 hanzi: string;
 pinyin?: string;
 meaning: string;
 type: "word" | "sentence";
};

type ImportResult = {
 hanzi: string;
 success: boolean;
 error?: string;
};

export function VocabImportModal({
 open,
 onOpenChange,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
}) {
 const [rawJson, setRawJson] = useState("");
 const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
 const [parseError, setParseError] = useState<string | null>(null);
 const [importing, setImporting] = useState(false);
 const [results, setResults] = useState<ImportResult[] | null>(null);
 const queryClient = useQueryClient();

 const reset = useCallback(() => {
  setRawJson("");
  setParsedItems(null);
  setParseError(null);
  setResults(null);
 }, []);

 const handleParse = useCallback(() => {
  setParseError(null);
  setParsedItems(null);
  setResults(null);

  try {
   const parsed = JSON.parse(rawJson);

   // Accept: single object, array of objects, or { items: [...] }
   let items: Record<string, unknown>[];
   if (Array.isArray(parsed)) {
    items = parsed;
   } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray(parsed.items)
   ) {
    items = parsed.items;
   } else if (parsed && typeof parsed === "object" && parsed.hanzi) {
    items = [parsed];
   } else {
    setParseError(
     'JSON không hợp lệ. Cần: object có "hanzi", array, hoặc { items: [...] }',
    );
    return;
   }

   if (items.length === 0) {
    setParseError("Không tìm thấy mục nào trong JSON.");
    return;
   }

   if (items.length > 100) {
    setParseError("Tối đa 100 mục mỗi lần import.");
    return;
   }

   const preview: ParsedItem[] = items.map((item) => {
    const hanzi = String(item.hanzi || "").trim();
    const pinyin = item.pinyin ? String(item.pinyin).trim() : undefined;
    const meaning = String(
     item.meaning_summary ||
      item.meaning ||
      (Array.isArray(item.definitions)
       ? (item.definitions as { text?: string; meaning?: string }[])
          .map((d) => d.text || d.meaning)
          .filter(Boolean)
          .join("; ")
       : "") ||
      "",
    ).trim();

    return {
     hanzi,
     pinyin,
     meaning,
     type: classifyVocabType(hanzi, pinyin),
    };
   });

   const invalid = preview.filter((p) => !p.hanzi);
   if (invalid.length > 0) {
    setParseError(`${invalid.length} mục thiếu trường "hanzi".`);
    return;
   }

   setParsedItems(preview);
  } catch {
   setParseError("JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.");
  }
 }, [rawJson]);

 const handleImport = useCallback(async () => {
  if (!parsedItems) return;

  setImporting(true);
  setResults(null);

  try {
   // Re-parse the raw JSON to send full data to the API
   const parsed = JSON.parse(rawJson);
   let items: Record<string, unknown>[];
   if (Array.isArray(parsed)) {
    items = parsed;
   } else if (parsed?.items) {
    items = parsed.items;
   } else {
    items = [parsed];
   }

   const res = await fetch("/api/vocab/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
   });

   if (!res.ok) {
    const err = await res.json().catch(() => null);
    toast.error(err?.error || "Import thất bại");
    setImporting(false);
    return;
   }

   const data = await res.json();
   setResults(data.results);

   if (data.imported > 0) {
    toast.success(`Đã import ${data.imported} mục thành công!`);
    queryClient.invalidateQueries({ queryKey: ["vocab-list"] });
   }
   if (data.failed > 0) {
    toast.error(`${data.failed} mục import thất bại.`);
   }
  } catch {
   toast.error("Lỗi kết nối. Vui lòng thử lại.");
  } finally {
   setImporting(false);
  }
 }, [parsedItems, rawJson, queryClient]);

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-2xl">
    <DialogHeader>
     <DialogTitle>Import JSON</DialogTitle>
     <DialogDescription>
      Paste JSON chứa dữ liệu từ vựng. Hỗ trợ: object đơn, array, hoặc{" "}
      {"{ items: [...] }"}
     </DialogDescription>
    </DialogHeader>

    <DialogBody>
     {!results ? (
      <>
       <Textarea
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
        placeholder={`{\n  "hanzi": "深",\n  "pinyin": "shēn",\n  "meaning_summary": "Sâu",\n  "definitions": [...]\n}`}
        className="min-h-48 font-mono text-xs"
       />

       {parseError && (
        <div className="flex items-start gap-2 p-3 rounded bg-danger-subtle text-danger-text text-sm">
         <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
         {parseError}
        </div>
       )}

       {parsedItems && (
        <div className="border border-border-default rounded max-h-60 overflow-auto">
         <div className="px-3 py-2 bg-bg-elevated border-b border-border-default text-xs font-bold text-text-muted">
          Tìm thấy {parsedItems.length} mục
         </div>
         {parsedItems.map((item, i) => (
          <div
           key={i}
           className="flex items-center gap-3 px-3 py-2 text-sm border-b border-border-default last:border-b-0"
          >
           <span className="font-bold text-text-primary text-lg">
            {item.hanzi}
           </span>
           {item.pinyin && (
            <span className="text-text-muted">{item.pinyin}</span>
           )}
           <span className="text-text-secondary truncate flex-1">
            {item.meaning || "—"}
           </span>
           <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
             item.type === "sentence"
              ? "bg-info-subtle text-info-text"
              : "bg-accent-subtle text-accent-text"
            }`}
           >
            {item.type === "sentence" ? "Câu" : "Từ"}
           </span>
          </div>
         ))}
        </div>
       )}
      </>
     ) : (
      <div className="border border-border-default rounded max-h-72 overflow-auto">
       <div className="px-3 py-2 bg-bg-elevated border-b border-border-default text-xs font-bold text-text-muted">
        Kết quả import
       </div>
       {results.map((r, i) => (
        <div
         key={i}
         className="flex items-center gap-3 px-3 py-2 text-sm border-b border-border-default last:border-b-0"
        >
         {r.success ? (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
         ) : (
          <XCircle className="w-4 h-4 text-danger shrink-0" />
         )}
         <span className="font-bold text-text-primary">{r.hanzi}</span>
         {!r.success && r.error && (
          <span className="text-danger-text text-xs">{r.error}</span>
         )}
        </div>
       ))}
      </div>
     )}
    </DialogBody>

    <DialogFooter>
     {results ? (
      <>
       <button
        onClick={() => {
         reset();
        }}
        className="px-4 py-2 text-sm font-medium rounded bg-bg-elevated border border-border-default text-text-secondary hover:bg-bg-card-hover transition-colors"
       >
        Import thêm
       </button>
       <button
        onClick={() => {
         reset();
         onOpenChange(false);
        }}
        className="px-4 py-2 text-sm font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors"
       >
        Đóng
       </button>
      </>
     ) : (
      <>
       <button
        onClick={() => {
         reset();
         onOpenChange(false);
        }}
        className="px-4 py-2 text-sm font-medium rounded bg-bg-elevated border border-border-default text-text-secondary hover:bg-bg-card-hover transition-colors"
       >
        Hủy
       </button>
       {!parsedItems ? (
        <button
         onClick={handleParse}
         disabled={!rawJson.trim()}
         className="px-4 py-2 text-sm font-bold rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
         Phân tích
        </button>
       ) : (
        <button
         onClick={handleImport}
         disabled={importing}
         className="px-4 py-2 text-sm font-bold rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
         {importing && <Loader2 className="w-4 h-4 animate-spin" />}
         Lưu {parsedItems.length} mục
        </button>
       )}
      </>
     )}
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
