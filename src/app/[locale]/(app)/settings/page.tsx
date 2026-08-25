import { HanziHomeReadingSettingsSection } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { DailyReadingSettingsPanel } from "@/features/hanzihome/reader/daily-reading/DailyReadingSettingsPanel";
import { DailyReadingV2ManagementPanel } from "@/features/hanzihome/reader/daily-reading/DailyReadingV2ManagementPanel";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { SettingsPageContent } from "@/features/settings/SettingsPageContent";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export default async function SettingsPage({ searchParams }: PageProps<"/[locale]/settings">) {
 const params = await searchParams;
 const rawSection = params.section;
 const rawPanel = params.panel;
 const sectionValue = Array.isArray(rawSection) ? rawSection[0] : rawSection;
 const aiPanelValue = Array.isArray(rawPanel) ? rawPanel[0] : rawPanel;
 const auth = await requireAuthenticatedRoute();
 const canManageContent =
  auth.authenticated &&
  (await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id));

 return (
  <SettingsPageContent
   sectionValue={sectionValue}
   aiPanelValue={aiPanelValue}
   canManageContent={canManageContent}
   readingSettings={<HanziHomeReadingSettingsSection />}
   dailyReadingSettings={
    <div className="grid gap-4">
     <DailyReadingSettingsPanel />
     <DailyReadingV2ManagementPanel />
    </div>
   }
  />
 );
}
