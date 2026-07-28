import { z } from "zod";

const SafeNextPathInputSchema = z.string().nullable().optional();

export function getSafeNextPath(value: z.input<typeof SafeNextPathInputSchema>) {
 return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
