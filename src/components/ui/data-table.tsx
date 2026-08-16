import type * as React from "react";

import { cn } from "@/lib/utils";

function DataTable({ className, ...props }: React.ComponentProps<"table">) {
 return (
  <div className="w-full max-w-full overflow-x-auto scrollbar-soft">
   <table
    data-slot="data-table"
    className={cn("w-full min-w-[36rem] border-collapse text-left", className)}
    {...props}
   />
  </div>
 );
}

function DataTableHeader({ className, ...props }: React.ComponentProps<"thead">) {
 return <thead data-slot="data-table-header" className={cn("bg-bg-subtle", className)} {...props} />;
}

function DataTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
 return <tbody data-slot="data-table-body" className={className} {...props} />;
}

function DataTableRow({ className, ...props }: React.ComponentProps<"tr">) {
 return (
  <tr
   data-slot="data-table-row"
   className={cn(
    "border-b border-border-default transition-colors last:border-b-0 hover:bg-bg-subtle/60",
    className,
   )}
   {...props}
  />
 );
}

function DataTableHead({ className, ...props }: React.ComponentProps<"th">) {
 return (
  <th
   data-slot="data-table-head"
   className={cn(
    "px-4 py-2.5 text-xs font-black tracking-wide text-foreground-muted uppercase sm:px-5",
    className,
   )}
   {...props}
  />
 );
}

function DataTableCell({ className, ...props }: React.ComponentProps<"td">) {
 return (
  <td
   data-slot="data-table-cell"
   className={cn("px-4 py-3 align-top text-sm leading-6 text-foreground sm:px-5", className)}
   {...props}
  />
 );
}

export { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow };
