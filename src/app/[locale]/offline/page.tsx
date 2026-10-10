import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import { OfflineStudyWorkspace } from "@/features/hanzihome/OfflineStudyWorkspace";

export default async function OfflinePage() {
 const t = await getTranslations("Common.offlineStudy");
 return (
  <main className="flex min-h-dvh min-w-0 flex-col gap-3 bg-bg-primary p-4 sm:p-6">
   <Suspense
    fallback={
     <Card padding="lg">
      <PageHeader title={t("title")} description={t("loading")} />
     </Card>
    }
   >
    <OfflineStudyWorkspace />
   </Suspense>
  </main>
 );
}
