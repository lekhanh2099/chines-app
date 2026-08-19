import { z } from "zod";

import { Typography, type TypographyProps } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const LearnerTextElementSchema = z.enum(["span", "p", "h2", "h3", "strong"]);
const LearnerHanziSizeSchema = z.enum(["inherit", "title", "display"]);

type LearnerTextElement = z.infer<typeof LearnerTextElementSchema>;
type LearnerHanziTextProps = Omit<Omit<TypographyProps<LearnerTextElement>, "as">, "lang"> & {
 as?: LearnerTextElement;
 size?: z.infer<typeof LearnerHanziSizeSchema>;
};

const learnerHanziSizes: Record<z.infer<typeof LearnerHanziSizeSchema>, string> = {
 inherit: "",
 title: "text-2xl",
 display: "text-3xl",
};

function LearnerHanziText({
 as = LearnerTextElementSchema.enum.span,
 size = LearnerHanziSizeSchema.enum.inherit,
 className,
 ...props
}: LearnerHanziTextProps) {
 return (
  <Typography
   as={as}
   lang="zh-CN"
   className={cn("font-hanzi", learnerHanziSizes[size], className)}
   {...props}
  />
 );
}

export { LearnerHanziText };
export type { LearnerHanziTextProps };
