import { expect, it } from "vitest";
import { getActiveCharacterIndex } from "./progressive-study-text-utils";

it("maps audio progress within the active substring and handles inactive or unbounded playback", () => {
 expect(getActiveCharacterIndex(6, 0, 6, 0)).toBe(0);
 expect(getActiveCharacterIndex(6, 0, 6, 0.5)).toBe(3);
 expect(getActiveCharacterIndex(6, 2, 4, 0)).toBe(2);
 expect(getActiveCharacterIndex(6, 2, 4, 0.75)).toBe(5);
 expect(getActiveCharacterIndex(6, 2, 4, 2)).toBe(5);
 expect(getActiveCharacterIndex(6, 2, 4, Number.NaN)).toBe(2);
 expect(getActiveCharacterIndex(0, 0, 0, 0.5)).toBe(-1);
 expect(getActiveCharacterIndex(6, -1, 6, 0.5)).toBe(-1);
});
