import { BookOpenText, GitCompareArrows, Layers3 } from "lucide-react";

import { Card } from "@/components/ui/card";

export function NotebookHero({
 itemCount,
 groupCount,
 comparisonCount,
}: {
 itemCount: number;
 groupCount: number;
 comparisonCount: number;
}) {
 const metrics = [
  { label: "Mục học", value: itemCount, icon: BookOpenText },
  { label: "Nhóm", value: groupCount, icon: Layers3 },
  { label: "So sánh", value: comparisonCount, icon: GitCompareArrows },
 ];

 return (
  <section className="app-gradient-hero overflow-hidden rounded-3xl border p-5 text-white shadow-theme-lg sm:p-7 lg:grid lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,2fr)] lg:gap-7">
   <div className="grid gap-4">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/80">
     汉语教程 · 功能词与论证结构
    </p>
    <h1 className="max-w-md text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl">
     Sổ tay từ chức năng & cấu trúc lập luận
    </h1>
    <p className="max-w-lg text-sm font-semibold leading-6 text-white/90">
     Nhận diện dấu hiệu, vị trí trong câu, sắc thái và ví dụ đối chiếu thay vì học theo một bản dịch
     cố định.
    </p>
   </div>

   <div className="mt-6 self-center lg:mt-0 grid gap-3">
    <div className="grid grid-cols-3 gap-2">
     {metrics.map((metric) => {
      const Icon = metric.icon;
      return (
       <Card
        key={metric.label}
        variant="elevated"
        padding="sm"
        className="grid gap-1 px-3 py-4 text-center text-text-primary"
       >
        <Icon className="mx-auto size-4 text-primary" />
        <strong className="block text-2xl font-black">{metric.value}</strong>
        <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-text-muted">
         {metric.label}
        </span>
       </Card>
      );
     })}
    </div>
    <p className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 text-sm font-semibold leading-6 text-white/90">
     Cách học: nhận diện dấu hiệu → mở thẻ học hoặc so sánh → kiểm bằng ví dụ đối chiếu.
    </p>
   </div>
  </section>
 );
}
