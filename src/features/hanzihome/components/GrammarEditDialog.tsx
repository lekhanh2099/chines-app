"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateHanziHomeGrammarPayloadSchema,
  type UpdateHanziHomeGrammarPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { useUpdateHanziHomeGrammar } from "@/features/hanzihome/hooks/useUpdateHanziHomeGrammar";
import type { GrammarViewModel, VocabExample } from "@/features/hanzihome/types";

type EditableSection = NonNullable<GrammarViewModel["detailSections"]>[number];

type GrammarEditDialogProps = {
  lessonId: string;
  point: GrammarViewModel;
};

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toInitialPayload(
  lessonId: string,
  point: GrammarViewModel,
): UpdateHanziHomeGrammarPayload {
  return {
    lessonId,
    title: point.title ?? point.cleanTitle,
    cleanTitle: point.cleanTitle,
    core: point.core,
    contentMd: point.contentMd,
    structuresView: point.structuresView,
    notes: point.notes,
    examplesParsed: point.examplesParsed,
    detailSections: point.detailSections ?? [],
  };
}

export function GrammarEditDialog({ lessonId, point }: GrammarEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [formValue, setFormValue] = useState(() =>
    toInitialPayload(lessonId, point),
  );
  const [error, setError] = useState<string | null>(null);
  const updateMutation = useUpdateHanziHomeGrammar();

  const updateField = (
    field: keyof Pick<
      UpdateHanziHomeGrammarPayload,
      "title" | "cleanTitle" | "core" | "contentMd"
    >,
    value: string,
  ) => {
    setFormValue((current) => ({ ...current, [field]: value }));
  };

  const updateExample = (
    index: number,
    field: keyof VocabExample,
    value: string,
  ) => {
    setFormValue((current) => ({
      ...current,
      examplesParsed: current.examplesParsed.map((example, currentIndex) =>
        currentIndex === index ? { ...example, [field]: value } : example,
      ),
    }));
  };

  const updateSection = (
    index: number,
    field: keyof EditableSection,
    value: string,
  ) => {
    setFormValue((current) => ({
      ...current,
      detailSections: current.detailSections.map((section, currentIndex) => {
        if (currentIndex !== index) return section;

        return {
          ...section,
          [field]: field === "lines" ? textToLines(value) : value,
        };
      }),
    }));
  };

  const handleSubmit = async () => {
    const parsed = updateHanziHomeGrammarPayloadSchema.safeParse(formValue);

    if (!parsed.success) {
      setError("Kiểm tra lại các trường bắt buộc trước khi lưu.");
      return;
    }

    setError(null);

    try {
      await updateMutation.mutateAsync({
        grammarPointId: point.id,
        payload: parsed.data,
      });
      toast.success("Đã lưu ngữ pháp");
      setOpen(false);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không lưu được ngữ pháp",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setFormValue(toInitialPayload(lessonId, point));
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Pencil className="h-4 w-4" />
          Sửa
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-xl p-4">
        <DialogHeader>
          <DialogTitle>Sửa ngữ pháp</DialogTitle>
          <DialogDescription>
            Lưu thay đổi vào dữ liệu Supabase của bài hiện tại.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Tiêu đề">
              <Input
                value={formValue.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </Field>
            <Field label="Tiêu đề sạch">
              <Input
                value={formValue.cleanTitle}
                onChange={(event) =>
                  updateField("cleanTitle", event.target.value)
                }
              />
            </Field>
          </div>

          <Field label="Core">
            <Textarea
              value={formValue.core}
              className="min-h-24 rounded-xl"
              onChange={(event) => updateField("core", event.target.value)}
            />
          </Field>

          <Field label="Content markdown">
            <Textarea
              value={formValue.contentMd ?? ""}
              className="min-h-28 rounded-xl"
              onChange={(event) => updateField("contentMd", event.target.value)}
            />
          </Field>

          <EditableLines
            title="Cấu trúc"
            values={formValue.structuresView}
            onChange={(values) =>
              setFormValue((current) => ({
                ...current,
                structuresView: values,
              }))
            }
          />

          <EditableLines
            title="Lưu ý"
            values={formValue.notes}
            onChange={(values) =>
              setFormValue((current) => ({ ...current, notes: values }))
            }
          />

          <EditListHeader
            title="Ví dụ"
            onAdd={() =>
              setFormValue((current) => ({
                ...current,
                examplesParsed: [
                  ...current.examplesParsed,
                  { zh: "", pinyin: "", vi: "", note: "" },
                ],
              }))
            }
          />
          <div className="grid gap-2">
            {formValue.examplesParsed.map((example, index) => (
              <div
                key={`example-${index}`}
                className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-text-muted">
                    Ví dụ {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormValue((current) => ({
                        ...current,
                        examplesParsed: current.examplesParsed.filter(
                          (_item, currentIndex) => currentIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </Button>
                </div>
                <Input
                  value={example.zh}
                  placeholder="中文"
                  onChange={(event) =>
                    updateExample(index, "zh", event.target.value)
                  }
                />
                <Input
                  value={example.pinyin ?? ""}
                  placeholder="Pinyin"
                  onChange={(event) =>
                    updateExample(index, "pinyin", event.target.value)
                  }
                />
                <Input
                  value={example.vi ?? ""}
                  placeholder="Dịch nghĩa"
                  onChange={(event) =>
                    updateExample(index, "vi", event.target.value)
                  }
                />
                <Textarea
                  value={example.note ?? ""}
                  placeholder="Ghi chú"
                  className="min-h-20 rounded-xl"
                  onChange={(event) =>
                    updateExample(index, "note", event.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <EditListHeader
            title="Phần chi tiết"
            onAdd={() =>
              setFormValue((current) => ({
                ...current,
                detailSections: [
                  ...current.detailSections,
                  {
                    key: `section-${current.detailSections.length + 1}`,
                    title: "",
                    lines: [],
                  },
                ],
              }))
            }
          />
          <div className="grid gap-2">
            {formValue.detailSections.map((section, index) => (
              <div
                key={`section-${index}`}
                className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-text-muted">
                    Section {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormValue((current) => ({
                        ...current,
                        detailSections: current.detailSections.filter(
                          (_item, currentIndex) => currentIndex !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={section.key}
                    placeholder="key"
                    onChange={(event) =>
                      updateSection(index, "key", event.target.value)
                    }
                  />
                  <Input
                    value={section.title}
                    placeholder="Tiêu đề"
                    onChange={(event) =>
                      updateSection(index, "title", event.target.value)
                    }
                  />
                </div>
                <Textarea
                  value={linesToText(section.lines)}
                  placeholder="Mỗi dòng là một ý"
                  className="min-h-24 rounded-xl"
                  onChange={(event) =>
                    updateSection(index, "lines", event.target.value)
                  }
                />
              </div>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm font-bold text-destructive">
              {error}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={updateMutation.isPending}
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-black text-text-primary">
      {label}
      {children}
    </label>
  );
}

function EditableLines({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <EditListHeader
        title={title}
        onAdd={() => onChange([...values, ""])}
      />
      {values.map((value, index) => (
        <div key={`${title}-${index}`} className="flex gap-2">
          <Input
            value={value}
            onChange={(event) =>
              onChange(
                values.map((item, currentIndex) =>
                  currentIndex === index ? event.target.value : item,
                ),
              )
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Xóa ${title} ${index + 1}`}
            onClick={() =>
              onChange(
                values.filter((_item, currentIndex) => currentIndex !== index),
              )
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function EditListHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-black text-text-primary">{title}</h3>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Thêm
      </Button>
    </div>
  );
}
