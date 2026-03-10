/**
 * VocabImportButton — Toolbar button + modal for batch vocab import.
 *
 * Features:
 *  - JSON paste (object, array, or {items: [...]})
 *  - Auto-batch max 20 items per request
 *  - Non-blocking queue: next batch starts while previous is running
 *  - Progress bar + queue list
 *  - Cancel queue, retry failed items
 *  - Realtime validation
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";

/* ── Types ── */
type ImportItem = {
 hanzi: string;
 pinyin?: string;
 [key: string]: unknown;
};

type ItemResult = {
 hanzi: string;
 status: "pending" | "importing" | "success" | "error";
 error?: string;
};

const BATCH_SIZE = 20;

/* ── Validate & normalise pasted JSON ── */
const vocabItemSchema = z.object({
 hanzi: z.string().min(1),
}).passthrough();

function parseImportJSON(raw: string): { items: ImportItem[]; error?: string } {
 let parsed: unknown;
 try {
  parsed = JSON.parse(raw);
 } catch {
  return { items: [], error: "JSON không hợp lệ" };
 }

 // Normalise to array
 let arr: unknown[];
 if (Array.isArray(parsed)) {
  arr = parsed;
 } else if (
  typeof parsed === "object" &&
  parsed !== null &&
  "items" in parsed &&
  Array.isArray((parsed as { items: unknown }).items)
 ) {
  arr = (parsed as { items: unknown[] }).items;
 } else if (typeof parsed === "object" && parsed !== null && "hanzi" in parsed) {
  arr = [parsed];
 } else {
  return { items: [], error: "Định dạng không nhận dạng được. Cần object, array hoặc {items: [...]}" };
 }

 const items: ImportItem[] = [];
 const errors: string[] = [];

 for (let i = 0; i < arr.length; i++) {
  const result = vocabItemSchema.safeParse(arr[i]);
  if (result.success) {
   items.push(result.data as ImportItem);
  } else {
   errors.push(`Mục ${i + 1}: thiếu trường "hanzi"`);
  }
 }

 if (items.length === 0 && errors.length > 0) {
  return { items: [], error: errors.join("; ") };
 }

 return { items, error: errors.length > 0 ? `${errors.length} mục lỗi đã bỏ qua` : undefined };
}

