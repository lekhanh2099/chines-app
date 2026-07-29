import { Typography } from "@/components/ui/typography";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { Card } from "@/components/ui/card";
import type { NotebookItem } from "@/features/notebook/types";

export function NotebookMatrixView({ items }: { items: NotebookItem[] }) {
 return (
  <Card variant="glass" padding="none" className="overflow-hidden">
   <div className="overflow-x-auto">
    <table className="w-full min-w-[52rem] border-collapse text-left">
     <thead className="bg-bg-subtle/80">
      <tr className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
       <th className="px-5 py-4">Từ</th>
       <th className="px-5 py-4">Bản chất</th>
       <th className="px-5 py-4">Công thức</th>
       <th className="px-5 py-4">Dùng khi</th>
       <th className="px-5 py-4">Tránh</th>
      </tr>
     </thead>
     <tbody>
      {items.map((item) => (
       <tr key={item.id} className="border-t border-border-default align-top">
        <td className="px-5 py-5 grid gap-1">
         <LearnerHanziText as="strong" size="display" tone="default" className="block">
          {item.term}
         </LearnerHanziText>
         <Typography variant="label" tone="accent" weight="bold" className="block">
          {item.p}
         </Typography>
         <Typography variant="bodySmall" tone="secondary" weight="semibold" className="block">
          {item.vi}
         </Typography>
        </td>
        <td className="max-w-xs px-5 py-5 text-sm font-medium leading-6 text-text-secondary">
         {item.essence}
        </td>
        <td className="px-5 py-5">
         <Typography
          variant="code"
          tone="accent"
          weight="bold"
          className="block rounded-xl bg-accent-subtle px-3 py-2"
         >
          {item.pattern}
         </Typography>
        </td>
        <td className="max-w-xs px-5 py-5 text-sm font-medium leading-6 text-text-secondary">
         {item.use}
        </td>
        <td className="max-w-xs px-5 py-5 text-sm font-medium leading-6 text-text-muted">
         {item.avoid}
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </Card>
 );
}
