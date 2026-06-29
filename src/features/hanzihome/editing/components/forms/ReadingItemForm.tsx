"use client";

import { useMemo } from "react";

import { ReadingItemSchema } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { createNestedEditAdapter } from "../../adapters/createNestedEditAdapter";
import {
 nestedFieldGroup,
 nestedFieldKind,
 nestedFieldLabel,
 nestedFieldRequired,
 nestedFieldDefaultVisible,
} from "../../adapters/nestedFieldLabels";
import { StructuredNodeForm, type StructuredNodeFormProps } from "./StructuredNodeForm";

type ReadingItemFormProps = Omit<StructuredNodeFormProps, "adapter">;

export function ReadingItemForm(props: ReadingItemFormProps) {
 const adapter = useMemo(
  () =>
   createNestedEditAdapter({
    schema: ReadingItemSchema,
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
