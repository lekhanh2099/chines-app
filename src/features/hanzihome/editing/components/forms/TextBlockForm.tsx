"use client";

import { useMemo } from "react";

import { TextBlockSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";

import { createNestedEditAdapter } from "../../adapters/createNestedEditAdapter";
import {
 nestedFieldGroup,
 nestedFieldKind,
 nestedFieldLabel,
 nestedFieldRequired,
 nestedFieldDefaultVisible,
} from "../../adapters/nestedFieldLabels";
import { StructuredNodeForm, type StructuredNodeFormProps } from "./StructuredNodeForm";

type TextBlockFormProps = Omit<StructuredNodeFormProps, "adapter">;

export function TextBlockForm(props: TextBlockFormProps) {
 const adapter = useMemo(
  () =>
   createNestedEditAdapter({
    schema: TextBlockSchema,
    labelForPath: nestedFieldLabel,
    groupForPath: nestedFieldGroup,
    kindForPath: nestedFieldKind,
    requiredForPath: nestedFieldRequired,
    defaultVisibleForPath: nestedFieldDefaultVisible,
   }),
  [],
 );

 return <StructuredNodeForm {...props} adapter={adapter} />;
}
