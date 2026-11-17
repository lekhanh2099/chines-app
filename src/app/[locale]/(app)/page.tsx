import { HomeDashboard } from "@/features/home/HomeDashboard";

import {
 getCourseTextbookCatalog,
 getTextbookCatalog,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

export default function HomePage() {
 return (
  <HomeDashboard
   textbooks={[
    ...getCourseTextbookCatalog(),
    ...getTextbookCatalog().filter((book) => book.key !== "tm2"),
   ]}
  />
 );
}
