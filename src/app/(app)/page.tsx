"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Root page `/` — simply redirects to /notes.
 * All smart routing logic lives in /notes via useNoteRouting.
 */
export default function RootPage() {
 const router = useRouter();

 useEffect(() => {
  router.replace("/notes");
 }, [router]);

 return (
  <div className="flex items-center justify-center h-full">
   <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
  </div>
 );
}
