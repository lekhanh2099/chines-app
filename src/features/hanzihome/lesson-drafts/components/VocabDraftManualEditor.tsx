"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  VocabDraftExample,
  VocabDraftItem,
} from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import { cn } from "@/lib/utils";

type VocabDraftManualEditorProps = {
  item: VocabDraftItem;
  onChange: (item: VocabDraftItem) => void;
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

function createEmptyExample(): VocabDraftExample {
  return {
    chinese: "",
    pinyin: "",
    translation: "",
    note: "",
  };
}

export function VocabDraftManualEditor({
  item,
  onChange,
}: VocabDraftManualEditorProps) {
  const updateItem = (patch: Partial<VocabDraftItem>) => {
    onChange({
      ...item,
      ...patch,
    });
  };

  const updateSection = (
    key: keyof VocabDraftItem["sections"],
    value: string,
  ) => {
    onChange({
      ...item,
      sections: {
        ...item.sections,
        [key]: value,
      },
    });
  };

  const updateExample = (
    index: number,
    patch: Partial<VocabDraftExample>,
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
    onChange({
      ...item,
      examples: item.examples.filter((_example, currentIndex) => currentIndex !== index),
    });
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Từ">
          <Input
            value={item.word}
            onChange={(event) => updateItem({ word: event.target.value })}
          />
        </Field>

        <Field label="Pinyin">
          <Input
            value={item.pinyin}
            onChange={(event) => updateItem({ pinyin: event.target.value })}
          />
        </Field>

        <Field label="Hán Việt">
          <Input
            value={item.hanViet}
            onChange={(event) => updateItem({ hanViet: event.target.value })}
          />
        </Field>

        <Field label="Nghĩa">
          <Input
            value={item.meaning}
            onChange={(event) => updateItem({ meaning: event.target.value })}
          />
        </Field>

        <Field label="Từ loại">
          <Input
            value={item.partOfSpeech}
            onChange={(event) => updateItem({ partOfSpeech: event.target.value })}
          />
        </Field>

        <Field label="Mức độ">
          <Input
            value={item.level}
            onChange={(event) => updateItem({ level: event.target.value })}
          />
        </Field>

        <Field label="Nhóm / category">
          <Input
            value={item.category}
            onChange={(event) => updateItem({ category: event.target.value })}
          />
        </Field>
      </div>

      <Field label="1. Nghĩa">
        <Textarea
          value={item.sections.meaning}
          onChange={(event) => updateSection("meaning", event.target.value)}
        />
      </Field>

      <Field label="2. Chiết tự / logic">
        <Textarea
          value={item.sections.characterLogic}
          onChange={(event) =>
            updateSection("characterLogic", event.target.value)
          }
        />
      </Field>

      <Field label="3. So sánh">
        <Textarea
          value={item.sections.comparison}
          onChange={(event) => updateSection("comparison", event.target.value)}
        />
      </Field>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
            4. Kết hợp thường gặp
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateItem({
                collocations: [
                  ...item.collocations,
                  {
                    phrase: "",
                    meaning: "",
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Thêm cụm
          </Button>
        </div>

        {item.collocations.map((collocation, index) => (
          <div key={`${item.id}-collocation-${index}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Input
              value={collocation.phrase}
              placeholder="Cụm"
              onChange={(event) =>
                updateItem({
                  collocations: item.collocations.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...current,
                          phrase: event.target.value,
                        }
                      : current,
                  ),
                })
              }
            />
            <Input
              value={collocation.meaning}
              placeholder="Nghĩa"
              onChange={(event) =>
                updateItem({
                  collocations: item.collocations.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...current,
                          meaning: event.target.value,
                        }
                      : current,
                  ),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                updateItem({
                  collocations: item.collocations.filter(
                    (_current, currentIndex) => currentIndex !== index,
                  ),
                })
              }
              aria-label="Xóa cụm từ"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
            5. Ví dụ
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
              placeholder="Phân tích"
              onChange={(event) =>
                updateExample(index, { note: event.target.value })
              }
            />
          </div>
        ))}
      </div>

      <Field label="6. Văn hóa">
        <Textarea
          value={item.sections.culture}
          onChange={(event) => updateSection("culture", event.target.value)}
        />
      </Field>

      <Field label="7. Lưu ý">
        <Textarea
          value={item.sections.warning}
          onChange={(event) => updateSection("warning", event.target.value)}
        />
      </Field>
    </div>
  );
}
