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

export type AppSelectOption = {
 value: string | number | boolean;
 label: React.ReactNode;
 icon?: React.ReactNode | (() => React.ReactNode);
 disabled?: boolean;
 isDisabled?: boolean;
};

type AppSelectProps = {
 value?: AppSelectOption | null;
 selectValue?: AppSelectOption | null;
 options: AppSelectOption[];
 placeholder?: string;
 triggerPlaceholder?: string;
 disabled?: boolean;
 errorMessage?: React.ReactNode;
 triggerClassName?: string;
 contentClassName?: string;
 itemClassName?: string;
 onChange: (option: AppSelectOption | null, selectedOption?: AppSelectOption | null) => void;
};

function stringifyValue(value: AppSelectOption["value"]) {
 return String(value);
}

function renderIcon(icon: AppSelectOption["icon"]) {
 if (!icon) return null;

 return (
  <span className="flex size-4 shrink-0 items-center justify-center">
   {typeof icon === "function" ? icon() : icon}
  </span>
 );
}

export function SelectNew({
 value,
 selectValue,
 options,
 placeholder,
 triggerPlaceholder = "Chọn mục",
 disabled,
 errorMessage,
 triggerClassName,
 contentClassName,
 itemClassName,
 onChange,
}: AppSelectProps) {
 const currentValue = value ?? selectValue ?? null;
 const selectedValue = currentValue?.value !== undefined ? stringifyValue(currentValue.value) : "";

 const handleValueChange = (nextValue: string) => {
  const selectedOption =
   options.find((option) => stringifyValue(option.value) === nextValue) ?? null;

  onChange(selectedOption, selectedOption);
 };

 return (
  <div className="grid w-full gap-1">
   <SelectRoot value={selectedValue} onValueChange={handleValueChange} disabled={disabled}>
    <SelectTrigger
     className={cn(
      "h-9 w-full rounded-xl border border-border-default bg-bg-primary px-2 text-left shadow-none",
      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
      "disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:opacity-70",
      errorMessage && "border-danger",
      triggerClassName,
     )}
    >
     <SelectValue placeholder={placeholder ?? triggerPlaceholder} />
    </SelectTrigger>

    <SelectContent
     position="popper"
     align="start"
     className={cn(
      "min-w-(--radix-select-trigger-width) max-w-[min(24rem,calc(100vw-2rem))]",
      contentClassName,
     )}
    >
     {options.map((option) => (
      <SelectItem
       key={stringifyValue(option.value)}
       value={stringifyValue(option.value)}
       disabled={option.disabled || option.isDisabled}
       className={cn("min-h-9", itemClassName)}
      >
       <span className="flex min-w-0 items-center gap-2">
        {renderIcon(option.icon)}
        <span className="min-w-0 flex-1 truncate">{option.label}</span>
       </span>
      </SelectItem>
     ))}
    </SelectContent>
   </SelectRoot>

   {errorMessage && <p className=" font-semibold text-danger">{errorMessage}</p>}
  </div>
 );
}

export default SelectNew;
