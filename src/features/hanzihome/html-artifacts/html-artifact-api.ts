"use client";

import { z } from "zod";
import {
 createHtmlArtifactPayloadSchema,
 createHtmlArtifactFolderPayloadSchema,
 htmlArtifactFolderSchema,
 htmlArtifactRuntimeStateSchema,
 htmlArtifactSchema,
 htmlArtifactSummarySchema,
 updateHtmlArtifactPayloadSchema,
 updateHtmlArtifactFolderPayloadSchema,
 updateHtmlArtifactRuntimeStatePayloadSchema,
 type CreateHtmlArtifactFolderPayload,
 type CreateHtmlArtifactPayload,
 type HtmlArtifact,
 type HtmlArtifactFolder,
 type HtmlArtifactRuntimeState,
 type HtmlArtifactSummary,
 type UpdateHtmlArtifactFolderPayload,
 type UpdateHtmlArtifactPayload,
 type UpdateHtmlArtifactRuntimeStatePayload,
} from "./html-artifact.schema";

export const htmlArtifactsQueryKey = ["hanzihome", "html-artifacts"];
export const htmlArtifactRuntimeStateQueryKey = (artifactId: string) => [
 ...htmlArtifactsQueryKey,
 artifactId,
 "runtime-state",
];

const htmlArtifactsResponseSchema = z.object({
 items: z.array(htmlArtifactSummarySchema),
 folders: z.array(htmlArtifactFolderSchema),
});
const htmlArtifactResponseSchema = z.object({ item: htmlArtifactSchema });
const htmlArtifactFolderResponseSchema = z.object({ item: htmlArtifactFolderSchema });
const htmlArtifactRuntimeStateResponseSchema = z.object({
 state: htmlArtifactRuntimeStateSchema,
});

export class HtmlArtifactsApiError extends Error {
 status: number;
 code?: string;

 constructor(message: string, status: number, code?: string) {
  super(message);
  this.name = "HtmlArtifactsApiError";
  this.status = status;
  this.code = code;
 }
}

async function parseApiError(response: Response) {
 const json = z.json().parse(await response.json().catch(() => null));

 if (json && typeof json === "object") {
  const error = "error" in json ? json.error : undefined;
  const code = "code" in json ? json.code : undefined;

  return new HtmlArtifactsApiError(
   typeof error === "string" ? error : `Request failed with ${response.status}`,
   response.status,
   typeof code === "string" ? code : undefined,
  );
 }

 return new HtmlArtifactsApiError(`Request failed with ${response.status}`, response.status);
}

async function readJsonOrThrow(response: Response) {
 if (response.ok) return z.json().parse(await response.json());

 throw await parseApiError(response);
}

export async function getHtmlArtifacts(): Promise<{
 items: HtmlArtifactSummary[];
 folders: HtmlArtifactFolder[];
}> {
 const response = await fetch("/api/hanzihome/html-artifacts", {
  method: "GET",
  headers: {
   Accept: "application/json",
  },
 });
 const json = await readJsonOrThrow(response);

 return htmlArtifactsResponseSchema.parse(json);
}

export async function getHtmlArtifact(artifactId: string): Promise<HtmlArtifact> {
 const response = await fetch(`/api/hanzihome/html-artifacts/${encodeURIComponent(artifactId)}`, {
  method: "GET",
  headers: {
   Accept: "application/json",
  },
 });
 const json = await readJsonOrThrow(response);

 return htmlArtifactResponseSchema.parse(json).item;
}

export async function createHtmlArtifact(input: CreateHtmlArtifactPayload): Promise<HtmlArtifact> {
 const payload = createHtmlArtifactPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/html-artifacts", {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
 });
 const json = await readJsonOrThrow(response);

 return htmlArtifactResponseSchema.parse(json).item;
}

export async function updateHtmlArtifact({
 artifactId,
 input,
}: {
 artifactId: string;
 input: UpdateHtmlArtifactPayload;
}): Promise<HtmlArtifact> {
 const payload = updateHtmlArtifactPayloadSchema.parse(input);
 const response = await fetch(`/api/hanzihome/html-artifacts/${encodeURIComponent(artifactId)}`, {
  method: "PATCH",
  headers: {
   "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
 });
 const json = await readJsonOrThrow(response);

 return htmlArtifactResponseSchema.parse(json).item;
}

export async function deleteHtmlArtifact(artifactId: string): Promise<void> {
 const response = await fetch(`/api/hanzihome/html-artifacts/${encodeURIComponent(artifactId)}`, {
  method: "DELETE",
 });

 await readJsonOrThrow(response);
}

export async function getHtmlArtifactRuntimeState(
 artifactId: string,
): Promise<HtmlArtifactRuntimeState> {
 const response = await fetch(
  `/api/hanzihome/html-artifacts/${encodeURIComponent(artifactId)}/runtime-state`,
  {
   method: "GET",
   headers: {
    Accept: "application/json",
   },
  },
 );
 const json = await readJsonOrThrow(response);

 return htmlArtifactRuntimeStateResponseSchema.parse(json).state;
}

export async function updateHtmlArtifactRuntimeState({
 artifactId,
 input,
}: {
 artifactId: string;
 input: UpdateHtmlArtifactRuntimeStatePayload;
}): Promise<HtmlArtifactRuntimeState> {
 const payload = updateHtmlArtifactRuntimeStatePayloadSchema.parse(input);
 const response = await fetch(
  `/api/hanzihome/html-artifacts/${encodeURIComponent(artifactId)}/runtime-state`,
  {
   method: "PUT",
   headers: {
    "Content-Type": "application/json",
   },
   body: JSON.stringify(payload),
  },
 );
 const json = await readJsonOrThrow(response);

 return htmlArtifactRuntimeStateResponseSchema.parse(json).state;
}

export async function createHtmlArtifactFolder(
 input: CreateHtmlArtifactFolderPayload,
): Promise<HtmlArtifactFolder> {
 const payload = createHtmlArtifactFolderPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/html-artifacts/folders", {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
 });
 const json = await readJsonOrThrow(response);

 return htmlArtifactFolderResponseSchema.parse(json).item;
}

export async function updateHtmlArtifactFolder({
 folderId,
 input,
}: {
 folderId: string;
 input: UpdateHtmlArtifactFolderPayload;
}): Promise<HtmlArtifactFolder> {
 const payload = updateHtmlArtifactFolderPayloadSchema.parse(input);
 const response = await fetch(
  `/api/hanzihome/html-artifacts/folders/${encodeURIComponent(folderId)}`,
  {
   method: "PATCH",
   headers: {
    "Content-Type": "application/json",
   },
   body: JSON.stringify(payload),
  },
 );
 const json = await readJsonOrThrow(response);

 return htmlArtifactFolderResponseSchema.parse(json).item;
}

export async function deleteHtmlArtifactFolder(folderId: string): Promise<void> {
 const response = await fetch(
  `/api/hanzihome/html-artifacts/folders/${encodeURIComponent(folderId)}`,
  {
   method: "DELETE",
  },
 );

 await readJsonOrThrow(response);
}
