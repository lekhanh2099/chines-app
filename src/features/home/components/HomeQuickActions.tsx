import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { BookOpenText, Layers3, Lightbulb, Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 HomeArrowIcon,
 HomeIconTile,
 HomeSectionHeader,
} from "@/features/home/components/HomePrimitives";

const actions = [
 { href: "/dictionary", label: "Ôn SRS", icon: Repeat2 },
 { href: "/grammar", label: "Ngữ pháp", icon: BookOpenText },
 { href: "/memory-tips", label: "Nhắc nhanh", icon: Lightbulb },
 { href: "/radicals", label: "Bộ thủ", icon: Layers3 },
];

export function HomeQuickActions() {
 return (
  <section aria-labelledby="quick-actions-title">
   <Card variant="section" padding="lg">
    <HomeSectionHeader
     id="quick-actions-title"
     title="Truy cập nhanh"
     description="Mở công cụ học thường dùng mà không rời luồng hiện tại."
    />
    <div className="mt-4 grid gap-1">
     {actions.map((action) => {
      const Icon = action.icon;
      return (
       <Button
        key={action.href}
        variant="navigation"
        size="list"
        align="start"
        asChild
        className="w-full"
       >
        <Link href={action.href} prefetch={false}>
         <HomeIconTile className="size-9">
          <Icon className="size-4" />
         </HomeIconTile>
         <Typography as="span" variant="label" tone="default" weight="bold">
          {action.label}
         </Typography>
         <HomeArrowIcon className="ml-auto" />
        </Link>
       </Button>
      );
     })}
    </div>
   </Card>
  </section>
 );
}
