import Link from "next/link";

import { Card } from "@/components/ui/card";

export function HanziHomeWorkspaceMessage({
 eyebrow,
 title,
 description,
 showLibraryLink = false,
}: {
 eyebrow: string;
 title: string;
 description: string;
 showLibraryLink?: boolean;
}) {
 return (
  <main className="hanzihome-static-page">
   <div className="flex w-full max-w-full flex-col gap-2.5">
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-2.5">
      <div>
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">{eyebrow}</p>
       <h1 className="text-2xl font-black text-text-primary">{title}</h1>
       <p className=" font-semibold text-text-muted">{description}</p>
      </div>
      {showLibraryLink ? (
       <Link
        href="/"
        prefetch={false}
        className="w-fit rounded-xl bg-bg-inverse px-4 py-2  font-black text-text-inverse"
       >
        Về thư viện học liệu
       </Link>
      ) : null}
     </div>
    </Card>
   </div>
  </main>
 );
}
