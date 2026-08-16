"use client";

import { Bell, RotateCcw, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Typography } from "@/components/ui/typography";

export function AppNotificationMenu() {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="outline"
     size="icon-toolbar"
     aria-label="Mở thông báo"
     title="Thông báo"
    >
     <Bell />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="lg">
    <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
    <div className="grid gap-1 px-3 py-3" role="status">
     <Typography variant="bodySmall" weight="black">
      Chưa có thông báo mới
     </Typography>
     <Typography variant="caption" tone="muted">
      Việc học cần xử lý và thay đổi quan trọng sẽ xuất hiện ở đây.
     </Typography>
    </div>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
     <Link href="/personal-learning/today">
      <RotateCcw />
      Mở việc cần xử lý
     </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
     <Link href="/personal-learning/progress">
      <TrendingUp />
      Xem tiến bộ học tập
     </Link>
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
