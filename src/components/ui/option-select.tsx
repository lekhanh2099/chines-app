"use client";

import * as React from "react";

import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { IOption } from "@/types/option";

type OptionSelectProps = {
 value?: IOption["value"];
 options: IOption[];
 placeholder?: string;
 disabled?: boolean;
 invalid?: boolean;
 ariaLabel?: string;
 onValueChange: (value: IOption["value"]) => void;
};

function OptionSelect({
 value,
 options,
 placeholder = "Select option",
 disabled,
 invalid,
 ariaLabel,
 onValueChange,
}: OptionSelectProps) {
 return (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
   <SelectTrigger aria-label={ariaLabel} aria-invalid={invalid} width="full">
    <SelectValue placeholder={placeholder} />
   </SelectTrigger>
   <SelectContent position="popper" align="start">
    <SelectGroup>
     {options.map((option) => (
      <SelectItem
       key={option.value}
       value={option.value}
       disabled={option.disabled || option.isDisabled}
      >
       <span className="flex min-w-0 items-center gap-2">
        {option.icon && <option.icon />}
        <Typography as="span" variant="bodySmall" clamp="one">
         {option.label}
        </Typography>
       </span>
      </SelectItem>
     ))}
    </SelectGroup>
   </SelectContent>
  </Select>
 );
}

export { OptionSelect };
export type { OptionSelectProps };
