import { Button } from "@/components/ui/button";
import { useFormContext } from "../hooks/form-context";
import { Loader2 } from "lucide-react";

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
     <Button
      type="submit"
      variant="default"
      size="spacious"
      {...props}
      disabled={disabled}
      className={className}
     >
      {(state.isSubmitting || isLoading) && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
     </Button>
    );
   }}
  </form.Subscribe>
 );
}
