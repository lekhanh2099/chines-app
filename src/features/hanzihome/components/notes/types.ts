import { z } from "zod";

const MobileNotePaneSchema = z.enum(["reading", "note"]);
export type MobileNotePane = z.infer<typeof MobileNotePaneSchema>;
