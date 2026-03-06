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
     <button
      type="submit"
      {...props}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-8 rounded hover:bg-indigo-700 transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
     >
      {(state.isSubmitting || isLoading) && (
       <Loader2 className="w-5 h-5 animate-spin" />
      )}
      {children}
     </button>
    );
   }}
  </form.Subscribe>
 );
}
