import { notFound, permanentRedirect } from "next/navigation";

import { HanziHomePage as HanziHomeFeaturePage } from "@/features/hanzihome/HanziHomePage";
import {
 getCourseTextbookCatalog,
 getTextbookCatalog,
} from "@/features/hanzihome/static-json/textbook-catalog";
import { legacyCourseLessonHref } from "@/features/hanzihome/static-json/course-legacy-routes";
import { isAppLocale, localizePathname } from "@/i18n/config";

export default async function HanziHomePage({
 params,
 searchParams,
}: PageProps<"/[locale]/hanzihome">) {
 const { locale } = await params;
 if (!isAppLocale(locale)) notFound();

 const query = await searchParams;
 const moduleParam = Array.isArray(query.module) ? query.module[0] : query.module;

 if (moduleParam === "radicals") {
  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
   if (key === "module" || value === undefined) continue;
   for (const item of Array.isArray(value) ? value : [value]) nextParams.append(key, item);
  }

  const target = nextParams.size > 0 ? `/radicals?${nextParams.toString()}` : "/radicals";
  permanentRedirect(localizePathname(target, locale));
 }

 const first = (value: (typeof query)[string]) => (Array.isArray(value) ? value[0] : value);
 const convertedCourseHref = legacyCourseLessonHref({
  courseId: first(query.courseId),
  bookId: first(query.bookId),
  lesson: first(query.lesson),
  lessonId: first(query.lessonId),
  module: moduleParam,
 });
 if (convertedCourseHref) permanentRedirect(localizePathname(convertedCourseHref, locale));

 return (
  <HanziHomeFeaturePage
   textbooks={[
    ...getCourseTextbookCatalog(),
    ...getTextbookCatalog().filter((book) => book.key !== "tm2"),
   ]}
  />
 );
}
