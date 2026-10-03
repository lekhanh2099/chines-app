import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { z } from "zod";

import { focusRingClassName, invalidFocusRingClassName } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";

const TextareaFontSchema = z.enum(["sans", "mono"]);

const textareaVariants = cva(
 cn(
  "w-full resize-y rounded-lg border text-text-primary transition-colors placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50",
  focusRingClassName,
  invalidFocusRingClassName,
 ),
 {
  variants: {
   density: {
    compact: "min-h-20 px-3 py-2 text-sm leading-6",
    default: "min-h-24 px-4 py-3 leading-relaxed",
    comfortable: "min-h-32 px-4 py-3 leading-7",
   },
   surface: {
    default: "border-input bg-bg-input",
    field: "border-input bg-bg-input",
    transparent: "border-transparent bg-transparent",
   },
   resize: {
    vertical: "resize-y",
    none: "resize-none",
   },
  },
  defaultVariants: {
   density: "default",
   surface: "default",
   resize: "vertical",
  },
 },
);

type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> &
 VariantProps<typeof textareaVariants> & {
  font?: z.infer<typeof TextareaFontSchema>;
 };

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
 ({ className, density, font = TextareaFontSchema.enum.sans, resize, surface, ...props }, ref) => (
  <textarea
   ref={ref}
   className={cn(
    textareaVariants({ density, resize, surface }),
    font === TextareaFontSchema.enum.mono && "font-mono",
    className,
   )}
   {...props}
  />
 ),
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
export type { TextareaProps };
