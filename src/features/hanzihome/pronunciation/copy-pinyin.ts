import {
 analyzeContextualPronunciation,
 formatContextualReadingPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";

type CopyablePinyinInput = Parameters<typeof analyzeContextualPronunciation>[0];

/**
 * Plain-text Pinyin for copying: Hanzi become their contextual readings while
 * numbering, choice labels, punctuation and line breaks stay in place.
 */
export function buildCopyablePinyin(input: CopyablePinyinInput) {
 return formatContextualReadingPinyin(analyzeContextualPronunciation(input)).trim();
}
