"use client";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { focusModeStore } from "@/stores/focus-mode-store";
import { cn } from "@/lib/utils";
import { z } from "zod";

const QuickNoteVariantSchema = z.enum(["default", "outline", "ghost", "dashed"]);

interface QuickNoteButtonProps {
 className?: string;
 variant?: z.infer<typeof QuickNoteVariantSchema>;
 compactOnTablet?: boolean;
}

export function QuickNoteButton({
 className = "",
 variant = QuickNoteVariantSchema.enum.default,
 compactOnTablet = false,
}: QuickNoteButtonProps) {
 const [isCreating, setIsCreating] = useState(false);
 const supabase = createClient();
 const router = useRouter();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 const handleCreate = async () => {
  if (isCreating) return;
  if (focusModeEnabled) {
   toast.warning("Focus mode đang bật. Không thể tạo ghi chú mới.");
   return;
  }

  setIsCreating(true);

  try {
   const user = await getClientSessionUser(supabase);
   if (!user) {
    router.push("/login");
    return;
   }

   const now = new Date();
   const title = `Ghi chú nhanh — ${now.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
   })}`;

   const { data, error } = await supabase
    .from("notes")
    .insert({
     user_id: user.id,
     title,
     tags: ["quick-note"],
     content: {
      type: "doc",
      content: [{ type: "paragraph" }],
     },
    })
    .select()
    .single();

   if (error) throw error;

   router.push(`/notes/${data.id}`);
  } catch {
   toast.error("Không thể tạo ghi chú nhanh");
  } finally {
   setIsCreating(false);
  }
 };

 return (
  <Button
   type="button"
   variant={variant}
   size={compactOnTablet ? "toolbar" : "touch"}
   onClick={handleCreate}
   disabled={isCreating || focusModeEnabled}
   aria-label="Tạo ghi chú nhanh"
   title="Tạo ghi chú nhanh"
   className={cn(variant === "dashed" && "w-full", className)}
  >
   {isCreating ? (
    <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
   ) : (
    <Zap data-icon="inline-start" className="size-4" />
   )}
   <span className={cn(compactOnTablet && "hidden 2xl:inline")}>Ghi chú nhanh</span>
  </Button>
 );
}
