"use client";

import { useMemo } from "react";

import { ExerciseSchema } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { createNestedEditAdapter } from "../../adapters/createNestedEditAdapter";
import {
 nestedFieldGroup,
 nestedFieldKind,
 nestedFieldLabel,
 nestedFieldRequired,
} from "../../adapters/nestedFieldLabels";
import { StructuredNodeForm, type StructuredNodeFormProps } from "./StructuredNodeForm";

type ExerciseFormProps = Omit<StructuredNodeFormProps, "adapter">;

export function ExerciseMetadataForm(props: ExerciseFormProps) {
 const adapter = useMemo(
  () =>
   createNestedEditAdapter({
    schema: ExerciseSchema,
    labelForPath: nestedFieldLabel,
    groupForPath: nestedFieldGroup,
    kindForPath: nestedFieldKind,
    requiredForPath: nestedFieldRequired,
   }),
  [],
 );

 return <StructuredNodeForm {...props} adapter={adapter} />;
}
