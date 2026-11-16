"use client";

import { useEffect } from "react";

import { installPinyinSelection } from "../runtime/pinyin-selection";

/** Makes ruby Pinyin selectable and copyable as plain text across the app. */
export function PinyinSelectionBridge() {
 useEffect(() => installPinyinSelection(), []);
 return null;
}
