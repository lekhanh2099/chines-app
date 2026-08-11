import type * as React from "react";

import { Button } from "@/components/ui/button";

type IconButtonVariant = "default" | "ghost" | "accent";
type IconButtonSize = "sm" | "md" | "lg";
type IconButtonOverrideProp = "variant" | "size";

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, IconButtonOverrideProp> & {
 variant?: IconButtonVariant;
 size?: IconButtonSize;
};

const variantMap: Record<IconButtonVariant, React.ComponentProps<typeof Button>["variant"]> = {
 default: "outline",
 ghost: "ghost",
 accent: "default",
};

const sizeMap: Record<IconButtonSize, React.ComponentProps<typeof Button>["size"]> = {
 sm: "icon-toolbar",
 md: "icon-toolbar",
 lg: "icon",
};

function IconButton({ variant = "default", size = "md", ...props }: IconButtonProps) {
 return <Button type="button" variant={variantMap[variant]} size={sizeMap[size]} {...props} />;
}

export { IconButton };
export type { IconButtonProps };
