/**
 * Utility functions for Chinese text detection and processing
 */

// Regex to detect Chinese characters (CJK Unified Ideographs)
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
const CHINESE_ONLY_TEXT_REGEX =
 /^[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff0-9\s，。！？；：、,.!?;:()（）《》〈〉「」『』“”‘’\-—…·]+$/;

/**
 * Check if a string contains any Chinese characters
 */
export function containsChinese(text: string): boolean {
 return CJK_REGEX.test(text);
}

/**
 * Check if text is Chinese-only while allowing whitespace and common punctuation.
 */
export function isChineseOnlyText(text: string): boolean {
 const trimmed = text.trim();
 if (!trimmed) return false;

 return containsChinese(trimmed) && CHINESE_ONLY_TEXT_REGEX.test(trimmed);
}

/**
 * Extract only the Chinese characters/words from a string
 */
export function extractChinese(text: string): string {
 return text.replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, "");
}

/**
 * Check if the string is primarily Chinese (more than 50% Chinese chars)
 */
export function isPrimarilyChinese(text: string): boolean {
 if (!text.trim()) return false;
 const chineseChars = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
 if (!chineseChars) return false;
 // Count non-space characters
 const nonSpaceChars = text.replace(/\s/g, "").length;
 return chineseChars.length / nonSpaceChars > 0.3;
}
