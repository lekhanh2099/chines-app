"use client";

import { Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
 isDuplicateMemoryTipError,
 MemoryTipsApiError,
} from "./memory-tip-api";
import type { CreateMemoryTipPayload } from "./memory-tip.schema";
import { useCreateMemoryTipMutation } from "./useMemoryTips";

type SaveMemoryTipButtonProps = {
 payload: CreateMemoryTipPayload;
 variant?: "outline" | "ghost";
};

export function SaveMemoryTipButton({
 payload,
 variant = "outline",
}: SaveMemoryTipButtonProps) {
 const createMutation = useCreateMemoryTipMutation();

 return (
  <Button
   type="button"
   variant={variant}
   isLoading={createMutation.isPending}
   onClick={async () => {
    try {
     await createMutation.mutateAsync(payload);
     toast.success("Đã lưu nhắc nhanh");
    } catch (error) {
     if (isDuplicateMemoryTipError(error)) {
      toast.info("Tip này đã được lưu rồi.");
      return;
     }

     toast.error(
      error instanceof MemoryTipsApiError
       ? error.message
       : "Không thể lưu nhắc nhanh",
     );
    }
   }}
  >
   <Lightbulb />
   Lưu nhắc nhanh
  </Button>
 );
}
