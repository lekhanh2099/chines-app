import { SearchX } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass-panel";

export function NotebookEmptyState() {
 return (
  <GlassPanel className="grid min-h-72 content-center justify-items-center gap-4 p-8 text-center">
   <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-text">
    <SearchX className="h-6 w-6" />
   </span>
   <div className="grid gap-2">
    <h2 className="text-xl font-black text-text-primary">Không tìm thấy mục phù hợp</h2>
    <p className="max-w-md text-sm font-medium leading-6 text-text-muted">
     Thử đổi từ khóa hoặc chọn một nhóm chức năng khác.
    </p>
   </div>
  </GlassPanel>
 );
}
