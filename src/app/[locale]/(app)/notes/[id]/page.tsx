"use client";

import { use } from "react";
import { NoteTabContainer } from "@/features/notes/components/NoteTabContainer";

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params);

 return <NoteTabContainer initialNoteId={id} />;
}
