"use client";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

interface QuickNoteButtonProps {
 className?: string;
 variant?: "default" | "outline" | "ghost" | "dashed";
 size?: "sm" | "md" | "lg";
}

export function QuickNoteButton({
 className = "",
 variant = "default",
 size = "md",
}: QuickNoteButtonProps) {
 const [isCreating, setIsCreating] = useState(false);
 const supabase = createClient();
 const router = useRouter();

 const handleCreate = async () => {
  if (isCreating) return;
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
  } catch (error) {
   console.error("Error creating quick note:", error);
   toast.error("Không thể tạo ghi chú nhanh");
  } finally {
   setIsCreating(false);
  }
 };

 if (variant === "dashed") {
  return (
   <button
    onClick={handleCreate}
    disabled={isCreating}
    className={`w-full py-4 border-2 border-dashed border-border-default rounded-2xl  text-text-muted hover:  hover:border-accent/40 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 ${className}`}
   >
    {isCreating ? (
     <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
     <Zap className="w-4 h-4" />
    )}
    Ghi Chú Nhanh
   </button>
  );
 }

 const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
 };

 const variantClasses = {
  default:
   "bg-bg-elevated border border-border-default hover:border-accent/40 hover:bg-accent/5 text-text-primary",
  outline:
   "border border-border-default hover:border-accent/40 text-text-secondary hover: ",
  ghost: "text-text-secondary hover:  hover:bg-accent/5",
 };

 return (
  <button
   onClick={handleCreate}
   disabled={isCreating}
   className={`inline-flex items-center gap-2 rounded-2xl  font-semibold transition-colors disabled:opacity-50 shadow-sm ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
  >
   {isCreating ? (
    <Loader2 className="w-4 h-4 animate-spin" />
   ) : (
    <Zap className="w-4 h-4" />
   )}
   Ghi Chú Nhanh
  </button>
 );
}
