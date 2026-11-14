const openingThinkPrefix = "<think";
const closingThinkPrefix = "</think";

function longestPotentialTagPrefix(value: string, prefixes: readonly string[]) {
 const lower = value.toLowerCase();
 const maximum = Math.min(lower.length, Math.max(...prefixes.map((prefix) => prefix.length - 1)));
 for (let length = maximum; length > 0; length -= 1) {
  const suffix = lower.slice(-length);
  if (prefixes.some((prefix) => prefix.startsWith(suffix))) return length;
 }
 return 0;
}

function isThinkTagBoundary(value: string | undefined) {
 return value === undefined || value === ">" || /\s/u.test(value);
}

function findValidPrefix(value: string, prefix: string, fromIndex: number) {
 const lower = value.toLowerCase();
 let index = lower.indexOf(prefix, fromIndex);
 while (index >= 0) {
  if (isThinkTagBoundary(lower[index + prefix.length])) return index;
  index = lower.indexOf(prefix, index + 1);
 }
 return -1;
}

function findThinkTag(value: string) {
 const opening = findValidPrefix(value, openingThinkPrefix, 0);
 const closing = findValidPrefix(value, closingThinkPrefix, 0);
 if (opening < 0 && closing < 0) return null;
 if (opening < 0) return { index: closing, opening: false };
 if (closing < 0) return { index: opening, opening: true };
 return opening <= closing ? { index: opening, opening: true } : { index: closing, opening: false };
}

export function createAiConversationVisibleStreamFilter() {
 let pending = "";
 let hidden = false;

 function push(chunk: string) {
  pending += chunk.normalize("NFC");
  let visible = "";

  while (pending.length > 0) {
   if (hidden) {
    const closingIndex = findValidPrefix(pending, closingThinkPrefix, 0);
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

   const tag = findThinkTag(pending);
   if (tag === null) {
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

   visible += pending.slice(0, tag.index);
   pending = pending.slice(tag.index);
   const close = pending.indexOf(">");
   if (close < 0) break;
   pending = pending.slice(close + 1);
   if (tag.opening) hidden = true;
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
