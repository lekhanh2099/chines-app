import { Typography } from "@/components/ui/typography";

type Props = React.ComponentProps<"p">;

export function Description({ className, ...props }: Props) {
 return (
  <Typography
   as="p"
   variant="bodySmall"
   tone="muted"
   data-slot="form-description"
   className={className}
   {...props}
  />
 );
}
