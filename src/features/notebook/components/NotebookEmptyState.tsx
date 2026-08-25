import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function NotebookEmptyState() {
 const t = useTranslations("Notebook");

 return (
  <Card
   variant="section"
   padding="lg"
   className="grid min-h-72 content-center justify-items-center text-center"
  >
   <EmptyState
    size="spacious"
    icon={<SearchX />}
    title={t("empty.title")}
    description={t("empty.description")}
   />
  </Card>
 );
}
