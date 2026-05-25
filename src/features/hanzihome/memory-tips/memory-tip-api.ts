import {
  createMemoryTipPayloadSchema,
  memoryTipSchema,
  updateMemoryTipPayloadSchema,
  type CreateMemoryTipPayload,
  type MemoryTip,
  type UpdateMemoryTipPayload,
} from "./memory-tip.schema";

export const memoryTipsQueryKey = ["hanzihome", "memory-tips"] as const;

const memoryTipsResponseSchema = {
  parse(json: unknown) {
    const items = Array.isArray((json as { items?: unknown }).items)
      ? (json as { items: unknown[] }).items
      : [];

    return {
      items: items.map((item) => memoryTipSchema.parse(item)),
    };
  },
};

const memoryTipResponseSchema = {
  parse(json: unknown) {
    return {
      item: memoryTipSchema.parse((json as { item?: unknown }).item),
    };
  },
};

export class MemoryTipsApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "MemoryTipsApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseApiError(response: Response) {
  const json: unknown = await response.json().catch(() => null);

  if (json && typeof json === "object") {
    const error = "error" in json ? json.error : undefined;
    const code = "code" in json ? json.code : undefined;

    return new MemoryTipsApiError(
      typeof error === "string" ? error : `Request failed with ${response.status}`,
      response.status,
      typeof code === "string" ? code : undefined,
    );
  }

  return new MemoryTipsApiError(
    `Request failed with ${response.status}`,
    response.status,
  );
}

async function readJsonOrThrow(response: Response) {
  if (response.ok) return response.json() as Promise<unknown>;

  throw await parseApiError(response);
}

export function isDuplicateMemoryTipError(error: unknown) {
  return (
    error instanceof MemoryTipsApiError &&
    (error.status === 409 || error.code === "23505")
  );
}

export async function getMemoryTips(): Promise<MemoryTip[]> {
  const response = await fetch("/api/hanzihome/memory-tips", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  const json = await readJsonOrThrow(response);

  return memoryTipsResponseSchema.parse(json).items;
}

export async function createMemoryTip(
  input: CreateMemoryTipPayload,
): Promise<MemoryTip> {
  const payload = createMemoryTipPayloadSchema.parse(input);
  const response = await fetch("/api/hanzihome/memory-tips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await readJsonOrThrow(response);

  return memoryTipResponseSchema.parse(json).item;
}

export async function updateMemoryTip({
  tipId,
  input,
}: {
  tipId: string;
  input: UpdateMemoryTipPayload;
}): Promise<MemoryTip> {
  const payload = updateMemoryTipPayloadSchema.parse(input);
  const response = await fetch(`/api/hanzihome/memory-tips/${tipId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await readJsonOrThrow(response);

  return memoryTipResponseSchema.parse(json).item;
}

export async function archiveMemoryTip(tipId: string): Promise<void> {
  const response = await fetch(`/api/hanzihome/memory-tips/${tipId}`, {
    method: "DELETE",
  });

  await readJsonOrThrow(response);
}
