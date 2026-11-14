import { getLocale, getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Typography } from "@/components/ui/display/typography";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { getDictionarySrsCollection } from "./dictionary-srs-api";
import { DictionarySrsCollection } from "./DictionarySrsCollection";

type DictionarySrsPageProps = {
 searchParams?: Promise<{
  q?: string;
 }>;
};

export async function DictionarySrsPage({ searchParams }: DictionarySrsPageProps) {
 const locale = await getLocale();
 const t = await getTranslations("Dictionary.srs");
 const resolvedSearchParams = await searchParams;
 const initialQuery = resolvedSearchParams?.q ?? "";
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  redirect({ href: "/login", locale });
  return null;
 }

 let collection: Awaited<ReturnType<typeof getDictionarySrsCollection>>;
 try {
  collection = await getDictionarySrsCollection(supabase, user.id);
 } catch {
  const common = await getTranslations("Common");
  return (
   <PageContainer>
    <div className="grid gap-5">
     <PageHeader title={t("title")} eyebrow={t("eyebrow")} description={t("description")} />
     <Card role="alert" variant="subtle" padding="md" className="grid gap-3">
      <Typography as="h2" variant="sectionTitle" weight="bold">
       {t("loadErrorTitle")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary">
       {t("loadErrorDescription")}
      </Typography>
      <form method="get">
       <Input type="hidden" name="q" value={resolvedSearchParams?.q ?? ""} />
       <Button type="submit">{common("actions.retry")}</Button>
      </form>
     </Card>
    </div>
   </PageContainer>
  );
 }

 let learningLoopDueCount = 0;
 try {
  const dueResult = await createServiceRoleSupabaseClient()
   .from("hanzihome_learning_loop_items")
   .select("id", { count: "exact", head: true })
   .eq("user_id", user.id)
   .lte("due_at", new Date().toISOString());
  if (!dueResult.error) learningLoopDueCount = dueResult.count ?? 0;
 } catch {
  learningLoopDueCount = 0;
 }

 return (
  <DictionarySrsCollection
   key={initialQuery}
   collection={collection}
   initialQuery={initialQuery}
   learningLoopDueCount={learningLoopDueCount}
  />
 );
}
