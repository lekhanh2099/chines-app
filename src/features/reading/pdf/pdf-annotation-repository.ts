import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import {
 pdfAnnotationRowSchema,
 type PdfAnnotationRow,
} from "@/features/reading/pdf/pdf-annotations";
import { NOTE_PDF_ASSET_ID_PATTERN } from "./note-pdf-asset-id";
import {
 annotationSaveResultSchema,
 PdfAnnotationTargetMissingError,
 type PdfAnnotationPayloadInput,
} from "./pdf-annotation-api";
import {
 getReaderAsset,
 listReaderAssets,
} from "@/features/reading/repositories/reading-content.repository";

type PdfAnnotationContext = AuthenticatedRouteContext;

function contextClient(context: PdfAnnotationContext) {
 return { client: context.supabase, user: context.user };
}

async function validatePdfPage(assetId: string, pageNumber: number, context: PdfAnnotationContext) {
 const notePdfAttachmentId = NOTE_PDF_ASSET_ID_PATTERN.exec(assetId)?.[1];
 if (notePdfAttachmentId) {
  const { data, error } = await context.supabase
   .from("note_pdf_attachments")
   .select("page_count")
   .eq("id", notePdfAttachmentId)
   .eq("user_id", context.user.id)
   .maybeSingle();
  if (error) throw new Error(error.message);
  if (data === null || pageNumber > data.page_count) {
   throw new PdfAnnotationTargetMissingError("PDF page is not in this note");
  }
  return;
 }
 const asset = await getReaderAsset(assetId);
 if (asset === null || asset.asset_type !== "pdf") {
  throw new PdfAnnotationTargetMissingError("PDF asset is not in the static package");
 }
 const resourceFile = asset.source_path.replace(/^public\/resources\//u, "");
 const pagePath = `public/resources/pages/${resourceFile.replace(/\.pdf$/u, "")}-page-${pageNumber}.webp`;
 const pageAsset = (await listReaderAssets("image")).find(
  (candidate) => candidate.source_path === pagePath,
 );
 if (pageAsset === undefined)
  throw new PdfAnnotationTargetMissingError("PDF page is not in the static package");
}

export async function getPdfAnnotation(
 input: {
  assetId: string;
  pageNumber: number;
 },
 context: PdfAnnotationContext,
): Promise<PdfAnnotationRow | null> {
 await validatePdfPage(input.assetId, input.pageNumber, context);
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
 input: PdfAnnotationPayloadInput,
 context: PdfAnnotationContext,
) {
 await validatePdfPage(input.assetId, input.pageNumber, context);
 const { client } = contextClient(context);
 const { data, error } = await client.rpc("hanzihome_upsert_pdf_annotation_cas", {
  p_asset_id: input.assetId,
  p_page_number: input.pageNumber,
  p_payload: input.payload,
  p_expected_revision: input.expectedRevision,
  p_expected_absent: input.expectedAbsent,
 });
 if (error) throw new Error(error.message);
 return annotationSaveResultSchema.parse(data);
}
