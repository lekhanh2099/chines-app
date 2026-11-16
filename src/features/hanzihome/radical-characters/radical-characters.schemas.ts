import { z } from "zod";

const radicalCharacterSchema = z.object({
 hanzi: z.string().min(1),
 // Traditional or variant written forms of the same character.
 otherForms: z.array(z.string().min(1)),
 pinyin: z.string().min(1),
 hanViet: z.string().min(1),
 components: z.string().min(1),
 explanation: z.string().min(1),
});

const radicalCharacterGroupSchema = z.object({
 name: z.string().min(1),
 characters: z.array(radicalCharacterSchema).min(1),
});

const radicalCharacterSetSchema = z.object({
 order: z.number().int().positive(),
 radical: z.string().min(1),
 hanViet: z.string().min(1),
 // `hanzihome_radicals.id` of the matching row; empty when the radical has no row yet.
 radicalId: z.string(),
 groups: z.array(radicalCharacterGroupSchema).min(1),
});

export const radicalCharactersContentSchema = z.object({
 radicals: z.array(radicalCharacterSetSchema).min(1),
});

const radicalCharacterViewSchema = z.enum(["grid", "list"]);

export type RadicalCharacterView = z.output<typeof radicalCharacterViewSchema>;
export type RadicalCharactersContent = z.infer<typeof radicalCharactersContentSchema>;
export type RadicalCharacterSet = z.infer<typeof radicalCharacterSetSchema>;
export type RadicalCharacter = z.infer<typeof radicalCharacterSchema>;
