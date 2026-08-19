import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import {
 pdfAnnotationRowSchema,
 type PdfAnnotationPayload,
 type PdfAnnotationRow,
} from "./pdf-annotations";
import { getReaderAsset, listReaderAssets } from "./reader-content-repository";

type PdfAnnotationContext = AuthenticatedRouteContext;

function contextClient(context: PdfAnnotationContext) {
 return { client: context.supabase, user: context.user };
}

async function validatePdfPage(assetId: string, pageNumber: number) {
 const asset = await getReaderAsset(assetId);
 if (asset === null || asset.asset_type !== "pdf") {
  throw new Error("PDF asset is not in the static package");
 }
 const resourceFile = asset.source_path.replace(/^public\/resources\//u, "");
 const pagePath = `public/resources/pages/${resourceFile.replace(/\.pdf$/u, "")}-page-${pageNumber}.webp`;
 const pageAsset = (await listReaderAssets("image")).find(
  (candidate) => candidate.source_path === pagePath,
 );
 if (pageAsset === undefined) throw new Error("PDF page is not in the static package");
}

export async function getPdfAnnotation(
 input: {
  assetId: string;
  pageNumber: number;
 },
 context: PdfAnnotationContext,
): Promise<PdfAnnotationRow | null> {
 await validatePdfPage(input.assetId, input.pageNumber);
 const { client, user } = contextClient(context);
 const { data, error } = await client
  .from("hanzihome_pdf_annotations")
  .select("*")
  .eq("user_id", user.id)
  .eq("asset_id", input.assetId)
  .eq("page_number", input.pageNumber)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : pdfAnnotationRowSchema.parse(data);
}

export async function savePdfAnnotation(
 input: {
  assetId: string;
  pageNumber: number;
  payload: PdfAnnotationPayload;
  expectedRevision: number;
 },
 context: PdfAnnotationContext,
): Promise<PdfAnnotationRow> {
 await validatePdfPage(input.assetId, input.pageNumber);
 const { client } = contextClient(context);
 const { data, error } = await client.rpc("hanzihome_upsert_pdf_annotation", {
  p_asset_id: input.assetId,
  p_page_number: input.pageNumber,
  p_payload: input.payload,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return pdfAnnotationRowSchema.parse(data);
}
