"use client";

import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
 AlertTriangle,
 ChevronDown,
 FileText,
 GitBranch,
 Save,
 Settings2,
 WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
 applyParseProfile,
 learningFieldValueToPreview,
 sectionBlocksToPreview,
} from "@/features/hanzihome/importer/apply-parse-profile";
import {
 applyParsedResultToDraft,
 getApplyPreviewText,
 type ApplyImportMode,
 type ApplyImportTarget,
} from "@/features/hanzihome/importer/applyParsedResultToDraft";
import {
 getAvailableImportProfiles,
 loadCustomImportProfiles,
 saveCustomImportProfiles,
} from "@/features/hanzihome/importer/import-profile-storage";
import {
 learningFieldNameSchema,
 type AppliedParseResult,
 type FieldRule,
 type LearningFieldName,
 type LearningFieldValue,
 type LearningSection,
 type MappedImportItem,
 type MappedSpecialSection,
 type ParseProfile,
 type SectionRoleRule,
 type UnknownSectionBehavior,
} from "@/features/hanzihome/importer/importer.types";
import { markdownToLearningDoc } from "@/features/hanzihome/importer/markdown-to-learning-doc";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { useUpdateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";
import { cn } from "@/lib/utils";

const sampleMarkdown = `# BÀI 24

## PHẦN I: CÂU PHỨC KHÔNG DÙNG TỪ NỐI

### 1. Câu mở khóa
他一边说，一边写。

### 2. Bản chất cốt lõi & Công thức
- Một chủ thể làm hai hành động song song.
- Công thức: Chủ ngữ + 一边 + V1 + 一边 + V2

### 3. Điểm mù & quy tắc ẩn
Không dùng dấu phẩy tiếng Việt để đoán cấu trúc.

### 4. Ví dụ
- 他一边听音乐，一边做作业。

### 5. Chốt bản chất
Nhấn vào tính đồng thời.

## PHẦN II: LƯỢNG TỪ LẶP LẠI

### 1. Câu mở khóa
一件一件地看。

### 2. Bản chất cốt lõi & Công thức
Lặp lượng từ để diễn tả từng cái một.

## PHẦN III: BỔ NGỮ TRẠNG THÁI DẠNG SO SÁNH

### 1. Câu mở khóa
他说得比我快。

### 2. Bản chất cốt lõi & Công thức
V + 得 + 比 + đối tượng + tính chất.

## BÀI ĐỌC THÊM ÁP DỤNG NGỮ PHÁP
他一边走路，一边听录音。

## TỔNG KẾT CUỐI BÀI
- 一边...一边...
- 一件一件
- V 得 比...`;

const unknownBehaviorOptions: Array<{
 value: UnknownSectionBehavior;
 label: string;
}> = [
 { value: "keepUnmapped", label: "Keep unmapped" },
 { value: "keepAsNotes", label: "Keep as notes" },
 { value: "ignore", label: "Ignore" },
];

const applyTargetOptions: Array<{
 value: ApplyImportTarget;
 label: string;
}> = [
 { value: "grammar", label: "Ngữ pháp" },
 { value: "vocab", label: "Từ vựng" },
 { value: "lessonText", label: "Bài khóa" },
 { value: "exercise", label: "Bài tập / ôn tập" },
 { value: "mixed", label: "Mixed auto" },
];

const applyModeOptions: Array<{
 value: ApplyImportMode;
 label: string;
}> = [
 { value: "replace", label: "Ghi đè phần này" },
 { value: "append", label: "Thêm vào cuối" },
 { value: "mergeByTitle", label: "Ghép theo tiêu đề" },
];

const importMappedResultFieldFormSchema = z.object({
 field: learningFieldNameSchema,
 values: z.array(z.string()),
});

const importMappedResultItemFormSchema = z.object({
 id: z.string(),
 title: z.string(),
 fields: z.array(importMappedResultFieldFormSchema),
});

const importMappedResultSpecialSectionFormSchema = z.object({
 id: z.string(),
 title: z.string(),
 content: z.string(),
});

const importMappedResultFormSchema = z.object({
 items: z.array(importMappedResultItemFormSchema),
 specialSections: z.array(importMappedResultSpecialSectionFormSchema),
});

type ImportMappedResultFormValues = z.infer<
 typeof importMappedResultFormSchema
>;

function useImportMappedResultForm() {
 return useForm({
  defaultValues: buildImportMappedResultFormValues(null),
  onSubmit: () => undefined,
 });
}

type ImportMappedResultFormApi = ReturnType<typeof useImportMappedResultForm>;

function cloneProfile(profile: ParseProfile): ParseProfile {
 return structuredClone(profile);
}

function countSections(sections: LearningSection[]): number {
 return sections.reduce(
  (count, section) => count + 1 + countSections(section.children),
  0,
 );
}

function findSectionById(
 sections: LearningSection[],
 sectionId: string,
): LearningSection | null {
 for (const section of sections) {
  if (section.id === sectionId) return section;

  const child = findSectionById(section.children, sectionId);
  if (child) return child;
 }

 return null;
}

function parseHeadingLevelValue(value: string): Array<1 | 2 | 3 | 4 | 5 | 6> {
 const parsed = Number(value);

 if (
  parsed === 1 ||
  parsed === 2 ||
  parsed === 3 ||
  parsed === 4 ||
  parsed === 5 ||
  parsed === 6
 ) {
  return [parsed];
 }

 return [];
}

function firstHeadingLevel(rule: SectionRoleRule | FieldRule) {
 return String(rule.match.headingLevel?.[0] ?? "");
}

function firstHeadingRegex(rule: FieldRule) {
 return rule.match.headingRegex?.[0] ?? "";
}

function editableTextToLearningFieldValue(
 original: LearningFieldValue,
 value: string,
): LearningFieldValue {
 if (original.kind === "list") {
  return {
   kind: "list",
   value: value
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean),
  };
 }

 if (original.kind === "table") {
  return original;
 }

 return {
  kind: "text",
  value,
 };
}

