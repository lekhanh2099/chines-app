"use client";

import { useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Separator } from "@/components/ui/layout/separator";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

/** Prevent native mousedown from stealing editor focus */
export const pf = (e: React.MouseEvent) => e.preventDefault();

export function ToolbarButton({
 active,
 disabled,
 onClick,
 title,
 children,
}: {
 active?: boolean;
 disabled?: boolean;
 onClick: () => void;
 title: string;
 children: React.ReactNode;
}) {
 return (
  <Button
   type="button"
   variant={active ? "active" : "ghost"}
   size="icon-toolbar"
   disabled={disabled}
   onMouseDown={pf}
   onClick={onClick}
   title={title}
   aria-label={title}
   aria-pressed={active === undefined ? undefined : active}
  >
   {children}
  </Button>
 );
}

export function Divider() {
 return <Separator orientation="vertical" />;
}

/* ── Dropdown ── */

export function Dropdown({
 buttonLabel,
 buttonIcon,
 buttonTitle,
 disabled,
 children,
}: {
 buttonLabel: string;
 buttonIcon?: React.ReactNode;
 buttonTitle?: string;
 disabled?: boolean;
 children: React.ReactNode;
}) {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={disabled}
     onMouseDown={pf}
     variant="ghost"
     size="toolbar"
     title={buttonTitle || buttonLabel}
    >
     {buttonIcon}
     <span className="max-w-24 truncate">{buttonLabel}</span>
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">{children}</DropdownMenuContent>
  </DropdownMenu>
 );
}

export function DropdownItem({
 active,
 onClick,
 children,
 style,
}: {
 active?: boolean;
 onClick: () => void;
 children: React.ReactNode;
 style?: React.CSSProperties;
}) {
 return (
  <DropdownMenuItem tone={active ? "accent" : "default"} onSelect={onClick} style={style}>
   {children}
  </DropdownMenuItem>
 );
}

/* ── Font Size Control (Playground-style +/- input) ── */

export function FontSizeControl({
 fontSize,
 disabled,
 applyFontSize,
}: {
 fontSize: string;
 disabled?: boolean;
 applyFontSize: (size: string) => void;
}) {
 const [inputVal, setInputVal] = useState(() => fontSize.replace("px", ""));

 const applySize = (val: string) => {
  let num = parseInt(val, 10);
  if (isNaN(num)) num = 16;
  num = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, num));
  setInputVal(String(num));
  applyFontSize(`${num}px`);
 };

 return (
  <div className="toolbar-font-size">
   <Button
    type="button"
    disabled={disabled || parseInt(inputVal) <= MIN_FONT_SIZE}
    onMouseDown={pf}
    onClick={() => applySize(String(parseInt(inputVal) - 1))}
    variant="ghost"
    size="icon-toolbar"
    aria-label="Giảm cỡ chữ"
    title="Giảm cỡ chữ"
   >
    <Minus />
   </Button>
   {inputVal}
   {/* <Input
    type="text"
    value={inputVal}
    disabled={disabled}
    density="compact"
    className="toolbar-font-size-input w-14! h-auto! text-center! text-sm! font-medium!"
    onMouseDown={pf}
    onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
    onBlur={() => applySize(inputVal)}
    onKeyDown={(e) => {
     if (e.key === "Enter") {
      e.preventDefault();
      applySize(inputVal);
      if (e.target instanceof HTMLInputElement) e.target.blur();
     }
    }}
   /> */}
   <Button
    type="button"
    disabled={disabled || parseInt(inputVal) >= MAX_FONT_SIZE}
    onMouseDown={pf}
    onClick={() => applySize(String(parseInt(inputVal) + 1))}
    variant="ghost"
    size="icon-toolbar"
    aria-label="Tăng cỡ chữ"
    title="Tăng cỡ chữ"
   >
    <Plus />
   </Button>
  </div>
 );
}

/* ── Color Picker ── */

export function ColorPicker({
 colors,
 activeColor,
 onSelect,
 icon,
 label,
 disabled,
}: {
 colors: { label: string; value: string }[];
 activeColor: string;
 onSelect: (color: string) => void;
 icon: React.ReactNode;
 label: string;
 disabled?: boolean;
}) {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={disabled}
     onMouseDown={pf}
     variant="ghost"
     size="icon-toolbar"
     title={label}
     aria-label={label}
    >
     <span className="grid gap-0.5">
      {icon}
      <span
       aria-hidden="true"
       className="h-1 w-4 rounded-full border border-border-default"
       style={{
        backgroundColor:
         activeColor || (label === "Text Color" ? "var(--text-primary)" : "transparent"),
       }}
      />
     </span>
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">
    <DropdownMenuRadioGroup value={activeColor} onValueChange={onSelect}>
     {colors.map((color) => (
      <DropdownMenuRadioItem key={color.value || "default"} value={color.value}>
       <span
        aria-hidden="true"
        className="size-4 rounded-full border border-border-default"
        style={{
         backgroundColor:
          color.value || (label === "Text Color" ? "var(--text-primary)" : "transparent"),
        }}
       />
       {color.label}
      </DropdownMenuRadioItem>
     ))}
    </DropdownMenuRadioGroup>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
