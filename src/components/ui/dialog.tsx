import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const DialogContext = React.createContext<{
 open: boolean;
 onOpenChange: (open: boolean) => void;
} | null>(null);

export function Dialog({
 children,
 open = false,
 onOpenChange,
}: {
 children: React.ReactNode;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
}) {
 const [isOpen, setIsOpen] = React.useState(open);

 React.useEffect(() => {
  setIsOpen(open);
 }, [open]);

 const handleOpenChange = (newOpen: boolean) => {
  setIsOpen(newOpen);
  onOpenChange?.(newOpen);
 };

 return (
  <DialogContext.Provider
   value={{ open: isOpen, onOpenChange: handleOpenChange }}
  >
   {children}
  </DialogContext.Provider>
 );
}

export function DialogTrigger({
 children,
 asChild = false,
}: {
 children: React.ReactNode;
 asChild?: boolean;
}) {
 const context = React.useContext(DialogContext);
 if (!context) throw new Error("DialogTrigger must be used within a Dialog");

 const child = React.Children.only(children) as React.ReactElement<any>;

 return React.cloneElement(child, {
  onClick: (e: any) => {
   if (child.props && typeof child.props.onClick === "function") {
    child.props.onClick(e);
   }
   context.onOpenChange(true);
  },
 });
}

export function DialogContent({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 const context = React.useContext(DialogContext);
 if (!context) throw new Error("DialogContent must be used within a Dialog");

 if (!context.open) return null;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
   <div
    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
    onClick={() => context.onOpenChange(false)}
   />
   <div
    className={cn(
     "relative z-50 w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200",
     className,
    )}
   >
    <button
     onClick={() => context.onOpenChange(false)}
     className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
    >
     <X className="w-5 h-5" />
     <span className="sr-only">Close</span>
    </button>
    {children}
   </div>
  </div>
 );
}

export function DialogHeader({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 return (
  <div
   className={cn(
    "flex flex-col gap-2 text-center sm:text-left pr-8",
    className,
   )}
  >
   {children}
  </div>
 );
}

export function DialogTitle({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 return (
  <h2 className={cn("text-xl font-bold text-slate-800", className)}>
   {children}
  </h2>
 );
}

export function DialogDescription({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 return <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
}

export function DialogBody({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 return (
  <div className={cn("mt-6 flex flex-col gap-4", className)}>{children}</div>
 );
}

export function DialogFooter({
 children,
 className,
}: {
 children: React.ReactNode;
 className?: string;
}) {
 return (
  <div
   className={cn(
    "mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3",
    className,
   )}
  >
   {children}
  </div>
 );
}
