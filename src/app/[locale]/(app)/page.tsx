import { HomeDashboard } from "@/features/home/HomeDashboard";

import {
 getCourseTextbookCatalog,
 getTextbookCatalog,
} from "@/features/hanzihome/static-json/textbook-catalog";

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
