"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden border font-black select-none", {
 variants: {
  size: {
   xs: "size-6 text-[0.625rem]",
   sm: "size-8 text-xs",
   md: "size-10 text-sm",
   lg: "size-12 text-base",
   xl: "size-16 text-lg",
  },
  shape: {
   circle: "rounded-full",
   rounded: "rounded-xl",
   square: "rounded-md",
  },
  tone: {
   default: "border-border-default bg-bg-subtle text-text-secondary",
   accent: "border-accent/30 bg-accent-subtle text-accent-text",
   neutral: "border-border-default bg-bg-card text-text-primary",
  },
 },
 defaultVariants: {
  size: "md",
  shape: "circle",
  tone: "default",
 },
});

function Avatar({
 className,
 size,
 shape,
 tone,
 ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>) {
 return (
  <AvatarPrimitive.Root
   data-slot="avatar"
   className={cn(avatarVariants({ size, shape, tone }), className)}
   {...props}
  />
 );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
 return (
  <AvatarPrimitive.Image
   data-slot="avatar-image"
   className={cn("size-full object-cover", className)}
   {...props}
  />
 );
}

function AvatarFallback({
 className,
 ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
 return (
  <AvatarPrimitive.Fallback
   data-slot="avatar-fallback"
   className={cn("flex size-full items-center justify-center", className)}
   {...props}
  />
 );
}

export { Avatar, AvatarFallback, AvatarImage, avatarVariants };
