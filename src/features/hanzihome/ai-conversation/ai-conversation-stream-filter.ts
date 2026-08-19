const openingThinkPrefix = "<think";
const closingThinkPrefix = "</think";

function longestPotentialTagPrefix(value: string, prefixes: readonly string[]) {
 const lower = value.toLowerCase();
 const maximum = Math.min(
  lower.length,
  Math.max(...prefixes.map((prefix) => prefix.length - 1)),
 );
 for (let length = maximum; length > 0; length -= 1) {
  const suffix = lower.slice(-length);
  if (prefixes.some((prefix) => prefix.startsWith(suffix))) return length;
 }
 return 0;
}

function findThinkTag(value: string, fromIndex = 0) {
 const lower = value.toLowerCase();
 const opening = lower.indexOf(openingThinkPrefix, fromIndex);
 const closing = lower.indexOf(closingThinkPrefix, fromIndex);
 if (opening < 0) return closing;
 if (closing < 0) return opening;
 return Math.min(opening, closing);
}

export function createAiConversationVisibleStreamFilter() {
 let pending = "";
 let hidden = false;

 function push(chunk: string) {
  pending += chunk.normalize("NFC");
  let visible = "";

  while (pending.length > 0) {
   if (hidden) {
    const closingIndex = pending.toLowerCase().indexOf(closingThinkPrefix);
    if (closingIndex < 0) {
     const keep = longestPotentialTagPrefix(pending, [closingThinkPrefix]);
     pending = keep > 0 ? pending.slice(-keep) : "";
     break;
    }

    pending = pending.slice(closingIndex);
    const close = pending.indexOf(">");
    if (close < 0) break;
    pending = pending.slice(close + 1);
    hidden = false;
    continue;
   }

   const tagIndex = findThinkTag(pending);
   if (tagIndex < 0) {
    const keep = longestPotentialTagPrefix(pending, [openingThinkPrefix, closingThinkPrefix]);
    if (keep > 0) {
     visible += pending.slice(0, -keep);
     pending = pending.slice(-keep);
    } else {
     visible += pending;
     pending = "";
    }
    break;
   }

   visible += pending.slice(0, tagIndex);
   pending = pending.slice(tagIndex);
   const close = pending.indexOf(">");
   if (close < 0) break;
   const tag = pending.slice(0, close + 1).toLowerCase();
   pending = pending.slice(close + 1);
   if (tag.startsWith(openingThinkPrefix)) hidden = true;
  }

  return visible;
 }

 function flush() {
  if (hidden) {
   pending = "";
   return "";
  }
  const remaining = pending;
  pending = "";
  return remaining;
 }

 return { push, flush };
}
