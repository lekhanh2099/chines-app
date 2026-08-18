import { z } from "zod";

export const AiSettingsPanelSchema = z.enum([
 "conversation",
 "daily-reading",
 "providers",
 "usage",
 "advanced",
]);

const AiSettingsPanelParamSchema = z.string().optional();

export type AiSettingsPanel = z.infer<typeof AiSettingsPanelSchema>;

export function resolveAiSettingsPanel(value: z.input<typeof AiSettingsPanelParamSchema>): AiSettingsPanel {
 const param = AiSettingsPanelParamSchema.safeParse(value);
 if (!param.success) return AiSettingsPanelSchema.enum.conversation;

 const parsed = AiSettingsPanelSchema.safeParse(param.data);
 return parsed.success ? parsed.data : AiSettingsPanelSchema.enum.conversation;
}
