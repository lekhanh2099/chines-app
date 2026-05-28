"use client";

import { useRouter } from "next/navigation";
import { CopyPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useForkSeedHanziHomeCourseMutation } from "@/features/hanzihome/courses/use-custom-courses";

export function ForkSeedCourseButton({ courseId }: { courseId: string }) {
 const router = useRouter();
 const mutation = useForkSeedHanziHomeCourseMutation();

 return (
  <Button
   type="button"
   variant="outline"
   disabled={mutation.isPending}
   onClick={(event) => {
    event.stopPropagation();

    mutation.mutate(courseId, {
     onSuccess: (result) => {
      toast.success(
       result.reused
        ? "Đã mở bản cá nhân hiện có"
        : "Đã tạo bản cá nhân",
      );

      const params = new URLSearchParams({
       courseId: result.courseId,
      });

      if (result.lessonId) {
       params.set("lessonId", result.lessonId);
      }

      router.push(`/hanzihome?${params.toString()}`);
     },
     onError: (error) => {
      toast.error(
       error instanceof Error ? error.message : "Không thể tạo bản cá nhân",
      );
     },
    });
   }}
  >
   <CopyPlus className="h-4 w-4" />
   {mutation.isPending ? "Đang tạo..." : "Tạo bản cá nhân"}
  </Button>
 );
}
