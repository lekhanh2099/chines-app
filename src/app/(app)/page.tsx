import Link from "next/link";
import { BookOpen, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHanziHomeData } from "@/features/hanzihome/static-data";

export default function HomePage() {
 const data = getHanziHomeData();
 const totalVocab = data.lessons.reduce((sum, lesson) => sum + lesson.vocab.length, 0);
 const totalGrammar = data.lessons.reduce((sum, lesson) => sum + lesson.grammar.length, 0);

 return (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 lg:px-8">
   <section className="grid gap-3">
    <p className="text-sm font-black uppercase tracking-wide text-text-muted">
     HanziHome Hán ngữ 2
    </p>
    <h1 className="text-4xl font-black tracking-normal text-text-primary md:text-5xl">
     Tự học theo từng bài
    </h1>
    <p className="max-w-3xl text-base font-semibold leading-relaxed text-text-secondary">
     Chọn bài trước, rồi học từ vựng, ngữ pháp, bộ thủ và ôn tập từ cùng một nguồn JSON tĩnh.
    </p>
   </section>

   <Card padding="lg" className="rounded-2xl">
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
     <div className="grid gap-4 sm:grid-cols-3">
      <HomeMetric label="Bài học" value={data.lessons.length} />
      <HomeMetric label="Từ vựng" value={totalVocab} />
      <HomeMetric label="Ngữ pháp" value={totalGrammar} />
     </div>
     <Button asChild size="lg">
      <Link href="/hanzihome">
       <Sparkles className="h-5 w-5" />
       Vào HanziHome
      </Link>
     </Button>
    </div>
   </Card>

   <section className="grid gap-4 md:grid-cols-2">
    <HomeAction
     href="/hanzihome"
     icon={BookOpen}
     title="Workspace tự học"
     description="Mở lesson-first workspace cho từ vựng, ngữ pháp, bộ thủ và ôn tập."
    />
    <HomeAction
     href="/notes"
     icon={NotebookPen}
     title="Ghi chú"
     description="Giữ lại luồng ghi chú hiện có nếu cần lưu ý riêng khi học."
    />
   </section>
  </main>
 );
}

function HomeMetric({ label, value }: { label: string; value: number }) {
 return (
  <div className="rounded-2xl border-2 border-border-default bg-bg-subtle p-4">
   <p className="text-3xl font-black text-text-primary">{value}</p>
   <p className="text-sm font-bold text-text-muted">{label}</p>
  </div>
 );
}

function HomeAction({
 href,
 icon: Icon,
 title,
 description,
}: {
 href: string;
 icon: typeof BookOpen;
 title: string;
 description: string;
}) {
 return (
  <Link href={href}>
   <Card
    padding="lg"
    className="h-full rounded-2xl transition-colors hover:border-accent-muted hover:bg-accent-subtle"
   >
    <div className="flex gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-theme-sm">
      <Icon className="h-5 w-5" />
     </span>
     <span className="grid gap-1">
      <span className="text-xl font-black text-text-primary">{title}</span>
      <span className="text-sm font-semibold leading-relaxed text-text-secondary">
       {description}
      </span>
     </span>
    </div>
   </Card>
  </Link>
 );
}
