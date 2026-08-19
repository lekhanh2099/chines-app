import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
type ComparisonRow = { key: string; title: string; body?: string; example?: string };

export function ComparisonGroup({ title, rows }: { title: string; rows: ComparisonRow[] }) {
 return (
  <div className="grid gap-2">
   <Typography
    as="h4"
    variant="cardTitle"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {title}
   </Typography>
   <div className="grid gap-2">
    {rows.map((row) => (
     <div key={row.key} className="rounded-xl border border-border-default bg-bg-primary p-3">
      <StudyInstructionText tone="default" weight="black">
       {row.title}
      </StudyInstructionText>
      {row.body && <StudyInstructionText>{row.body}</StudyInstructionText>}
      {row.example && <StudyInstructionText tone="muted">{row.example}</StudyInstructionText>}
     </div>
    ))}
   </div>
  </div>
 );
}
