import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { BookOpenCheck, NotebookPen, NotebookTabs } from "lucide-react";

import {
 HomeArrowIcon,
 HomeIconTile,
 HomeSectionHeader,
} from "@/features/home/components/HomePrimitives";
import { notebookSummary } from "@/features/notebook/notebook-summary";

const resources = [
 {
  href: notebookSummary.href,
  icon: NotebookTabs,
  title: "Sổ tay chức năng",
  description: "Tra từ chức năng và cấu trúc lập luận theo nhóm, cặp so sánh.",
  meta: `${notebookSummary.itemCount} mục · ${notebookSummary.groupCount} nhóm · ${notebookSummary.comparisonCount} so sánh`,
 },
 {
  href: "/notes",
  icon: NotebookPen,
  title: "Ghi chú",
  description: "Mở note theo bài, ghi chú nhanh hoặc tài liệu đang soạn.",
  meta: "Theo bài và ghi chú tự do",
 },
 {
  href: "/hanzihome",
  icon: BookOpenCheck,
  title: "Thư viện HanziHome",
  description: "Chọn giáo trình, quyển và bài học mới.",
  meta: "Course · Book · Lesson",
 },
];

export function HomeResourceLinks() {
 return (
  <section aria-labelledby="home-resources-title">
   <HomeSectionHeader
    id="home-resources-title"
    title="Không gian học"
    description="Mỗi nơi có một nhiệm vụ rõ ràng."
    className="mb-3"
   />

   <div className="grid gap-3 lg:grid-cols-3">
    {resources.map((resource) => {
     const Icon = resource.icon;
     return (
      <Link
       key={resource.href}
       href={resource.href}
       prefetch={false}
       className="group flex min-h-40 flex-col rounded-xl border border-border-default bg-bg-card p-5 transition-colors hover:border-primary/25 hover:bg-bg-subtle"
      >
       <div className="flex items-start justify-between gap-3">
        <HomeIconTile className="size-10">
         <Icon className="size-5" />
        </HomeIconTile>
        <HomeArrowIcon className="transition group-hover:text-accent-text" />
       </div>
       <Typography as="h3" variant="cardTitle" tone="default" weight="black" className="mt-4">
        {resource.title}
       </Typography>
       <Typography
        as="p"
        variant="bodySmall"
        tone="muted"
        weight="medium"
        leading="compact"
        className="mt-1"
       >
        {resource.description}
       </Typography>
       <Typography
        as="p"
        variant="overline"
        tone="accent"
        weight="black"
        transform="uppercase"
        tracking="subtle"
        className="mt-auto pt-4"
       >
        {resource.meta}
       </Typography>
      </Link>
     );
    })}
   </div>
  </section>
 );
}
