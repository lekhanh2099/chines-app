import { z } from "zod";

export function getSafeNextPath(value: z.input<z.ZodOptional<z.ZodNullable<z.ZodString>>>) {
 return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
