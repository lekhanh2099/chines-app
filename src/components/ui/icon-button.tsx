import type * as React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const IconButtonVariantSchema = z.enum(["default", "ghost", "accent"]);
const IconButtonSizeSchema = z.enum(["sm", "md", "lg"]);

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "variant" | "size"> & {
 variant?: z.infer<typeof IconButtonVariantSchema>;
 size?: z.infer<typeof IconButtonSizeSchema>;
};

const variantMap: Record<
 z.infer<typeof IconButtonVariantSchema>,
 React.ComponentProps<typeof Button>["variant"]
> = {
 default: "outline",
 ghost: "ghost",
 accent: "default",
};

const sizeMap: Record<
 z.infer<typeof IconButtonSizeSchema>,
 React.ComponentProps<typeof Button>["size"]
> = {
 sm: "icon-toolbar",
 md: "icon-toolbar",
 lg: "icon",
};

function IconButton({
 variant = IconButtonVariantSchema.enum.default,
 size = IconButtonSizeSchema.enum.md,
 ...props
}: IconButtonProps) {
 return <Button type="button" variant={variantMap[variant]} size={sizeMap[size]} {...props} />;
}

export { IconButton };
export type { IconButtonProps };
