"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useQuickNote() {
 const [isCreating, setIsCreating] = useState(false);
 const supabase = createClient();
 const router = useRouter();

 const handleCreate = async () => {
  if (isCreating) return;
  setIsCreating(true);

  try {
   const {
    data: { user },
   } = await supabase.auth.getUser();
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

 return { handleCreate, isCreating };
}
