"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileJson,
  FileText,
  Plus,
  Save,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUpdateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { VocabDraftManualEditor } from "@/features/hanzihome/lesson-drafts/components/VocabDraftManualEditor";
import { parseVocabMarkdown } from "@/features/hanzihome/lesson-drafts/vocab/parse-vocab-markdown";
import {
  createEmptyVocabDraftItem,
  vocabDraftItemSchema,
  type VocabDraftItem,
} from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import { cn } from "@/lib/utils";

type VocabDraftImporterProps = {
  draft: LessonDraft;
};

type ImportMode = "markdown" | "json" | "manual";
type ImportStep = "source" | "review";
type SaveMode = "append" | "replace";

function isVocabDraftItem(value: unknown): value is VocabDraftItem {
  return vocabDraftItemSchema.safeParse(value).success;
}

function parseJsonVocabInput(input: string) {
  const parsed: unknown = JSON.parse(input);

  if (Array.isArray(parsed)) {
    return parsed.map((item) => vocabDraftItemSchema.parse(item));
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "items" in parsed &&
    Array.isArray((parsed as { items: unknown }).items)
  ) {
    return (parsed as { items: unknown[] }).items.map((item) =>
      vocabDraftItemSchema.parse(item),
    );
  }

  throw new Error("JSON phải là array vocab hoặc object dạng { items: [...] }.");
}

function getItemWarnings(item: VocabDraftItem) {
  const warnings: string[] = [];

  if (!item.word.trim()) warnings.push("thiếu từ");
  if (!item.pinyin.trim()) warnings.push("thiếu pinyin");
  if (!item.hanViet.trim()) warnings.push("thiếu Hán Việt");
  if (!item.meaning.trim()) warnings.push("thiếu nghĩa");
  if (item.examples.length === 0) warnings.push("chưa có ví dụ");

  return warnings;
}

function getAllWarnings(items: VocabDraftItem[]) {
  return items.flatMap((item, index) =>
    getItemWarnings(item).map(
      (warning) => `${item.word || `Mục ${index + 1}`}: ${warning}`,
    ),
  );
}

function dedupeById(items: VocabDraftItem[]) {
  const seen = new Set<string>();

  return items.map((item, index) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }

    let nextId = `${item.id}-${index + 1}`;
    let suffix = 2;

    while (seen.has(nextId)) {
      nextId = `${item.id}-${index + 1}-${suffix}`;
      suffix += 1;
    }

    seen.add(nextId);

    return {
      ...item,
      id: nextId,
    };
  });
}

function mergeItems(
  currentItems: VocabDraftItem[],
  incomingItems: VocabDraftItem[],
  mode: SaveMode,
) {
  if (mode === "replace") return dedupeById(incomingItems);

  return dedupeById([...currentItems, ...incomingItems]);
}