function buildImportMappedResultFormValues(
 result: AppliedParseResult | null,
): ImportMappedResultFormValues {
 const values = !result
  ? {
     items: [],
     specialSections: [],
    }
  : {
     items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      fields: Object.entries(item.fields).flatMap(([field, values]) =>
       values
        ? [
           {
            field: field as LearningFieldName,
            values: values.map(learningFieldValueToPreview),
           },
          ]
        : [],
      ),
     })),
     specialSections: result.specialSections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
     })),
    };

 return importMappedResultFormSchema.parse(values);
}

function applyImportFormValuesToResult(
 result: AppliedParseResult,
 rawValues: unknown,
): AppliedParseResult {
 const values = importMappedResultFormSchema.parse(rawValues);

 return {
  ...result,
  items: result.items.map((item) => {
   const formItem = values.items.find((value) => value.id === item.id);

   if (!formItem) return item;

   const fields = Object.fromEntries(
    Object.entries(item.fields).map(([field, originalValues]) => {
     const formField = formItem.fields.find((value) => value.field === field);

     return [
      field,
      originalValues?.map((originalValue, index) =>
       editableTextToLearningFieldValue(
        originalValue,
        formField?.values[index] ?? learningFieldValueToPreview(originalValue),
       ),
      ),
     ];
    }),
   ) as MappedImportItem["fields"];

   return {
    ...item,
    title: formItem.title,
    fields,
   };
  }),
  specialSections: result.specialSections.map((section) => {
   const formSection = values.specialSections.find(
    (value) => value.id === section.id,
   );

   return formSection
    ? {
       ...section,
       title: formSection.title,
       content: formSection.content,
      }
    : section;
  }),
 };
}

function getDefaultApplyTarget(profile: ParseProfile): ApplyImportTarget {
 if (profile.target === "grammar") return "grammar";
 if (profile.target === "vocab") return "vocab";
 if (profile.target === "exercise") return "exercise";
 if (profile.target === "lessonText") return "lessonText";

 return "mixed";
}

function CollapsibleSection({
 title,
 summary,
 defaultOpen = false,
 children,
}: {
 title: string;
 summary?: string;
 defaultOpen?: boolean;
 children: React.ReactNode;
}) {
 const [open, setOpen] = useState(defaultOpen);

 return (
  <section className="rounded-xl border border-border-default bg-bg-subtle">
   <button
    type="button"
    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
    onClick={() => setOpen((current) => !current)}
   >
    <span className="min-w-0">
     <span className="block text-xs font-black uppercase tracking-wide text-text-muted">
      {title}
     </span>
     {summary && (
      <span className="block truncate text-xs font-semibold text-text-muted">
       {summary}
      </span>
     )}
    </span>
    <ChevronDown
     className={cn(
      "h-4 w-4 shrink-0 text-text-muted transition-transform",
      open && "rotate-180",
     )}
    />
   </button>

   {open && (
    <div className="grid gap-3 border-t border-border-default p-3">
     {children}
    </div>
   )}
  </section>
 );
}

function OutlineSection({ section }: { section: LearningSection }) {
 return (
  <li className="grid gap-1">
   <div className="flex items-start gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-2">
    <span className="shrink-0 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-black text-text-muted">
     H{section.level}
    </span>
    <div className="min-w-0">
     <p className="truncate text-sm font-black text-text-primary">
      {section.title}
     </p>
     {section.directives.length > 0 && (
      <p className="text-xs font-bold text-text-muted">
       {section.directives
        .map((directive) => `@${directive.type}:${directive.value}`)
        .join(", ")}
      </p>
     )}
    </div>
   </div>

   {section.children.length > 0 && (
    <ol className="ml-4 grid gap-1 border-l border-border-default pl-3">
     {section.children.map((child) => (
      <OutlineSection key={child.id} section={child} />
     ))}
    </ol>
   )}
  </li>
 );
}

