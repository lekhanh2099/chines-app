import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
export function OverviewStatPill({ label }: { label: string }) {
 return (
  <StudyInstructionText
   variant="overline"
   tone="muted"
   weight="black"
   tracking="wide"
   transform="uppercase"
   className="rounded-full border border-border-default bg-bg-subtle px-3 py-1"
  >
   {label}
  </StudyInstructionText>
 );
}