export function VocabDraftImporter({ draft }: VocabDraftImporterProps) {
  const searchParams = useSearchParams();
  const updateMutation = useUpdateLessonDraftMutation();

  const savedItems = useMemo(
    () => draft.content.vocab.filter(isVocabDraftItem),
    [draft.content.vocab],
  );

  const [step, setStep] = useState<ImportStep>(
    savedItems.length > 0 ? "review" : "source",
  );
  const [mode, setMode] = useState<ImportMode>("markdown");
  const [saveMode, setSaveMode] = useState<SaveMode>("append");
  const [sourceText, setSourceText] = useState("");
  const [sourceDirty, setSourceDirty] = useState(false);
  const [items, setItems] = useState<VocabDraftItem[]>(savedItems);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    searchParams.get("itemId") || savedItems[0]?.id || null,
  );
  const [warnings, setWarnings] = useState<string[]>([]);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

  const selectedWarnings = selectedItem ? getItemWarnings(selectedItem) : [];

  const parseCurrentSource = () => {
    if (mode === "manual") {
      return {
        items: [createEmptyVocabDraftItem()],
        warnings: ["Bạn đang tạo thủ công. Hãy điền các field ở bước review."],
      };
    }

    if (!sourceText.trim()) {
      throw new Error("Chưa có nội dung để parse.");
    }

    if (mode === "markdown") {
      return parseVocabMarkdown(sourceText);
    }

    const jsonItems = parseJsonVocabInput(sourceText);

    return {
      items: jsonItems,
      warnings: getAllWarnings(jsonItems),
    };
  };

  const applyItems = (
    nextItems: VocabDraftItem[],
    nextWarnings: string[],
    nextSelectedId?: string,
  ) => {
    setItems(nextItems);
    setWarnings(nextWarnings);
    setSelectedItemId(nextSelectedId ?? nextItems[0]?.id ?? null);
    setSourceDirty(false);
  };

  const saveItems = async (
    nextItems: VocabDraftItem[],
    options: { strict: boolean },
  ) => {
    const parsedItems = nextItems.map((item) => vocabDraftItemSchema.parse(item));
    const nextWarnings = getAllWarnings(parsedItems);

    setWarnings(nextWarnings);

    if (options.strict && nextWarnings.length > 0) {
      toast.error("Còn cảnh báo. Sửa lại hoặc dùng lưu nhanh.");
      return;
    }

    const vocabIds = parsedItems.map((item) => item.id);

    await updateMutation.mutateAsync({
      draftId: draft.id,
      input: {
        content: {
          ...draft.content,
          lesson: {
            ...draft.content.lesson,
            vocabIds,
          },
          vocab: parsedItems,
        },
      },
    });

    toast.success(`Đã lưu ${parsedItems.length} từ vào bài nháp`);
  };

  const handlePreviewImport = () => {
    try {
      const result = parseCurrentSource();

      if (result.items.length === 0) {
        toast.error("Không parse được từ nào");
        return;
      }

      const mergedItems = mergeItems(items, result.items, saveMode);
      const firstIncomingId =
        saveMode === "append"
          ? mergedItems[items.length]?.id
          : mergedItems[0]?.id;

      applyItems(mergedItems, result.warnings, firstIncomingId);

      toast.success(
        saveMode === "append"
          ? `Đã thêm tạm ${result.items.length} từ vào review`
          : `Đã thay tạm bằng ${result.items.length} từ`,
      );

      setStep("review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không parse được dữ liệu");
    }
  };

  const handleImportAndSave = async (options: { strict: boolean }) => {
    try {
      const result = parseCurrentSource();

      if (result.items.length === 0) {
        toast.error("Không parse được từ nào");
        return;
      }

      const mergedItems = mergeItems(savedItems, result.items, saveMode);
      const firstIncomingId =
        saveMode === "append"
          ? mergedItems[savedItems.length]?.id
          : mergedItems[0]?.id;

      applyItems(mergedItems, result.warnings, firstIncomingId);
      await saveItems(mergedItems, options);
      setStep("review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được từ vựng");
    }
  };

  const handleSaveReviewItems = async (options: { strict: boolean }) => {
    await saveItems(items, options);
  };

  const handleAddManualItem = () => {
    const nextItem = createEmptyVocabDraftItem();
    const nextItems = dedupeById([...items, nextItem]);
    const addedItem = nextItems[nextItems.length - 1];

    setItems(nextItems);
    setSelectedItemId(addedItem?.id ?? null);
  };

  const handleItemChange = (nextItem: VocabDraftItem) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === nextItem.id ? nextItem : item)),
    );
  };

  return (
    <div className="grid gap-4">
      <Card padding="sm" className="rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <StepButton
            active={step === "source"}
            label="1. Nhập nguồn"
            onClick={() => setStep("source")}
          />
          <StepButton
            active={step === "review"}
            label="2. Review & sửa tay"
            disabled={items.length === 0}
            onClick={() => setStep("review")}
          />

          {sourceDirty && (
            <span className="ml-auto rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
              Có source mới chưa xử lý
            </span>
          )}
        </div>
      </Card>

      {step === "source" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                  Step 1
                </p>
                <h2 className="mt-1 text-xl font-black text-text-primary">
                  Nhập nguồn từ vựng
                </h2>
                <p className="mt-1 text-sm font-semibold text-text-muted">
                  Mặc định là thêm từ mới vào bài, không ghi đè từ cũ.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <ModeButton
                  active={mode === "markdown"}
                  icon={<FileText className="h-4 w-4" />}
                  title="Paste Markdown"
                  description="Dán batch AI generate"
                  onClick={() => {
                    setMode("markdown");
                    setSourceDirty(true);
                  }}
                />
                <ModeButton
                  active={mode === "json"}
                  icon={<FileJson className="h-4 w-4" />}
                  title="Paste JSON"
                  description="Import data đã chuẩn"
                  onClick={() => {
                    setMode("json");
                    setSourceDirty(true);
                  }}
                />
                <ModeButton
                  active={mode === "manual"}
                  icon={<Plus className="h-4 w-4" />}
                  title="Manual"
                  description="Tạo từ trắng"
                  onClick={() => {
                    setMode("manual");
                    setSourceDirty(true);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-border-default bg-bg-primary p-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-black",
                    saveMode === "append"
                      ? "bg-text-primary text-bg-primary"
                      : "text-text-muted hover:text-text-primary",
                  )}
                  onClick={() => setSaveMode("append")}
                >
                  Thêm vào bài
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-black",
                    saveMode === "replace"
                      ? "bg-text-primary text-bg-primary"
                      : "text-text-muted hover:text-text-primary",
                  )}
                  onClick={() => setSaveMode("replace")}
                >
                  Thay toàn bộ
                </button>
              </div>

              {mode !== "manual" && (
                <textarea
                  value={sourceText}
                  onChange={(event) => {
                    setSourceText(event.target.value);
                    setSourceDirty(true);
                  }}
                  placeholder={
                    mode === "markdown"
                      ? "Dán markdown từ vựng ở đây..."
                      : "Dán JSON array hoặc { items: [...] } ở đây..."
                  }
                  className="min-h-96 w-full rounded-2xl border border-border-default bg-bg-primary px-3 py-3 text-sm font-semibold text-text-primary placeholder:text-text-muted focus-visible:outline-none"
                />
              )}

              {mode === "manual" && (
                <div className="rounded-2xl border border-dashed border-border-default bg-bg-primary p-5 text-sm font-semibold text-text-muted">
                  Manual mode sẽ tạo một vocab card trắng để bạn tự điền từ đầu.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handlePreviewImport}>
                  <WandSparkles className="h-4 w-4" />
                  Xem trước
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={updateMutation.isPending}
                  onClick={() => void handleImportAndSave({ strict: false })}
                >
                  <Save className="h-4 w-4" />
                  Thêm & lưu nhanh
                </Button>

                <Button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() => void handleImportAndSave({ strict: true })}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Check rồi lưu
                </Button>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                  Logic
                </p>
                <h2 className="mt-1 text-xl font-black text-text-primary">
                  Không còn ghi đè ngoài ý muốn
                </h2>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-text-muted">
                <p>
                  <b>Thêm vào bài</b>: batch mới được append sau các từ đã có.
                </p>
                <p>
                  <b>Thay toàn bộ</b>: chỉ dùng khi muốn xoá danh sách cũ và dùng batch mới.
                </p>
                <p>
                  <b>Xem trước</b>: parse vào màn review, chưa lưu database.
                </p>
                <p>
                  <b>Thêm & lưu nhanh</b>: parse batch hiện tại rồi lưu luôn.
                </p>
                <p>
                  <b>Check rồi lưu</b>: lưu có kiểm tra thiếu field quan trọng.
                </p>
              </div>

              <div className="rounded-2xl border border-border-default bg-bg-subtle p-4">
                <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                  Trạng thái hiện tại
                </p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {items.length} từ trong review
                </p>
                <p className="mt-1 text-sm font-semibold text-text-muted">
                  {savedItems.length} từ đang có trong draft database.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === "review" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.5fr)]">
          <div className="grid gap-4">
            <Card padding="md" className="rounded-2xl">
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                      Parsed vocab
                    </p>
                    <h3 className="mt-1 text-lg font-black text-text-primary">
                      {items.length} từ
                    </h3>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualItem}
                  >
                    <Plus className="h-4 w-4" />
                    Thêm tay
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border-default p-4 text-sm font-semibold text-text-muted">
                    Chưa có từ nào. Quay lại bước nhập nguồn.
                  </div>
                ) : (
                  <div className="grid max-h-[42rem] gap-2 overflow-y-auto pr-1">
                    {items.map((item) => {
                      const itemWarnings = getItemWarnings(item);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            "grid gap-1 rounded-2xl border p-3 text-left transition-colors",
                            selectedItem?.id === item.id
                              ? "border-primary bg-bg-subtle"
                              : "border-border-default bg-bg-primary hover:bg-bg-card-hover",
                          )}
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <span className="text-lg font-black text-text-primary">
                            {item.word || "Chưa có từ"}
                          </span>
                          <span className="text-xs font-bold text-text-muted">
                            {item.pinyin || "Chưa có pinyin"} ·{" "}
                            {item.hanViet || "Chưa có Hán Việt"}
                          </span>
                          <span className="truncate text-sm font-semibold text-text-muted">
                            {item.meaning || "Chưa có nghĩa"}
                          </span>

                          {itemWarnings.length > 0 && (
                            <span className="mt-1 rounded-full bg-bg-subtle px-2 py-1 text-xs font-bold text-text-muted">
                              {itemWarnings.length} cảnh báo
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {warnings.length > 0 && (
              <Card padding="md" className="rounded-2xl">
                <div className="grid gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                    Cảnh báo tổng
                  </p>
                  <ul className="grid max-h-60 gap-1 overflow-y-auto text-sm font-semibold text-text-muted">
                    {warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </div>

          <Card padding="lg" className="rounded-2xl">
            {selectedItem ? (
              <div className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
                      <BookOpen className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                        Manual editor
                      </p>
                      <h2 className="mt-1 text-xl font-black text-text-primary">
                        Sửa tay trước khi lưu
                      </h2>
                    </div>
                  </div>

                  {selectedWarnings.length > 0 && (
                    <div className="rounded-2xl border border-border-default bg-bg-subtle px-3 py-2 text-xs font-bold text-text-muted">
                      {selectedWarnings.join(", ")}
                    </div>
                  )}
                </div>

                <VocabDraftManualEditor
                  item={selectedItem}
                  onChange={handleItemChange}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border-default p-6 text-sm font-semibold text-text-muted">
                Chọn một từ ở danh sách bên trái để sửa tay.
              </div>
            )}
          </Card>
        </div>
      )}

      {step === "review" && (
        <Card padding="sm" className="rounded-2xl">
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep("source")}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại nhập nguồn
            </Button>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending || items.length === 0}
                onClick={() => void handleSaveReviewItems({ strict: false })}
              >
                <Save className="h-4 w-4" />
                Lưu chỉnh sửa
              </Button>

              <Button
                type="button"
                disabled={updateMutation.isPending || items.length === 0}
                onClick={() => void handleSaveReviewItems({ strict: true })}
              >
                <CheckCircle2 className="h-4 w-4" />
                Check & lưu
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StepButton({
  active,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "bg-text-primary text-bg-primary"
          : "bg-bg-subtle text-text-muted hover:text-text-primary",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ModeButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid gap-2 rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-bg-subtle"
          : "border-border-default bg-bg-primary hover:bg-bg-card-hover",
      )}
      onClick={onClick}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-bg-subtle">
        {icon}
      </span>
      <span className="font-black text-text-primary">{title}</span>
      <span className="text-xs font-semibold text-text-muted">
        {description}
      </span>
    </button>
  );
}