export function VocabImportButton() {
 const [isOpen, setIsOpen] = useState(false);
 const [jsonInput, setJsonInput] = useState("");
 const [validationError, setValidationError] = useState<string | null>(null);
 const [validItemCount, setValidItemCount] = useState(0);
 const [importResults, setImportResults] = useState<ItemResult[]>([]);
 const [isImporting, setIsImporting] = useState(false);
 const cancelledRef = useRef(false);
 const abortRef = useRef<AbortController | null>(null);

 const handleValidate = useCallback((value: string) => {
  setJsonInput(value);
  if (!value.trim()) {
   setValidationError(null);
   setValidItemCount(0);
   return;
  }
  const { items, error } = parseImportJSON(value);
  setValidationError(error || null);
  setValidItemCount(items.length);
 }, []);

 const handleImport = useCallback(async () => {
  const { items, error } = parseImportJSON(jsonInput);
  if (items.length === 0) {
   setValidationError(error || "Không có từ nào hợp lệ");
   return;
  }

  cancelledRef.current = false;
  setIsImporting(true);
  setImportResults(items.map((item) => ({ hanzi: item.hanzi, status: "pending" })));

  // Split into batches
  const batches: ImportItem[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
   batches.push(items.slice(i, i + BATCH_SIZE));
  }

  let globalIndex = 0;
  for (const batch of batches) {
   if (cancelledRef.current) break;

   const batchStart = globalIndex;
   const batchEnd = globalIndex + batch.length;

   // Mark batch as importing
   setImportResults((prev) =>
    prev.map((r, i) => (i >= batchStart && i < batchEnd ? { ...r, status: "importing" } : r)),
   );

   try {
    abortRef.current = new AbortController();
    const res = await fetch("/api/vocab/import", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ items: batch }),
     signal: abortRef.current.signal,
    });

    if (!res.ok) {
     const errBody = await res.json().catch(() => ({ error: "Import failed" }));
     setImportResults((prev) =>
      prev.map((r, i) =>
       i >= batchStart && i < batchEnd
        ? { ...r, status: "error", error: errBody.error || `HTTP ${res.status}` }
        : r,
      ),
     );
    } else {
     const data = await res.json();
     const results = data.results as { hanzi: string; success: boolean; error?: string }[];

     setImportResults((prev) =>
      prev.map((r, i) => {
       if (i < batchStart || i >= batchEnd) return r;
       const batchIdx = i - batchStart;
       const result = results[batchIdx];
       return result
        ? { ...r, status: result.success ? "success" : "error", error: result.error }
        : r;
      }),
     );
    }
   } catch (err) {
    if (cancelledRef.current) break;
    setImportResults((prev) =>
     prev.map((r, i) =>
      i >= batchStart && i < batchEnd
       ? { ...r, status: "error", error: err instanceof Error ? err.message : "Network error" }
       : r,
     ),
    );
   }

   globalIndex = batchEnd;
  }

  setIsImporting(false);
  abortRef.current = null;

  // Toast summary
  setImportResults((final) => {
   const success = final.filter((r) => r.status === "success").length;
   const failed = final.filter((r) => r.status === "error").length;
   if (success > 0) toast.success(`Đã import ${success} từ thành công`);
   if (failed > 0) toast.error(`${failed} từ import thất bại`);
   return final;
  });
 }, [jsonInput]);

 const handleCancel = useCallback(() => {
  cancelledRef.current = true;
  abortRef.current?.abort();
 }, []);

 const handleRetryFailed = useCallback(async () => {
  const failedItems = importResults
   .filter((r) => r.status === "error")
   .map((r) => {
    // Re-parse to get full item data
    const { items } = parseImportJSON(jsonInput);
    return items.find((item) => item.hanzi === r.hanzi);
   })
   .filter(Boolean) as ImportItem[];

  if (failedItems.length === 0) return;

  cancelledRef.current = false;
  setIsImporting(true);

  // Reset failed items to pending
  setImportResults((prev) =>
   prev.map((r) => (r.status === "error" ? { ...r, status: "pending", error: undefined } : r)),
  );

  // Process them in batches
  const batches: ImportItem[][] = [];
  for (let i = 0; i < failedItems.length; i += BATCH_SIZE) {
   batches.push(failedItems.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
   if (cancelledRef.current) break;

   const batchHanzi = new Set(batch.map((b) => b.hanzi));

   setImportResults((prev) =>
    prev.map((r) => (batchHanzi.has(r.hanzi) && r.status === "pending" ? { ...r, status: "importing" } : r)),
   );

   try {
    abortRef.current = new AbortController();
    const res = await fetch("/api/vocab/import", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ items: batch }),
     signal: abortRef.current.signal,
    });

    if (res.ok) {
     const data = await res.json();
     const results = data.results as { hanzi: string; success: boolean; error?: string }[];
     const resultMap = new Map(results.map((r) => [r.hanzi, r]));

     setImportResults((prev) =>
      prev.map((r) => {
       if (!batchHanzi.has(r.hanzi) || r.status !== "importing") return r;
       const result = resultMap.get(r.hanzi);
       return result
        ? { ...r, status: result.success ? "success" : "error", error: result.error }
        : r;
      }),
     );
    } else {
     setImportResults((prev) =>
      prev.map((r) =>
       batchHanzi.has(r.hanzi) && r.status === "importing"
        ? { ...r, status: "error", error: `HTTP ${res.status}` }
        : r,
      ),
     );
    }
   } catch (err) {
    if (cancelledRef.current) break;
    setImportResults((prev) =>
     prev.map((r) =>
      batchHanzi.has(r.hanzi) && r.status === "importing"
       ? { ...r, status: "error", error: err instanceof Error ? err.message : "Network error" }
       : r,
     ),
    );
   }
  }

  setIsImporting(false);
  abortRef.current = null;
 }, [importResults, jsonInput]);

 const handleClose = () => {
  if (isImporting) {
   handleCancel();
  }
  setIsOpen(false);
  setJsonInput("");
  setValidationError(null);
  setValidItemCount(0);
  setImportResults([]);
 };

 const successCount = importResults.filter((r) => r.status === "success").length;
 const errorCount = importResults.filter((r) => r.status === "error").length;
 const totalCount = importResults.length;
 const progress = totalCount > 0 ? ((successCount + errorCount) / totalCount) * 100 : 0;

 return (
  <>
   <button
    type="button"
    onClick={() => setIsOpen(true)}
    title="Import từ vựng"
    aria-label="Import từ vựng"
    className="toolbar-item"
    onMouseDown={(e) => e.preventDefault()}
   >
    <Upload className="w-4 h-4" />
   </button>

   {isOpen && (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 animate-in fade-in">
     <div
      className="w-full max-w-lg mx-4 bg-bg-card border border-border-default rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
     >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
       <div>
        <h2 className="text-lg font-bold text-text-primary">Import từ vựng</h2>
        <p className="text-xs text-text-muted mt-0.5">Paste JSON (object, array hoặc {"{"} items: [...] {"}"})</p>
       </div>
       <button
        onClick={handleClose}
        className="w-8 h-8 rounded flex items-center justify-center hover:bg-bg-elevated transition-colors text-text-muted"
       >
        <X className="w-4 h-4" />
       </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
       {/* JSON Input */}
       <div>
        <textarea
         value={jsonInput}
         onChange={(e) => handleValidate(e.target.value)}
         placeholder={'[\n  { "hanzi": "你好", "pinyin": "nǐ hǎo", "meaning_summary": "xin chào" }\n]'}
         className="w-full h-40 rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted resize-y outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
         disabled={isImporting}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
         {validationError ? (
          <span className="text-warning">{validationError}</span>
         ) : validItemCount > 0 ? (
          <span className="text-success">{validItemCount} từ hợp lệ</span>
         ) : (
          <span className="text-text-muted">Paste JSON ở trên</span>
         )}
         {validItemCount > BATCH_SIZE && (
          <span className="text-text-muted">
           Sẽ chia thành {Math.ceil(validItemCount / BATCH_SIZE)} batch × {BATCH_SIZE} từ
          </span>
         )}
        </div>
       </div>

       {/* Progress */}
       {totalCount > 0 && (
        <div className="space-y-3">
         {/* Progress bar */}
         <div className="relative h-2 rounded-full bg-bg-elevated overflow-hidden">
          <div
           className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-300"
           style={{ width: `${progress}%` }}
          />
         </div>
         <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
           {isImporting ? "Đang import..." : "Hoàn thành"} — {successCount}/{totalCount} thành công
           {errorCount > 0 && `, ${errorCount} lỗi`}
          </span>
          <span>{Math.round(progress)}%</span>
         </div>

         {/* Results list */}
         <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border-default bg-bg-elevated p-2">
          {importResults.map((r, i) => (
           <div
            key={`${r.hanzi}-${i}`}
            className={cn(
             "flex items-center justify-between px-3 py-1.5 rounded text-sm",
             r.status === "success" && "bg-success-subtle text-success-text",
             r.status === "error" && "bg-danger-subtle text-danger-text",
             r.status === "importing" && "bg-info-subtle text-info-text",
             r.status === "pending" && "text-text-muted",
            )}
           >
            <span className="font-medium">{r.hanzi}</span>
            <span className="flex items-center gap-1 text-xs">
             {r.status === "success" && <CheckCircle2 className="w-3.5 h-3.5" />}
             {r.status === "error" && (
              <span className="flex items-center gap-1" title={r.error}>
               <AlertCircle className="w-3.5 h-3.5" />
               {r.error && <span className="max-w-32 truncate">{r.error}</span>}
              </span>
             )}
             {r.status === "importing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
             {r.status === "pending" && "Chờ..."}
            </span>
           </div>
          ))}
         </div>
        </div>
       )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border-default bg-bg-elevated/50 rounded-b-xl">
       <div className="flex items-center gap-2">
        {errorCount > 0 && !isImporting && (
         <button
          onClick={handleRetryFailed}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warning hover:bg-warning-subtle transition-colors"
         >
          <RotateCcw className="w-3.5 h-3.5" />
          Thử lại {errorCount} mục lỗi
         </button>
        )}
       </div>
       <div className="flex items-center gap-2">
        {isImporting ? (
         <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger-subtle transition-colors"
         >
          Huỷ
         </button>
        ) : (
         <>
          <button
           onClick={handleClose}
           className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-elevated transition-colors"
          >
           Đóng
          </button>
          <button
           onClick={handleImport}
           disabled={validItemCount === 0 || isImporting}
           className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
           Import {validItemCount > 0 ? `${validItemCount} từ` : ""}
          </button>
         </>
        )}
       </div>
      </div>
     </div>
    </div>
   )}
  </>
 );
}
