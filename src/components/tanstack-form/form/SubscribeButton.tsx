import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFormContext } from "../hooks/form-context";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
 requireDirtyCheck?: boolean;
 isLoading?: boolean;
};

export function SubscribeButton({
 requireDirtyCheck = true,
 isLoading,
 children,
 className,
 ...props
}: Props) {
 const form = useFormContext();

 return (
  <form.Subscribe selector={(state) => state}>
   {(state) => {
    const disabled =
     (requireDirtyCheck && !state.isDirty) ||
     state.isSubmitting ||
     props.disabled ||
     !state.isValid ||
     isLoading;

    return (
     <Button type="submit" variant="default" size="touch" {...props} disabled={disabled} className={className}>
      {state.isSubmitting || isLoading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
      {children}
     </Button>
    );
   }}
  </form.Subscribe>
 );
}
