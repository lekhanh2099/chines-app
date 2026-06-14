export type SectionView = "all" | "meaning" | "etymology" | "comparisons" | "examples" | "notes";

export const sectionShortcutTabs: Array<{
 key: SectionView;
 label: string;
 shortcut: string;
}> = [
 { key: "all", label: "Tất cả", shortcut: "1" },
 { key: "meaning", label: "Nghĩa", shortcut: "2" },
 { key: "etymology", label: "Logic", shortcut: "3" },
 { key: "comparisons", label: "So sánh", shortcut: "4" },
 { key: "examples", label: "Ví dụ", shortcut: "5" },
];
