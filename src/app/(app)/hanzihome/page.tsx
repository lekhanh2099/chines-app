import { permanentRedirect } from "next/navigation";

import { HanziHomePage as HanziHomeFeaturePage } from "@/features/hanzihome/HanziHomePage";

export default async function HanziHomePage({ searchParams }: PageProps<"/hanzihome">) {
 const params = await searchParams;
 const moduleParam = Array.isArray(params.module) ? params.module[0] : params.module;

 if (moduleParam === "radicals") {
  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
   if (key === "module" || value === undefined) continue;
   for (const item of Array.isArray(value) ? value : [value]) nextParams.append(key, item);
  }

  permanentRedirect(nextParams.size > 0 ? `/radicals?${nextParams.toString()}` : "/radicals");
 }

 return <HanziHomeFeaturePage />;
}
