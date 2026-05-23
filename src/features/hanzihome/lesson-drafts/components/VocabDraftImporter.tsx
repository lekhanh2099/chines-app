"use client";

import { useMemo, useState, type ReactNode } from "react";
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

export function VocabDraftImporter({ draft }: VocabDraftImporterProps) {
  const updateMutation = useUpdateLessonDraftMutation();

  const savedItems = useMemo(
    () => draft.content.vocab.filter(isVocabDraftItem),
    [draft.content.vocab],
  );

  const [step, setStep] = useState<ImportStep>(
    savedItems.length > 0 ? "review" : "source",
  );
  const [mode, setMode] = useState<ImportMode>("markdown");
  const [sourceText, setSourceText] = useState("");
  const [items, setItems] = useState<VocabDraftItem[]>(savedItems);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    savedItems[0]?.id ?? null,
  );
  const [warnings, setWarnings] = useState<string[]>([]);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

  const selectedWarnings = selectedItem ? getItemWarnings(selectedItem) : [];

  const parseCurrentSource = () => {
    if (mode === "manual") {
      return {
        items: [createEmptyVocabDraftItem()],
        warnings: [
          "Bạn đang tạo thủ công. Hãy điền các field ở bước review.",
        ],
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

  const applyParsedItems = (nextItems: VocabDraftItem[], nextWarnings: string[]) => {
    setItems(nextItems);
    setWarnings(nextWarnings);
    setSelectedItemId(nextItems[0]?.id ?? null);
  };

  const handleParse = () => {
    try {
      const result = parseCurrentSource();

      applyParsedItems(result.items, result.warnings);

      if (result.items.length === 0) {
        toast.error("Không parse được từ nào");
        return;
      }

      toast.success(`Đã parse ${result.items.length} từ`);
      setStep("review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không parse được dữ liệu");
    }
  };

  const saveItems = async (
    nextItems: VocabDraftItem[],
    options: { strict: boolean },
  ) => {
    const parsedItems = nextItems.map((item) => vocabDraftItemSchema.parse(item));
    const nextWarnings = getAllWarnings(parsedItems);

    setWarnings(nextWarnings);

    if (options.strict && nextWarnings.length > 0) {
      toast.error("Còn cảnh báo. Sửa lại hoặc dùng Lưu nhanh.");
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

  const handleSave = async (options: { strict: boolean }) => {
    try {
      if (step === "source" && (sourceText.trim() || mode === "manual")) {
        const result = parseCurrentSource();

        applyParsedItems(result.items, result.warnings);

        if (result.items.length === 0) {
          toast.error("Không parse được từ nào");
          return;
        }

        await saveItems(result.items, options);
        setStep("review");
        return;
      }

      await saveItems(items, options);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được từ vựng");
    }
  };

  const handleAddManualItem = () => {
    const nextItem = createEmptyVocabDraftItem();

    setItems((currentItems) => [...currentItems, nextItem]);
    setSelectedItemId(nextItem.id);
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

          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() => void handleSave({ strict: false })}
            >
              <Save className="h-4 w-4" />
              Lưu nhanh
            </Button>

            <Button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => void handleSave({ strict: true })}
            >
              <CheckCircle2 className="h-4 w-4" />
              Check & lưu
            </Button>
          </div>
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
                  Chọn cách nhập từ vựng
                </h2>
                <p className="mt-1 text-sm font-semibold text-text-muted">
                  Dán markdown/json rồi bấm Lưu nhanh nếu muốn parse và lưu luôn.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <ModeButton
                  active={mode === "markdown"}
                  icon={<FileText className="h-4 w-4" />}
                  title="Paste Markdown"
                  description="Dán batch AI generate"
                  onClick={() => setMode("markdown")}
                />
                <ModeButton
                  active={mode === "json"}
                  icon={<FileJson className="h-4 w-4" />}
                  title="Paste JSON"
                  description="Import data đã chuẩn"
                  onClick={() => setMode("json")}
                />
                <ModeButton
                  active={mode === "manual"}
                  icon={<Plus className="h-4 w-4" />}
                  title="Manual"
                  description="Tạo từ trắng"
                  onClick={() => setMode("manual")}
                />
              </div>

              {mode !== "manual" && (
                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
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

              <Button type="button" onClick={handleParse}>
                <WandSparkles className="h-4 w-4" />
                {mode === "manual" ? "Tạo vocab trắng" : "Parse & auto-fill"}
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                  Logic
                </p>
                <h2 className="mt-1 text-xl font-black text-text-primary">
                  Hai kiểu lưu
                </h2>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-text-muted">
                <p>
                  1. <b>Parse & auto-fill</b>: chỉ parse ra màn review, chưa lưu.
                </p>
                <p>
                  2. <b>Lưu nhanh</b>: parse source hiện tại rồi lưu luôn, bỏ qua cảnh báo thiếu pinyin/Hán Việt/ví dụ.
                </p>
                <p>
                  3. <b>Check & lưu</b>: parse rồi chặn nếu còn thiếu field quan trọng.
                </p>
              </div>

              {items.length > 0 && (
                <div className="rounded-2xl border border-border-default bg-bg-subtle p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                    Draft hiện tại
                  </p>
                  <p className="mt-1 text-2xl font-black text-text-primary">
                    {items.length} từ đang chờ review
                  </p>
                </div>
              )}
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
                disabled={updateMutation.isPending}
                onClick={() => void handleSave({ strict: false })}
              >
                <Save className="h-4 w-4" />
                Lưu nhanh
              </Button>

              <Button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => void handleSave({ strict: true })}
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
