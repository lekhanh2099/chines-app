import { Typography } from "@/components/ui/typography";

type Props = React.ComponentProps<"h2">;

export function Title({ className, ...props }: Props) {
 return (
  <Typography
   as="h2"
   variant="sectionTitle"
   weight="bold"
   data-slot="form-title"
   className={className}
   {...props}
  />
 );
}
