import type { ComponentType, ReactNode } from "react";
import { z } from "zod";

export const IOptionValueSchema = z.union([z.string(), z.number()]);

export type IOption = {
 value: z.infer<typeof IOptionValueSchema>;
 label: ReactNode;
 icon?: ComponentType;
 isDisabled?: boolean;
 disabled?: boolean;
};
