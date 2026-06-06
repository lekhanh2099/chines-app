"use client";

import type { EditAdapter } from "../../adapters/types";
import {
 StructuredNodeForm,
 type StructuredNodeFormProps,
} from "./StructuredNodeForm";

export type NodeFormProps = Omit<StructuredNodeFormProps, "adapter">;

export function createNodeForm(adapter: EditAdapter) {
 return function NodeForm(props: NodeFormProps) {
  return <StructuredNodeForm {...props} adapter={adapter} />;
 };
}
