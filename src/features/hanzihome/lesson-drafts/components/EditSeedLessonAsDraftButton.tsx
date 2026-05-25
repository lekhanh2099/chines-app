"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCreateLessonDraftFromSeedMutation } from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";

type EditSeedLessonAsDraftButtonProps = {
  lessonId: string;
  size?: "xs" | "sm" | "default";
  className?: string;
};

export function EditSeedLessonAsDraftButton({
  lessonId,
  size = "sm",
  className,
}: EditSeedLessonAsDraftButtonProps) {
  const router = useRouter();
  const createDraftMutation = useCreateLessonDraftFromSeedMutation();

  const handleClick = async () => {
    try {
      const result = await createDraftMutation.mutateAsync(lessonId);

      toast.success(
        result.reused
          ? "Đã mở bản chỉnh sửa của bài này."
          : "Đã tạo bản chỉnh sửa cho bài học.",
      );
      router.push(`/hanzihome/drafts/${result.draft.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không tạo được draft.",
      );
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      disabled={createDraftMutation.isPending}
      onClick={() => void handleClick()}
    >
      <Pencil className="h-4 w-4" />
      {createDraftMutation.isPending ? "Đang mở..." : "Chỉnh sửa"}
    </Button>
  );
}
