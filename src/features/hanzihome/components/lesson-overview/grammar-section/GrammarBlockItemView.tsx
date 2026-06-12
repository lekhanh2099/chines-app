import { asRecord, stringValue } from "../utils";

export function GrammarBlockItemView({ item }: { item: Record<string, unknown> }) {
 const left = asRecord(item.left);
 const right = asRecord(item.right);
 const aspect = stringValue(item, "aspect");
 const wrong = stringValue(item, "wrong");
 const correct = stringValue(item, "correct");
 const explanation = stringValue(item, "explanation_vi");

 if (stringValue(left, "label") || stringValue(right, "label")) {
  return (
   <div className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3">
    {aspect && (
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">{aspect}</p>
    )}
    <div className="grid gap-2 sm:grid-cols-2">
     {[left, right].map((side, index) => (
      <div key={`${stringValue(side, "label")}-${index}`} className="rounded-lg bg-bg-primary p-3">
       <p className="font-black text-text-primary">{stringValue(side, "label")}</p>
       <p className=" font-semibold leading-relaxed text-text-secondary">
        {stringValue(side, "value")}
       </p>
      </div>
     ))}
    </div>
   </div>
  );
 }

 if (wrong || correct) {
  return (
   <div className="grid gap-2 rounded-lg border border-danger/20 bg-danger-subtle/40 p-3">
    {wrong && (
     <p className=" font-semibold text-danger-text">
      Sai: <span className="font-black">{wrong}</span>
     </p>
    )}
    {correct && (
     <p className=" font-semibold text-success-text">
      Đúng: <span className="font-black">{correct}</span>
     </p>
    )}
    {explanation && (
     <p className=" font-semibold leading-relaxed text-text-secondary">{explanation}</p>
    )}
   </div>
  );
 }

 return null;
}
