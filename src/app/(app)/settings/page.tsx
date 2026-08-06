import { HanziHomeReadingSettingsSection } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { SettingsPageContent } from "@/features/settings/SettingsPageContent";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
 const params = await searchParams;
 const rawSection = params.section;
 const sectionValue = Array.isArray(rawSection) ? rawSection[0] : rawSection;

 return (
  <SettingsPageContent
   sectionValue={sectionValue}
   readingSettings={<HanziHomeReadingSettingsSection />}
  />
 );
}
