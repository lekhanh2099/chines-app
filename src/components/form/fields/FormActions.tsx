"use client";

import { Button } from "@/components/ui/button";
import { useFormContext } from "@/components/form/form-context";
import { cn } from "@/lib/utils";

type FormActionsProps = {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function FormActions({
  submitLabel = "Lưu",
  cancelLabel = "Hủy",
  onCancel,
  disabled,
  className,
}: FormActionsProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <div className={cn("flex flex-wrap justify-end gap-2", className)}>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || disabled}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || disabled}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : submitLabel}
          </Button>
        </div>
      )}
    </form.Subscribe>
  );
}
