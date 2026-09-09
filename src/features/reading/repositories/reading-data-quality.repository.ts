import "server-only";

import { getStaticReaderDataQualityReport } from "@/features/reading/repositories/reading-content.repository";

export type ReaderDataQualityReport = Awaited<ReturnType<typeof getStaticReaderDataQualityReport>>;

export async function getReaderDataQualityReport(): Promise<ReaderDataQualityReport> {
 return getStaticReaderDataQualityReport();
}
