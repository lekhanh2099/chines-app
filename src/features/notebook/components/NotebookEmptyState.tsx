import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { Card } from "@/components/ui/card";

export function NotebookEmptyState() {
 return (
  <Card
   variant="section"
   padding="lg"
   className="grid min-h-72 content-center justify-items-center text-center"
  >
   <EmptyState
    size="spacious"
    icon={<SearchX />}
    title="Không tìm thấy mục phù hợp"
    description="Thử đổi từ khóa hoặc chọn một nhóm chức năng khác."
   />
  </Card>
 );
}
