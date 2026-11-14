import { z } from "zod";

export const MobileNotePaneSchema = z.enum(["reading", "note"]);
export type MobileNotePane = z.infer<typeof MobileNotePaneSchema>;