function MappedItemPreview({
 item,
 itemIndex,
 form,
}: {
 item: MappedImportItem;
 itemIndex: number;
 form: ImportMappedResultFormApi;
}) {
 const entries = Object.entries(item.fields).flatMap(([field, values]) =>
  values ? [[field as LearningFieldName, values] as const] : [],
 );

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     {item.role}
    </p>

    <form.Field name={`items[${itemIndex}].title`}>
     {(field) => (
      <Input
       value={field.state.value}
       onChange={(event) => field.handleChange(event.target.value)}
       className="h-11 text-lg font-black"
       placeholder="Tên item"
      />
     )}
    </form.Field>
   </div>

   {entries.length === 0 ? (
    <p className="rounded-lg border border-dashed border-border-default p-3 text-sm font-semibold text-text-muted">
     Chưa map được field nào.
    </p>
   ) : (
    <div className="grid gap-2">
     {entries.map(([fieldName, values], fieldIndex) => (
      <div
       key={fieldName}
       className="grid gap-2 rounded-lg bg-bg-subtle p-3"
      >
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {fieldName}
       </p>

       <div className="grid gap-2">
        {values.map((_value, valueIndex) => (
         <form.Field
          key={`${fieldName}-${valueIndex}`}
          name={`items[${itemIndex}].fields[${fieldIndex}].values[${valueIndex}]`}
         >
          {(field) => (
           <Textarea
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            className="min-h-24 font-mono text-xs leading-relaxed"
           />
          )}
         </form.Field>
        ))}
       </div>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}

function SpecialSectionPreview({
 section,
 sectionIndex,
 form,
}: {
 section: MappedSpecialSection;
 sectionIndex: number;
 form: ImportMappedResultFormApi;
}) {
 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     {section.role}
    </p>

    <form.Field name={`specialSections[${sectionIndex}].title`}>
     {(field) => (
      <Input
       value={field.state.value}
       onChange={(event) => field.handleChange(event.target.value)}
       className="h-10 font-black"
       placeholder="Tên section"
      />
     )}
    </form.Field>
   </div>

   <form.Field name={`specialSections[${sectionIndex}].content`}>
    {(field) => (
     <Textarea
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
      className="min-h-32 font-mono text-xs leading-relaxed"
      placeholder="Nội dung section"
     />
    )}
   </form.Field>
  </div>
 );
}

function ResultSummary({
 result,
 profile,
 form,
}: {
 result: AppliedParseResult | null;
 profile: ParseProfile;
 form: ImportMappedResultFormApi;
}) {
 if (!result) {
  return (
   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3 text-sm font-semibold text-text-muted">
     <FileText className="h-6 w-6" />
     <p>
      Dán markdown, chỉnh profile nếu cần, rồi parse để xem outline và kết quả
      map. Import này chỉ preview, chưa tự lưu vào draft.
     </p>
    </div>
   </Card>
  );
 }

 return (
  <div className="grid gap-4">
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Sections
     </p>
     <p className="text-2xl font-black text-text-primary">
      {countSections(result.doc.sections)}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Items
     </p>
     <p className="text-2xl font-black text-text-primary">
      {result.items.length}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Special
     </p>
     <p className="text-2xl font-black text-text-primary">
      {result.specialSections.length}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Unmapped
     </p>
     <p className="text-2xl font-black text-text-primary">
      {result.unmappedSections.length}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Warnings
     </p>
     <p className="text-2xl font-black text-text-primary">
      {result.warnings.length}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Profile
     </p>
     <p className="truncate text-lg font-black text-text-primary">
      {profile.name}
     </p>
    </Card>
   </div>

   <QuickJumpButtons result={result} />

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <div className="flex items-center gap-2">
      <GitBranch className="h-5 w-5 text-text-muted" />
      <h2
       id="import-outline"
       className="scroll-mt-24 text-lg font-black text-text-primary"
      >
       Outline
      </h2>
     </div>

     {result.documentTitle && (
      <p className="rounded-lg bg-bg-subtle px-3 py-2 text-sm font-black text-text-primary">
       Document: {result.documentTitle}
      </p>
     )}

     {result.doc.sections.length === 0 ? (
      <p className="text-sm font-semibold text-text-muted">
       Markdown chưa có section.
      </p>
     ) : (
      <ol className="grid gap-2">
       {result.doc.sections.map((section) => (
        <OutlineSection key={section.id} section={section} />
       ))}
      </ol>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <h2
      id="import-mapped"
      className="scroll-mt-24 text-lg font-black text-text-primary"
     >
      Mapped result
     </h2>
     {result.items.length === 0 ? (
      <p className="rounded-xl border border-dashed border-border-default p-4 text-sm font-semibold text-text-muted">
       Không có item nào khớp item root rules của profile.
      </p>
     ) : (
      <div className="grid gap-3">
       {result.items.map((item, itemIndex) => (
        <MappedItemPreview
         key={item.id}
         item={item}
         itemIndex={itemIndex}
         form={form}
        />
       ))}
      </div>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <h2
      id="import-special"
      className="scroll-mt-24 text-lg font-black text-text-primary"
     >
      Special sections
     </h2>
     {result.specialSections.length === 0 ? (
      <p className="text-sm font-semibold text-text-muted">
       Không có reading/summary section.
      </p>
     ) : (
      <div className="grid gap-3">
       {result.specialSections.map((section, sectionIndex) => (
        <SpecialSectionPreview
         key={section.id}
         section={section}
         sectionIndex={sectionIndex}
         form={form}
        />
       ))}
      </div>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <h2
      id="import-unmapped"
      className="scroll-mt-24 text-lg font-black text-text-primary"
     >
      Unmapped sections
     </h2>
     {result.unmappedSections.length === 0 ? (
      <p className="text-sm font-semibold text-text-muted">
       Không có section bị bỏ lửng.
      </p>
     ) : (
      <div className="grid gap-2">
       {result.unmappedSections.map((section) => (
        <div
         key={section.id}
         className="grid gap-2 rounded-lg border border-border-default bg-bg-primary p-3"
        >
         <p className="text-sm font-black text-text-primary">
          {section.title}
         </p>

         <pre className="whitespace-pre-wrap break-words text-xs font-semibold text-text-muted">
          {sectionBlocksToPreview(section) || "Không có block text."}
         </pre>
        </div>
       ))}
      </div>
     )}
    </div>
   </Card>

   {result.warnings.length > 0 && (
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-3">
      <div className="flex items-center gap-2">
       <AlertTriangle className="h-5 w-5 text-text-muted" />
       <h2
        id="import-warnings"
        className="scroll-mt-24 text-lg font-black text-text-primary"
       >
        Warnings
       </h2>
      </div>
      <ul className="grid gap-2">
       {result.warnings.map((warning, index) => {
        const warningSection = warning.sectionId
         ? findSectionById(result.doc.sections, warning.sectionId)
         : null;

        return (
         <li
          key={`${warning.message}-${index}`}
          className="grid gap-2 rounded-lg bg-bg-subtle px-3 py-2 text-sm font-semibold text-text-muted"
         >
          <div>
           {warningSection
            ? `${warningSection.title}: `
            : warning.sectionId
              ? `${warning.sectionId}: `
              : ""}
           {warning.message}
          </div>
         </li>
        );
       })}
      </ul>
     </div>
    </Card>
   )}
  </div>
 );
}

function ProfileSettingsPanel({
 profile,
 onChange,
}: {
 profile: ParseProfile;
 onChange: (profile: ParseProfile) => void;
}) {
 const rootRule = profile.itemRootRules[0] ?? null;

 const updateRootRule = (patch: Partial<SectionRoleRule>) => {
  if (!rootRule) return;

  onChange({
   ...profile,
   itemRootRules: [
    {
     ...rootRule,
     ...patch,
     match: {
      ...rootRule.match,
      ...patch.match,
     },
    },
    ...profile.itemRootRules.slice(1),
   ],
  });
 };

 const updateSpecialRule = (
  ruleId: string,
  patch: Partial<SectionRoleRule["match"]>,
 ) => {
  onChange({
   ...profile,
   specialSectionRules: profile.specialSectionRules.map((rule) =>
    rule.id === ruleId
     ? {
        ...rule,
        match: {
         ...rule.match,
         ...patch,
        },
       }
     : rule,
   ),
  });
 };

 const updateFieldRule = (
  ruleId: string,
  patch: Partial<FieldRule["match"]>,
 ) => {
  onChange({
   ...profile,
   fieldRules: profile.fieldRules.map((rule) =>
    rule.id === ruleId
     ? {
        ...rule,
        match: {
         ...rule.match,
         ...patch,
        },
       }
     : rule,
   ),
  });
 };

 return (
  <div className="grid gap-4">
   <div className="flex items-center gap-2">
    <Settings2 className="h-5 w-5 text-text-muted" />
    <h2 className="text-lg font-black text-text-primary">Profile settings</h2>
   </div>

   <CollapsibleSection
    title="Root item"
    summary={
     rootRule
      ? `H${firstHeadingLevel(rootRule)} ${rootRule.match.headingRegex ?? ""}`
      : "No root rule"
    }
   >
    {rootRule ? (
     <div className="grid gap-3">
      <label className="grid gap-2">
       <span className="text-xs font-bold text-text-muted">
        Root heading level
       </span>
       <Select
        value={firstHeadingLevel(rootRule)}
        onValueChange={(value) =>
         updateRootRule({
          match: {
           headingLevel: parseHeadingLevelValue(value),
          },
         })
        }
       >
        <SelectTrigger className="h-9 w-full bg-bg-primary text-sm">
         <SelectValue placeholder="Chọn heading level" />
        </SelectTrigger>
        <SelectContent>
         {[1, 2, 3, 4, 5, 6].map((level) => (
          <SelectItem key={level} value={String(level)}>
           H{level}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </label>

      <label className="grid gap-2">
       <span className="text-xs font-bold text-text-muted">
        Root heading regex
       </span>
       <Input
        value={rootRule.match.headingRegex ?? ""}
        className="h-9 text-sm"
        onChange={(event) =>
         updateRootRule({
          match: {
           headingRegex: event.target.value,
          },
         })
        }
       />
      </label>

      <label className="grid gap-2">
       <span className="text-xs font-bold text-text-muted">
        Unknown behavior
       </span>
       <Select
        value={profile.unknownSectionBehavior}
        onValueChange={(value) =>
         onChange({
          ...profile,
          unknownSectionBehavior: value as UnknownSectionBehavior,
         })
        }
       >
        <SelectTrigger className="h-9 w-full bg-bg-primary text-sm">
         <SelectValue placeholder="Chọn behavior" />
        </SelectTrigger>
        <SelectContent>
         {unknownBehaviorOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
           {option.label}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </label>
     </div>
    ) : (
     <p className="text-sm font-semibold text-text-muted">
      Profile chưa có item root rule.
     </p>
    )}
   </CollapsibleSection>

   <CollapsibleSection
    title="Special sections"
    summary={`${profile.specialSectionRules.length} rule`}
   >
    {profile.specialSectionRules.length === 0 ? (
     <p className="text-sm font-semibold text-text-muted">
      Profile chưa có special section rule.
     </p>
    ) : (
     profile.specialSectionRules.map((rule) => (
      <div
       key={rule.id}
       className="grid gap-2 rounded-lg border border-border-default bg-bg-primary p-3"
      >
       <p className="text-sm font-black text-text-primary">{rule.role}</p>
       <div className="grid gap-2 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        <Select
         value={firstHeadingLevel(rule)}
         onValueChange={(value) =>
          updateSpecialRule(rule.id, {
           headingLevel: parseHeadingLevelValue(value),
          })
         }
        >
         <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder="H" />
         </SelectTrigger>
         <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((level) => (
           <SelectItem key={level} value={String(level)}>
            H{level}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Input
         value={rule.match.headingRegex ?? ""}
         className="h-9 text-sm"
         onChange={(event) =>
          updateSpecialRule(rule.id, {
           headingRegex: event.target.value,
          })
         }
        />
       </div>
      </div>
     ))
    )}
   </CollapsibleSection>

   <CollapsibleSection
    title="Field mapping"
    summary={`${profile.fieldRules.length} field rule`}
   >
    <div className="grid max-h-96 gap-2 overflow-y-auto pr-1">
     {profile.fieldRules.map((rule) => (
      <div
       key={rule.id}
       className="grid gap-2 rounded-lg border border-border-default bg-bg-primary p-3"
      >
       <p className="truncate text-sm font-black text-text-primary">
        {rule.field}
       </p>
       <div className="grid gap-2 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        <Select
         value={firstHeadingLevel(rule)}
         onValueChange={(value) =>
          updateFieldRule(rule.id, {
           headingLevel: parseHeadingLevelValue(value),
          })
         }
        >
         <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder="H" />
         </SelectTrigger>
         <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((level) => (
           <SelectItem key={level} value={String(level)}>
            H{level}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Input
         value={firstHeadingRegex(rule)}
         className="h-9 text-sm"
         onChange={(event) =>
          updateFieldRule(rule.id, {
           headingRegex: event.target.value ? [event.target.value] : [],
          })
         }
        />
       </div>
      </div>
     ))}
    </div>
   </CollapsibleSection>
  </div>
 );
}

type ImportStep = "input" | "review" | "apply";

function getImportHealth(result: AppliedParseResult | null) {
 if (!result) {
  return {
   canApply: false,
   blockingWarnings: ["Chưa parse markdown."],
   softWarnings: [],
  };
 }

 const blockingWarnings: string[] = [];
 const softWarnings: string[] = [];

 if (result.items.length === 0 && result.specialSections.length === 0) {
  blockingWarnings.push(
   "Không map được item nào. Đừng Apply nếu chưa chỉnh markdown hoặc profile.",
  );
 }

 if (result.unmappedSections.length > 0) {
  softWarnings.push(`${result.unmappedSections.length} section chưa map.`);
 }

 if (result.warnings.length > 0) {
  softWarnings.push(`${result.warnings.length} warning từ parser.`);
 }

 return {
  canApply: blockingWarnings.length === 0,
  blockingWarnings,
  softWarnings,
 };
}

function getDraftCounts(draft: LessonDraft) {
 return {
  vocabCount: draft.content.vocab.length,
  grammarCount: draft.content.grammarPoints.length,
  flashcardCount: draft.content.flashcards.length,
 };
}

function ImportStepper({
 step,
 canOpenReview,
 canOpenApply,
 onStepChange,
}: {
 step: ImportStep;
 canOpenReview: boolean;
 canOpenApply: boolean;
 onStepChange: (step: ImportStep) => void;
}) {
 const steps: Array<{
  key: ImportStep;
  label: string;
  description: string;
  enabled: boolean;
 }> = [
  {
   key: "input",
   label: "1. Dán markdown",
   description: "Chọn target, mode, profile rồi parse.",
   enabled: true,
  },
  {
   key: "review",
   label: "2. Kiểm tra",
   description: "Xem mapped result, warning và unmapped section.",
   enabled: canOpenReview,
  },
  {
   key: "apply",
   label: "3. Apply",
   description: "Xác nhận trước khi ghi vào draft.",
   enabled: canOpenApply,
  },
 ];

 const activeIndex = steps.findIndex((item) => item.key === step);

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm md:grid-cols-3">
   {steps.map((item, index) => {
    const active = item.key === step;
    const done = index < activeIndex;

    return (
     <button
      key={item.key}
      type="button"
      disabled={!item.enabled}
      onClick={() => onStepChange(item.key)}
      className={cn(
       "rounded-xl border px-3 py-2 text-left transition-colors",
       active
        ? "border-accent-muted bg-accent-subtle text-text-primary"
        : done
          ? "border-border-default bg-bg-subtle text-text-secondary hover:bg-bg-elevated"
          : "border-border-default bg-bg-primary text-text-muted hover:bg-bg-subtle",
       !item.enabled && "cursor-not-allowed opacity-50 hover:bg-bg-primary",
      )}
     >
      <p className="text-sm font-black">{item.label}</p>
      <p className="mt-1 text-xs font-semibold">{item.description}</p>
     </button>
    );
   })}
  </div>
 );
}

function ImportWarningPanel({
 result,
 applyMode,
 onJumpToUnmapped,
 onJumpToWarnings,
}: {
 result: AppliedParseResult | null;
 applyMode: ApplyImportMode;
 onJumpToUnmapped?: () => void;
 onJumpToWarnings?: () => void;
}) {
 const health = getImportHealth(result);
 const hasAnyWarning =
  health.blockingWarnings.length > 0 ||
  health.softWarnings.length > 0 ||
  applyMode === "replace";

 if (!hasAnyWarning) {
  return (
   <Card padding="md" className="rounded-xl border-emerald-200 bg-emerald-50">
    <p className="text-sm font-black text-emerald-800">
     Không thấy warning lớn. Vẫn nên lướt preview trước khi Apply.
    </p>
   </Card>
  );
 }

 return (
  <Card padding="md" className="rounded-xl border-amber-200 bg-amber-50">
   <div className="grid gap-2">
    <div className="flex items-center gap-2">
     <AlertTriangle className="h-5 w-5 text-amber-700" />
     <h3 className="text-sm font-black text-amber-900">
      Cần kiểm tra trước khi Apply
     </h3>
    </div>

    {applyMode === "replace" && (
     <p className="rounded-lg bg-white/70 px-3 py-2 text-sm font-bold text-amber-900">
      Ghi đè sẽ thay thế dữ liệu hiện tại của tab đang chọn.
     </p>
    )}

    {health.blockingWarnings.map((warning) => (
     <p
      key={warning}
      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
     >
      {warning}
     </p>
    ))}

    {result && result.unmappedSections.length > 0 && (
     <button
      type="button"
      className="rounded-lg bg-white/70 px-3 py-2 text-left text-sm font-bold text-amber-900 transition-colors hover:bg-white"
      onClick={onJumpToUnmapped}
     >
      {result.unmappedSections.length} section chưa map. Bấm để xem danh sách.
     </button>
    )}

    {result && result.warnings.length > 0 && (
     <button
      type="button"
      className="rounded-lg bg-white/70 px-3 py-2 text-left text-sm font-bold text-amber-900 transition-colors hover:bg-white"
      onClick={onJumpToWarnings}
     >
      {result.warnings.length} warning từ parser. Bấm để xem chi tiết.
     </button>
    )}

    {health.softWarnings
     .filter(
      (warning) =>
       !warning.includes("section chưa map") &&
       !warning.includes("warning từ parser"),
     )
     .map((warning) => (
      <p
       key={warning}
       className="rounded-lg bg-white/70 px-3 py-2 text-sm font-bold text-amber-900"
      >
       {warning}
      </p>
     ))}
   </div>
  </Card>
 );
}

function jumpToImportSection(id: string) {
 document.getElementById(id)?.scrollIntoView({
  behavior: "smooth",
  block: "start",
 });
}

function QuickJumpButtons({ result }: { result: AppliedParseResult | null }) {
 if (!result) return null;

 const jumps = [
  {
   id: "import-outline",
   label: `Outline (${countSections(result.doc.sections)})`,
   show: result.doc.sections.length > 0,
  },
  {
   id: "import-mapped",
   label: `Items (${result.items.length})`,
   show: true,
  },
  {
   id: "import-special",
   label: `Special (${result.specialSections.length})`,
   show: result.specialSections.length > 0,
  },
  {
   id: "import-unmapped",
   label: `Unmapped (${result.unmappedSections.length})`,
   show: result.unmappedSections.length > 0,
  },
  {
   id: "import-warnings",
   label: `Warnings (${result.warnings.length})`,
   show: result.warnings.length > 0,
  },
 ].filter((item) => item.show);

 if (jumps.length === 0) return null;

 return (
  <Card padding="sm" className="rounded-xl">
   <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs font-black uppercase tracking-wide text-text-muted">
     Nhảy nhanh
    </span>

    {jumps.map((item) => (
     <Button
      key={item.id}
      type="button"
      size="sm"
      variant="outline"
      onClick={() => jumpToImportSection(item.id)}
     >
      {item.label}
     </Button>
    ))}
   </div>
  </Card>
 );
}

type MarkdownImportPreviewProps = {
 draft: LessonDraft;
};

export function MarkdownImportPreview({ draft }: MarkdownImportPreviewProps) {
 const updateDraftMutation = useUpdateLessonDraftMutation();
 const initialProfileState = useMemo(() => getAvailableImportProfiles(), []);
 const [profiles, setProfiles] = useState(initialProfileState.profiles);
 const storageWarnings = initialProfileState.warnings;
 const [step, setStep] = useState<ImportStep>("input");
 const [markdown, setMarkdown] = useState("");
 const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
 const selectedProfile = useMemo(
  () => profiles.find((profile) => profile.id === profileId) ?? profiles[0],
  [profileId, profiles],
 );
 const [editableProfile, setEditableProfile] = useState<ParseProfile | null>(
  selectedProfile ? cloneProfile(selectedProfile) : null,
 );
 const [result, setResult] = useState<AppliedParseResult | null>(null);
 const [applyTarget, setApplyTarget] = useState<ApplyImportTarget>(
  selectedProfile ? getDefaultApplyTarget(selectedProfile) : "mixed",
 );
 const [applyMode, setApplyMode] = useState<ApplyImportMode>("replace");
 const importResultForm = useImportMappedResultForm();

 const activeProfile = editableProfile ?? selectedProfile ?? null;
 const applyPreview = result ? getApplyPreviewText(result) : null;
 const health = getImportHealth(result);
 const draftCounts = getDraftCounts(draft);

 const resetParsedResult = () => {
  importResultForm.reset(buildImportMappedResultFormValues(null));
  setResult(null);
  setStep("input");
 };

 const handleMarkdownChange = (value: string) => {
  setMarkdown(value);
  if (result) resetParsedResult();
 };

 const handleProfileChange = (nextProfileId: string) => {
  const nextProfile =
   profiles.find((profile) => profile.id === nextProfileId) ?? null;

  setProfileId(nextProfileId);
  setEditableProfile(nextProfile ? cloneProfile(nextProfile) : null);
  setApplyTarget(nextProfile ? getDefaultApplyTarget(nextProfile) : "mixed");
  resetParsedResult();
 };

 const handleProfileEdit = (nextProfile: ParseProfile) => {
  setEditableProfile(nextProfile);
  if (result) resetParsedResult();
 };

 const handleSaveCustomProfile = () => {
  if (!activeProfile) {
   toast.error("Không có profile để lưu.");
   return;
  }

  const isCustomProfile = activeProfile.id.startsWith("custom-");
  const customId = isCustomProfile
   ? activeProfile.id
   : `custom-${activeProfile.id}-${Date.now()}`;

  const savedProfile: ParseProfile = {
   ...activeProfile,
   id: customId,
   name: isCustomProfile
    ? activeProfile.name
    : `${activeProfile.name} (custom)`,
  };

  const existingCustomProfiles = loadCustomImportProfiles().profiles.filter(
   (profile) => profile.id !== customId,
  );

  saveCustomImportProfiles([...existingCustomProfiles, savedProfile]);

  setProfiles((currentProfiles) => [
   ...currentProfiles.filter((profile) => profile.id !== customId),
   savedProfile,
  ]);
  setProfileId(customId);
  setEditableProfile(cloneProfile(savedProfile));
  importResultForm.reset(buildImportMappedResultFormValues(null));
  setResult(null);
  setStep("input");

  toast.success("Đã lưu custom import profile.");
 };

 const handleParse = () => {
  if (!activeProfile) {
   toast.error("Không có parse profile hợp lệ.");
   return;
  }

  if (!markdown.trim()) {
   toast.error("Chưa có markdown để parse.");
   return;
  }

  const doc = markdownToLearningDoc(markdown);
  const nextResult = applyParseProfile(doc, activeProfile);
  importResultForm.reset(buildImportMappedResultFormValues(nextResult));
  setResult(nextResult);
  setStep("review");
  toast.success(`Parsed ${nextResult.items.length} item.`);
 };

 const goToReviewSection = (sectionId: string) => {
  setStep("review");

  window.setTimeout(() => {
   jumpToImportSection(sectionId);
  }, 80);
 };

 const handleApply = async ({ force = false }: { force?: boolean } = {}) => {
  if (!result) {
   toast.error("Parse markdown trước khi apply.");
   return;
  }

  if (!health.canApply && !force) {
   toast.error("Kết quả parse chưa an toàn để apply.");
   return;
  }

  const parsedFormValues = importMappedResultFormSchema.safeParse(
   importResultForm.state.values,
  );

  if (!parsedFormValues.success) {
   toast.error("Form mapped result không hợp lệ. Kiểm tra lại dữ liệu đã sửa.");
   return;
  }

  const resultForApply = applyImportFormValuesToResult(
   result,
   parsedFormValues.data,
  );

  const nextContent = applyParsedResultToDraft({
   draftContent: draft.content,
   parsedResult: resultForApply,
   target: applyTarget,
   mode: applyMode,
  });

  await updateDraftMutation.mutateAsync({
   draftId: draft.id,
   input: {
    content: nextContent,
   },
  });

  toast.success("Đã apply import vào draft.");
 };

 return (
  <div className="grid gap-4">
   <Card
    padding="md"
    className="sticky top-0 z-20 rounded-xl bg-bg-card/95 backdrop-blur"
   >
    <div className="grid gap-3 xl:grid-cols-[minmax(15rem,1.2fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)] xl:items-end">
     <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
       Profile
      </span>
      <Select
       value={activeProfile?.id ?? ""}
       onValueChange={handleProfileChange}
      >
       <SelectTrigger className="w-full">
        <SelectValue placeholder="Chọn parse profile" />
       </SelectTrigger>
       <SelectContent>
        {profiles.map((profile) => (
         <SelectItem key={profile.id} value={profile.id}>
          {profile.name}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </label>

     <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
       Apply vào
      </span>
      <Select
       value={applyTarget}
       onValueChange={(value) => setApplyTarget(value as ApplyImportTarget)}
      >
       <SelectTrigger className="w-full">
        <SelectValue placeholder="Chọn target" />
       </SelectTrigger>
       <SelectContent>
        {applyTargetOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </label>

     <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
       Chế độ
      </span>
      <Select
       value={applyMode}
       onValueChange={(value) => setApplyMode(value as ApplyImportMode)}
      >
       <SelectTrigger className="w-full">
        <SelectValue placeholder="Chọn mode" />
       </SelectTrigger>
       <SelectContent>
        {applyModeOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </label>

     <div className="xl:col-span-3">
      <CollapsibleSection
       title="Nâng cao: chỉnh profile"
       summary="Root rule, special sections, field mapping"
      >
       {activeProfile ? (
        <div className="grid gap-3">
         <ProfileSettingsPanel
          profile={activeProfile}
          onChange={handleProfileEdit}
         />
         <Button
          type="button"
          variant="outline"
          onClick={handleSaveCustomProfile}
         >
          <Save className="h-4 w-4" />
          Lưu profile custom
         </Button>
        </div>
       ) : (
        <p className="text-sm font-semibold text-text-muted">
         Không có profile khả dụng.
        </p>
       )}
      </CollapsibleSection>
     </div>
    </div>
   </Card>

   <ImportStepper
    step={step}
    canOpenReview={Boolean(result)}
    canOpenApply={Boolean(result)}
    onStepChange={setStep}
   />

   {step === "input" && (
    <div className="grid gap-4 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-4">
       <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
         <p className="text-xs font-black uppercase tracking-wide text-text-muted">
          Bước 1
         </p>
         <h2 className="text-xl font-black text-text-primary">Dán Markdown</h2>
         <p className="text-sm font-semibold text-text-muted">
          Dán markdown rồi parse để xem trước. Bước này chưa lưu vào draft.
         </p>
        </div>

        <div className="flex flex-wrap gap-2">
         <Button type="button" onClick={handleParse}>
          <WandSparkles className="h-4 w-4" />
          Parse & xem trước
         </Button>
         <Button
          type="button"
          variant="outline"
          onClick={() => handleMarkdownChange(sampleMarkdown)}
         >
          Dùng mẫu
         </Button>
        </div>
       </div>

       <label className="grid gap-2">
        <span className="text-xs font-black uppercase tracking-wide text-text-muted">
         Markdown
        </span>
        <Textarea
         value={markdown}
         onChange={(event) => handleMarkdownChange(event.target.value)}
         className="min-h-96 font-mono text-xs"
         placeholder={sampleMarkdown}
        />
       </label>

       {storageWarnings.length > 0 && (
        <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
         {storageWarnings.map((warning) => (
          <p key={warning} className="text-sm font-semibold text-text-muted">
           {warning}
          </p>
         ))}
        </div>
       )}
      </div>
     </Card>

     <section className="grid content-start gap-4">
      <Card padding="lg" className="rounded-xl">
       <div className="grid gap-3">
        <FileText className="h-6 w-6 text-text-muted" />
        <div>
         <h3 className="text-lg font-black text-text-primary">
          Flow import an toàn
         </h3>
         <p className="text-sm font-semibold text-text-muted">
          Import không tự lưu. Parse chỉ tạo preview. Apply ở bước cuối mới ghi
          vào draft.
         </p>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-text-secondary">
         <p>1. Chọn profile, target, mode ở thanh trên.</p>
         <p>2. Dán markdown theo format bài.</p>
         <p>3. Parse để app đọc outline và map field.</p>
         <p>4. Kiểm tra warning/unmapped section.</p>
         <p>5. Xác nhận Apply vào đúng tab.</p>
        </div>
       </div>
      </Card>

      <Card padding="lg" className="rounded-xl">
       <div className="grid gap-2">
        <h3 className="text-lg font-black text-text-primary">Cảnh báo mode</h3>
        <p className="text-sm font-semibold text-text-muted">
         Ghi đè sẽ thay thế phần đang chọn. Thêm vào cuối sẽ nối dữ liệu mới.
         Ghép theo tiêu đề sẽ cố cập nhật item trùng tên.
        </p>
       </div>
      </Card>
     </section>
    </div>
   )}

   {step === "review" && (
    <div className="grid gap-4">
     <Card padding="lg" className="rounded-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bước 2
        </p>
        <h2 className="text-xl font-black text-text-primary">
         Kiểm tra kết quả parse
        </h2>
        <p className="text-sm font-semibold text-text-muted">
         Xem app đã nhận diện được gì trước khi ghi vào draft.
        </p>
       </div>

       <div className="flex flex-wrap gap-2">
        <Button
         type="button"
         variant="outline"
         onClick={() => setStep("input")}
        >
         Sửa markdown/profile
        </Button>
        <Button
         type="button"
         variant="outline"
         disabled={!result}
         onClick={() => setStep("apply")}
        >
         Xem xác nhận
        </Button>
        <Button
         type="button"
         disabled={!result || updateDraftMutation.isPending}
         isLoading={updateDraftMutation.isPending}
         onClick={() => void handleApply({ force: true })}
        >
         <Save className="h-4 w-4" />
         {updateDraftMutation.isPending ? "Đang apply..." : "Apply luôn"}
        </Button>
       </div>
      </div>
     </Card>

     {result && activeProfile ? (
      <>
       <ImportWarningPanel
        result={result}
        applyMode={applyMode}
        onJumpToUnmapped={() => goToReviewSection("import-unmapped")}
        onJumpToWarnings={() => goToReviewSection("import-warnings")}
       />
       <ResultSummary
        result={result}
        profile={activeProfile}
        form={importResultForm}
       />
      </>
     ) : (
      <Card padding="lg" className="rounded-xl">
       <p className="text-sm font-semibold text-text-muted">
        Chưa có kết quả parse. Quay lại bước 1 để parse markdown.
       </p>
      </Card>
     )}
    </div>
   )}

   {step === "apply" && (
    <div className="grid gap-4">
     <Card padding="lg" className="rounded-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bước 3
        </p>
        <h2 className="text-xl font-black text-text-primary">
         Xác nhận Apply vào draft
        </h2>
        <p className="text-sm font-semibold text-text-muted">
         Apply mới ghi dữ liệu vào draft. Kiểm tra kỹ target và mode trước khi
         bấm.
        </p>
       </div>

       <div className="flex flex-wrap gap-2">
        <Button
         type="button"
         variant="outline"
         onClick={() => setStep("review")}
        >
         Quay lại kiểm tra
        </Button>
        <Button
         type="button"
         disabled={!result || !health.canApply || updateDraftMutation.isPending}
         isLoading={updateDraftMutation.isPending}
         onClick={() => void handleApply()}
        >
         <Save className="h-4 w-4" />
         {updateDraftMutation.isPending ? "Đang apply..." : "Apply vào draft"}
        </Button>
       </div>
      </div>
     </Card>

     <ImportWarningPanel
      result={result}
      applyMode={applyMode}
      onJumpToUnmapped={() => goToReviewSection("import-unmapped")}
      onJumpToWarnings={() => goToReviewSection("import-warnings")}
     />

     <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="lg" className="rounded-xl">
       <div className="grid gap-3">
        <h3 className="text-lg font-black text-text-primary">
         Sẽ ghi vào draft
        </h3>

        <div className="grid gap-2 text-sm font-bold text-text-secondary">
         <p>Apply vào: {applyTarget}</p>
         <p>Chế độ: {applyMode}</p>
         <p>Grammar item: {applyPreview?.grammarCount ?? 0}</p>
         <p>Vocab item: {applyPreview?.vocabCount ?? 0}</p>
         <p>Reading section: {applyPreview?.readingCount ?? 0}</p>
         <p>Summary section: {applyPreview?.summaryCount ?? 0}</p>
         <p>Exercise set: {applyPreview?.exerciseCount ?? 0}</p>
        </div>
       </div>
      </Card>

      <Card padding="lg" className="rounded-xl">
       <div className="grid gap-3">
        <h3 className="text-lg font-black text-text-primary">
         Dữ liệu hiện tại
        </h3>

        <div className="grid gap-2 text-sm font-bold text-text-secondary">
         <p>Từ vựng hiện tại: {draftCounts.vocabCount}</p>
         <p>Ngữ pháp hiện tại: {draftCounts.grammarCount}</p>
         <p>Flashcards hiện tại: {draftCounts.flashcardCount}</p>
        </div>

        {applyMode === "replace" && (
         <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
          Ghi đè có thể thay thế phần hiện tại của target đã chọn.
         </p>
        )}
       </div>
      </Card>
     </div>
    </div>
   )}
  </div>
 );
}
