import { HanziHomeReadingSettingsSection } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { DailyReadingSettingsPanel } from "@/features/hanzihome/reader/daily-reading/DailyReadingSettingsPanel";
import { DailyReadingV2ManagementPanel } from "@/features/hanzihome/reader/daily-reading/DailyReadingV2ManagementPanel";
import { SettingsPageContent } from "@/features/settings/SettingsPageContent";

export default async function SettingsPage({ searchParams }: PageProps<"/[locale]/settings">) {
 const params = await searchParams;
 const rawSection = params.section;
 const rawPanel = params.panel;
 const sectionValue = Array.isArray(rawSection) ? rawSection[0] : rawSection;
 const aiPanelValue = Array.isArray(rawPanel) ? rawPanel[0] : rawPanel;

 return (
  <SettingsPageContent
   sectionValue={sectionValue}
   aiPanelValue={aiPanelValue}
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
