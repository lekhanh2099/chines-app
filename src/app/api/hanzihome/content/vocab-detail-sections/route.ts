import { mutateCanonicalContent } from "@/features/hanzihome/server/canonical-content-mutation";

export const dynamic = "force-dynamic";
export const POST = (request: Request) =>
 mutateCanonicalContent({
  request,
  entityType: "vocab_detail_section",
  operation: "create",
  transformChanges: (changes) => ({
   ...changes,
   section_key:
    changes.section_key === "custom" ? `custom:${crypto.randomUUID()}` : changes.section_key,
  }),
 });
