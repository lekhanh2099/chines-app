import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, NotebookTabs } from "lucide-react";

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
  icon: FileText,
  title: "Ghi chú",
  description: "Mở note theo bài, ghi chú nhanh hoặc tài liệu đang soạn.",
  meta: "Theo bài và ghi chú tự do",
 },
 {
  href: "/hanzihome",
  icon: BookOpen,
  title: "Thư viện HanziHome",
  description: "Chọn giáo trình, quyển và bài học mới.",
  meta: "Course · Book · Lesson",
 },
] as const;

export function HomeResourceLinks() {
 return (
  <section aria-labelledby="home-resources-title">
   <div className="mb-3 flex items-end justify-between gap-3">
    <div>
     <h2 id="home-resources-title" className="text-lg font-black text-text-primary">
      Không gian học
     </h2>
     <p className="mt-0.5 text-sm font-medium text-text-muted">Mỗi nơi có một nhiệm vụ rõ ràng.</p>
    </div>
   </div>

   <div className="grid gap-3 lg:grid-cols-3">
    {resources.map((resource) => {
     const Icon = resource.icon;
     return (
      <Link
       key={resource.href}
       href={resource.href}
       prefetch={false}
       className="nova-glass-panel group flex min-h-40 flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/25"
      >
       <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-accent-subtle text-accent-text">
         <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-text-muted transition group-hover:text-accent-text" />
       </div>
       <h3 className="mt-4 text-base font-black text-text-primary">{resource.title}</h3>
       <p className="mt-1 text-sm font-medium leading-5 text-text-muted">{resource.description}</p>
       <p className="mt-auto pt-4 text-xs font-black uppercase tracking-[0.1em] text-accent-text">
        {resource.meta}
       </p>
      </Link>
     );
    })}
   </div>
  </section>
 );
}
