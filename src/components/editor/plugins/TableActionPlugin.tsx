/**
 * TableActionPlugin — Registers the @lexical/table plugin for table support.
 *
 * Handles table cell selection, resizing, and hover actions
 * (add row/column buttons on table edges).
 */
"use client";

import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

export default function TableActionPlugin() {
 return <TablePlugin />;
}
