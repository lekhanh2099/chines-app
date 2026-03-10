"use client";

import { use } from "react";
import { NoteTabContainer } from "@/components/notes/NoteTabContainer";

export default function NoteEditorPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = use(params);

 return <NoteTabContainer initialNoteId={id} />;
}
