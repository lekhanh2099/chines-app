import type { ComponentType, ReactNode } from "react";
import { z } from "zod";

export const IOptionValueSchema = z.string();

export type IOption = {
 value: z.infer<typeof IOptionValueSchema>;
 label: ReactNode;
 icon?: ComponentType;
 isDisabled?: boolean;
 disabled?: boolean;
};
