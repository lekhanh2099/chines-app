import { Typography } from "@/components/ui/display/typography";

export function OverviewStatPill({ label }: { label: string }) {
 return (
  <Typography as="span" variant="caption" tone="muted" weight="bold">
   {label}
  </Typography>
 );
}
