import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function getFieldError(meta: {
  isValid: boolean;
  errors: unknown[];
}): string | undefined {
  if (meta.isValid || meta.errors.length === 0) return undefined;

  return meta.errors
    .map((error) => String(error))
    .filter(Boolean)
    .join(", ");
}

export function getDescribedBy(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

type FieldShellProps = {
  inputId: string;
  label: string;
  required?: boolean;
  description?: ReactNode;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
  className?: string;
};

export function FieldShell({
  inputId,
  label,
  required,
  description,
  descriptionId,
  error,
  errorId,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-black text-text-primary"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      {children}

      {description && (
        <p id={descriptionId} className="text-xs font-semibold text-text-muted">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
