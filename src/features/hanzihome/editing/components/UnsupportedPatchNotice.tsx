import { buildHanziHomeDbEditDraftsFromPatches } from "@/features/hanzihome/editor/editDraftBuilder";

export function UnsupportedPatchNotice({
 unsupported,
}: {
 unsupported: ReturnType<typeof buildHanziHomeDbEditDraftsFromPatches>["unsupported"];
}) {
 if (unsupported.length === 0) return null;

 return (
  <div className="grid gap-1 rounded-xl border border-warning/35 bg-warning-subtle p-3 text-xs font-semibold text-warning-text">
   <p className="font-black">{unsupported.length} draft chưa lưu DB tự động được.</p>
   {unsupported.slice(0, 5).map((item) => (
    <p key={item.patchId}>
     {item.entityType}: {item.reason}
    </p>
   ))}
  </div>
 );
}
