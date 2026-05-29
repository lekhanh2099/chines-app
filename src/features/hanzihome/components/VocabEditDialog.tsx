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
  updateHanziHomeVocabPayloadSchema,
  type UpdateHanziHomeVocabPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import {
  useDeleteHanziHomeVocab,
  useUpdateHanziHomeVocab,
} from "@/features/hanzihome/hooks/useUpdateHanziHomeVocab";
import type { VocabExample, VocabViewModel } from "@/features/hanzihome/types";

type EditableSection = VocabViewModel["detailSections"][number];

type VocabEditDialogProps = {
  lessonId: string;
  word: VocabViewModel;
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
  word: VocabViewModel,
): UpdateHanziHomeVocabPayload {
  return {
    lessonId,
    word: word.word,
    pinyin: word.pinyin,
    hanViet: word.hanViet,
    meaning: word.meaning,
    category: word.category,
    level: word.level,
    pos: {
      vi: word.pos?.vi,
      zh: word.pos?.zh,
    },
    examplesParsed: word.examplesParsed,
    detailSections: word.detailSections,
  };
}

export function VocabEditDialog({ lessonId, word }: VocabEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [formValue, setFormValue] = useState(() =>
    toInitialPayload(lessonId, word),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateMutation = useUpdateHanziHomeVocab();
  const deleteMutation = useDeleteHanziHomeVocab();

  const updateField = (
    field: keyof Pick<
      UpdateHanziHomeVocabPayload,
      "word" | "pinyin" | "hanViet" | "meaning" | "category" | "level"
    >,
    value: string,
  ) => {
    setFormValue((current) => ({ ...current, [field]: value }));
  };

  const updatePos = (field: "vi" | "zh", value: string) => {
    setFormValue((current) => ({
      ...current,
      pos: {
        ...current.pos,
        [field]: value,
      },
    }));
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
    const parsed = updateHanziHomeVocabPayloadSchema.safeParse(formValue);

    if (!parsed.success) {
      setError("Kiểm tra lại các trường bắt buộc trước khi lưu.");
      return;
    }

    setError(null);

    try {
      await updateMutation.mutateAsync({
        vocabItemId: word.id,
        payload: parsed.data,
      });
      toast.success("Đã lưu từ vựng");
      setOpen(false);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không lưu được từ vựng",
      );
    }
  };

  const handleDelete = async () => {
    setError(null);

    try {
      await deleteMutation.mutateAsync(word.id);
      toast.success("Đã xóa từ vựng");
      setOpen(false);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không xóa được từ vựng",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setFormValue(toInitialPayload(lessonId, word));
          setError(null);
          setConfirmDelete(false);
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
          <DialogTitle>Sửa từ vựng</DialogTitle>
          <DialogDescription>
            Lưu thay đổi vào bản cá nhân của bài học này.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Từ">
              <Input
                value={formValue.word}
                onChange={(event) => updateField("word", event.target.value)}
              />
            </Field>
            <Field label="Pinyin">
              <Input
                value={formValue.pinyin}
                onChange={(event) => updateField("pinyin", event.target.value)}
              />
            </Field>
            <Field label="Hán Việt">
              <Input
                value={formValue.hanViet}
                onChange={(event) => updateField("hanViet", event.target.value)}
              />
            </Field>
            <Field label="Nghĩa">
              <Input
                value={formValue.meaning}
                onChange={(event) => updateField("meaning", event.target.value)}
              />
            </Field>
            <Field label="Nhóm từ">
              <Input
                value={formValue.category}
                onChange={(event) => updateField("category", event.target.value)}
              />
            </Field>
            <Field label="Level">
              <Input
                value={formValue.level ?? ""}
                onChange={(event) => updateField("level", event.target.value)}
              />
            </Field>
            <Field label="Từ loại VI">
              <Input
                value={formValue.pos?.vi ?? ""}
                onChange={(event) => updatePos("vi", event.target.value)}
              />
            </Field>
            <Field label="Từ loại ZH">
              <Input
                value={formValue.pos?.zh ?? ""}
                onChange={(event) => updatePos("zh", event.target.value)}
              />
            </Field>
          </div>

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

          {confirmDelete && (
            <div className="grid gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <p className="font-black text-destructive">
                Xóa từ “{word.word}” khỏi bài học này?
              </p>
              <p className="font-semibold text-text-secondary">
                Thao tác này sẽ xóa cả ví dụ và phần chi tiết của từ này.
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {confirmDelete ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending || deleteMutation.isPending}
                onClick={() => setConfirmDelete(false)}
              >
                Hủy xóa
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={updateMutation.isPending || deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="h-4 w-4" />
                Xác nhận xóa
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={updateMutation.isPending || deleteMutation.isPending}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Xóa từ
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={updateMutation.isPending || deleteMutation.isPending}
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending || deleteMutation.isPending}
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
