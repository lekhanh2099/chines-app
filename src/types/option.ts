import { z } from "zod";

export const IOptionSchema = z.object({
 value: z.union([z.string(), z.number()]),
 label: z.any(),
 icon: z.any().optional(),
 isDisabled: z.boolean().optional(),
 disabled: z.boolean().optional(),
});

export type IOption = z.infer<typeof IOptionSchema>;
