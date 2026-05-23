"use client";

import * as React from "react";

import {
 Select as SelectRoot,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { IOption } from "@/types/option";

type SimpleSelectProps = {
 selectValue?: IOption | null;
 options: IOption[];
 triggerPlaceholder?: string;
 triggerClassName?: string;
 contentClassName?: string;
 disabled?: boolean;
 errorMessage?: React.ReactNode;
 onChange: (option: IOption | null, selectedOption?: IOption | null) => void;
};

function stringifyValue(value: IOption["value"]) {
 return String(value);
}

export function Select({
 selectValue,
 options,
 triggerPlaceholder = "Select option",
 triggerClassName,
 contentClassName,
 disabled,
 errorMessage,
 onChange,
}: SimpleSelectProps) {
 const selectedValue =
  selectValue?.value !== undefined ? stringifyValue(selectValue.value) : "";

 const handleValueChange = (value: string) => {
  const selectedOption =
   options.find((option) => stringifyValue(option.value) === value) ?? null;

  onChange(selectedOption, selectedOption);
 };

 return (
  <div className="w-full">
   <SelectRoot
    value={selectedValue}
    onValueChange={handleValueChange}
    disabled={disabled}
   >
    <SelectTrigger
     className={cn(
      "bg-bg-field-default border-stroke-default h-9 w-full rounded border px-2 text-left",
      "focus-visible:border-stroke-active-focus",
      "disabled:bg-bg-field-disable disabled:border-stroke-disabled disabled:opacity-100",
      errorMessage && "border-stroke-error",
      triggerClassName,
     )}
    >
     <SelectValue placeholder={triggerPlaceholder} />
    </SelectTrigger>

    <SelectContent
     className={cn("min-w-(--radix-select-trigger-width)", contentClassName)}
     position="popper"
     align="start"
    >
     {options.map((option) => (
      <SelectItem
       key={stringifyValue(option.value)}
       value={stringifyValue(option.value)}
       disabled={option.disabled || option.isDisabled}
      >
       <div className="flex min-w-0 items-center gap-2">
        {option.icon && (
         <span className="flex size-4 flex-none items-center justify-center">
          {typeof option.icon === "function" ? option.icon() : option.icon}
         </span>
        )}

        <span className="truncate">{option.label}</span>
       </div>
      </SelectItem>
     ))}
    </SelectContent>
   </SelectRoot>

   {errorMessage && (
    <p className="text-burnt-siena mt-1 text-sm">{errorMessage}</p>
   )}
  </div>
 );
}

export default Select;
