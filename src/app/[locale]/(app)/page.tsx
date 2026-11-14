import { HomeDashboard } from "@/features/home/HomeDashboard";

import { getTextbookCatalog } from "@/features/hanzihome/static-json/business-chinese-static-content";

export default function HomePage() {
 return <HomeDashboard textbooks={getTextbookCatalog().filter((book) => book.key !== "tm2")} />;
}
