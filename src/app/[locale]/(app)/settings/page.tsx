import { HanziHomeReadingSettingsSection } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { DailyReadingSettingsPanel } from "@/features/hanzihome/reader/daily-reading/DailyReadingSettingsPanel";
import { SettingsPageContent } from "@/features/settings/SettingsPageContent";

export default async function SettingsPage({ searchParams }: PageProps<"/[locale]/settings">) {
 const params = await searchParams;
 const rawSection = params.section;
 const sectionValue = Array.isArray(rawSection) ? rawSection[0] : rawSection;

 return (
  <SettingsPageContent
   sectionValue={sectionValue}
   readingSettings={
    <div className="grid gap-4">
     <HanziHomeReadingSettingsSection />
     <DailyReadingSettingsPanel />
    </div>
   }
  />
 );
}
