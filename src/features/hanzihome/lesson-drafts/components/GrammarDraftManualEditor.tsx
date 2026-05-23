"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  GrammarDraftExample,
  GrammarDraftItem,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { cn } from "@/lib/utils";

type GrammarDraftManualEditorProps = {
  item: GrammarDraftItem;
  onChange: (item: GrammarDraftItem) => void;
};

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-2xl border border-border-default bg-bg-primary px-3 py-2 text-sm font-semibold text-text-primary placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function createEmptyExample(): GrammarDraftExample {
  return {
    chinese: "",
    pinyin: "",
    translation: "",
    note: "",
  };
}

export function GrammarDraftManualEditor({
  item,
  onChange,
}: GrammarDraftManualEditorProps) {
  const updateItem = (patch: Partial<GrammarDraftItem>) => {
    onChange({
      ...item,
      ...patch,
    });
  };

  const updateExample = (
    index: number,
    patch: Partial<GrammarDraftExample>,
  ) => {
    onChange({
      ...item,
      examples: item.examples.map((example, currentIndex) =>
        currentIndex === index
          ? {
              ...example,
              ...patch,
            }
          : example,
      ),
    });
  };

  const deleteExample = (index: number) => {
    updateItem({
      examples: item.examples.filter((_example, currentIndex) => currentIndex !== index),
    });
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên điểm ngữ pháp">
          <Input
            value={item.title}
            onChange={(event) => updateItem({ title: event.target.value })}
            placeholder="Cách dùng mở rộng của đại từ nghi vấn"
          />
        </Field>

        <Field label="Pattern / cấu trúc chính">
          <Input
            value={item.pattern}
            onChange={(event) => updateItem({ pattern: event.target.value })}
            placeholder="什么 + 都/也..."
          />
        </Field>
      </div>

      <Field label="Công dụng ngắn">
        <Textarea
          value={item.shortMeaning}
          onChange={(event) => updateItem({ shortMeaning: event.target.value })}
          placeholder="Dùng để..."
        />
      </Field>

      <Field label="Logic cốt lõi">
        <Textarea
          value={item.coreLogic}
          onChange={(event) => updateItem({ coreLogic: event.target.value })}
          placeholder="Bản chất của cấu trúc này là..."
        />
      </Field>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
            Công thức
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateItem({ formulas: [...item.formulas, ""] })}
          >
            <Plus className="h-4 w-4" />
            Thêm công thức
          </Button>
        </div>

        {item.formulas.map((formula, index) => (
          <div
            key={`${item.id}-formula-${index}`}
            className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <Input
              value={formula}
              onChange={(event) =>
                updateItem({
                  formulas: item.formulas.map((current, currentIndex) =>
                    currentIndex === index ? event.target.value : current,
                  ),
                })
              }
              placeholder="一边 + V1 + 一边 + V2"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                updateItem({
                  formulas: item.formulas.filter(
                    (_current, currentIndex) => currentIndex !== index,
                  ),
                })
              }
              aria-label="Xóa công thức"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
            Ví dụ
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateItem({
                examples: [...item.examples, createEmptyExample()],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Thêm ví dụ
          </Button>
        </div>

        {item.examples.map((example, index) => (
          <div
            key={`${item.id}-example-${index}`}
            className="grid gap-3 rounded-2xl border border-border-default bg-bg-primary p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-text-primary">
                Ví dụ {index + 1}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => deleteExample(index)}
                aria-label="Xóa ví dụ"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Input
              value={example.chinese}
              placeholder="中文"
              onChange={(event) =>
                updateExample(index, { chinese: event.target.value })
              }
            />

            <Input
              value={example.pinyin}
              placeholder="Pinyin"
              onChange={(event) =>
                updateExample(index, { pinyin: event.target.value })
              }
            />

            <Input
              value={example.translation}
              placeholder="Dịch"
              onChange={(event) =>
                updateExample(index, { translation: event.target.value })
              }
            />

            <Textarea
              value={example.note}
              placeholder="Ghi chú / phân tích"
              onChange={(event) =>
                updateExample(index, { note: event.target.value })
              }
            />
          </div>
        ))}
      </div>

      <Field label="So sánh / phân biệt">
        <Textarea
          value={item.comparisons}
          onChange={(event) => updateItem({ comparisons: event.target.value })}
          placeholder="Phân biệt với..."
        />
      </Field>

      <Field label="Bẫy sai / lưu ý">
        <Textarea
          value={item.pitfalls}
          onChange={(event) => updateItem({ pitfalls: event.target.value })}
          placeholder="Người Việt dễ sai ở..."
        />
      </Field>

      <Field label="Ứng dụng / văn hóa">
        <Textarea
          value={item.cultureNotes}
          onChange={(event) => updateItem({ cultureNotes: event.target.value })}
          placeholder="Tình huống đời sống, ví dụ ứng dụng..."
        />
      </Field>

      <Field label="Raw markdown">
        <Textarea
          value={item.rawMarkdown}
          onChange={(event) => updateItem({ rawMarkdown: event.target.value })}
          className="min-h-40"
        />
      </Field>
    </div>
  );
}
