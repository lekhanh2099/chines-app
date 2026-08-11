import { z } from "zod";

import { JsonValueSchema, type JsonFieldValue } from "@/types/json";

export const IntegrationScopeSchema = z.enum([
 "content:read",
 "content:write",
 "notes:read",
 "notes:write",
 "learning:read",
 "learning:write",
 "artifacts:read",
 "artifacts:write",
 "lookup:read",
 "ai:generate",
 "ai-settings:read",
 "ai-settings:write",
 "tts:generate",
]);
export type IntegrationScope = z.infer<typeof IntegrationScopeSchema>;

const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const ApiInventorySourceSchema = z.enum(["route", "client-flow"]);
const ApiExposureSchema = z.enum(["public-v1", "internal-only"]);

const ApiOperationSchema = z.object({
 method: HttpMethodSchema,
 query: z.string().min(1).nullable(),
 requestBody: z.string().min(1).nullable(),
 responseStatus: z.number().int().min(100).max(599),
 responseContentType: z.string().min(1),
 responseBody: z.string().min(1).nullable(),
});
export type PublicApiOperation = z.infer<typeof ApiOperationSchema>;

const PublicApiEndpointSchema = z.object({
 group: z.string().min(1),
 methods: z.array(HttpMethodSchema).min(1),
 operations: z.array(ApiOperationSchema).min(1),
 path: z.string().startsWith("/api/v1/"),
 scope: IntegrationScopeSchema,
 summary: z.string().min(1),
});
export type PublicApiEndpoint = z.infer<typeof PublicApiEndpointSchema>;

const JsonValueTypeDefinition = `export type JsonValue =
 | null
 | boolean
 | number
 | string
 | JsonValue[]
 | { [key: string]: JsonValue };`;

function typePropertyName(value: string) {
 return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : JSON.stringify(value);
}

function typeFromJsonValue(value: JsonFieldValue, indentation: string): string {
 if (value === undefined) return "never";
 if (value === null) return "null";
 if (typeof value === "string") return "string";
 if (typeof value === "number") return "number";
 if (typeof value === "boolean") return "boolean";

 if (Array.isArray(value)) {
  const itemTypes = value.map((item) => typeFromJsonValue(item, indentation));
  const firstItemType = itemTypes[0];

  if (!firstItemType) return "JsonValue[]";
  if (itemTypes.every((itemType) => itemType === firstItemType)) {
   return `Array<${firstItemType}>`;
  }

  return "JsonValue[]";
 }

 const entries = Object.entries(value).filter(([, item]) => item !== undefined);
 if (entries.length === 0) return "{}";

 const nestedIndentation = `${indentation}  `;
 return `{
${entries
 .map(
  ([key, item]) =>
   `${nestedIndentation}${typePropertyName(key)}: ${typeFromJsonValue(item, nestedIndentation)};`,
 )
 .join("\n")}
${indentation}}`;
}

function typeFromJsonSample(sample: string) {
 return typeFromJsonValue(JsonValueSchema.parse(JSON.parse(sample)), "");
}

function typeNameSegment(value: string) {
 return value
  .replace(/[\[\]]/g, "")
  .split(/[^A-Za-z0-9]+/)
  .filter((part) => part.length > 0)
  .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
  .join("");
}

function operationTypeName(endpoint: PublicApiEndpoint, operation: PublicApiOperation) {
 const method = `${operation.method.slice(0, 1)}${operation.method.slice(1).toLowerCase()}`;
 const path = endpoint.path
  .split("/")
  .filter((segment) => segment.length > 0)
  .map(typeNameSegment)
  .join("");
 const scope = endpoint.scope
  .split(/[^A-Za-z0-9]+/)
  .map(typeNameSegment)
  .join("");

 return `${method}${path}${scope}`;
}

export function getOperationTypeScript(endpoint: PublicApiEndpoint, operation: PublicApiOperation) {
 const typeName = operationTypeName(endpoint, operation);
 const requestType = operation.requestBody ? typeFromJsonSample(operation.requestBody) : "never";
 const responseType = operation.responseBody
  ? typeFromJsonSample(operation.responseBody)
  : operation.responseContentType === "audio/mpeg"
    ? "Blob"
    : "void";

 return `${JsonValueTypeDefinition}

export type ${typeName}Request = ${requestType};

export type ${typeName}SuccessResponse = ${responseType};

export type ${typeName}Operation = {
  method: ${JSON.stringify(operation.method)};
  path: ${JSON.stringify(endpoint.path)};
  scope: ${JSON.stringify(endpoint.scope)};
  request: ${typeName}Request;
  response: ${typeName}SuccessResponse;
};`;
}

const ApiInventoryEntrySchema = z.object({
 currentPath: z.string().min(1),
 methods: z.array(HttpMethodSchema).min(1),
 source: ApiInventorySourceSchema,
 group: z.string().min(1),
 exposure: ApiExposureSchema,
 v1Path: z.string().nullable(),
 internalReason: z.string().nullable(),
});
export type ApiInventoryEntry = z.infer<typeof ApiInventoryEntrySchema>;

function endpoint(input: z.input<typeof PublicApiEndpointSchema>): PublicApiEndpoint {
 return PublicApiEndpointSchema.parse(input);
}

function inventoryEntry(input: z.input<typeof ApiInventoryEntrySchema>): ApiInventoryEntry {
 return ApiInventoryEntrySchema.parse(input);
}

export const publicV1Endpoints = [
 endpoint({
  group: "HanziHome đọc",
  methods: ["GET"],
  path: "/api/v1/hanzihome/catalog",
  scope: "content:read",
  summary: "Danh mục giáo trình hoặc bài học của một course.",
  operations: [
   {
    method: "GET",
    query: "includeLessons=true",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "catalog": { "courses": [] }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome đọc",
  methods: ["GET"],
  path: "/api/v1/hanzihome/lessons/[lessonId]",
  scope: "content:read",
  summary: "Chi tiết bài học HanziHome.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "lesson": { "id": "LESSON_ID", "titleZh": "你好" }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome đọc",
  methods: ["GET"],
  path: "/api/v1/hanzihome/lessons/[lessonId]/vocabulary",
  scope: "content:read",
  summary: "Từ vựng của bài học.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "resource": { "lessonId": "LESSON_ID", "items": [] }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome đọc",
  methods: ["GET"],
  path: "/api/v1/hanzihome/listening/lessons/[lessonId]",
  scope: "content:read",
  summary: "Gói luyện nghe theo bài.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "bundle": { "lessonId": "LESSON_ID", "items": [] }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome đọc",
  methods: ["GET"],
  path: "/api/v1/hanzihome/aggregate/[kind]",
  scope: "content:read",
  summary: "Tổng hợp nội dung theo loại với filter course/book/lesson.",
  operations: [
   {
    method: "GET",
    query: "courseId=COURSE_ID&bookId=BOOK_ID&lessonId=LESSON_ID&q=jinliang",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "items": []\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome đọc",
  methods: ["GET"],
  path: "/api/v1/hanzihome/search-index",
  scope: "content:read",
  summary: "Search index của HanziHome.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "items": [{ "id": "LESSON_ID", "title": "Bài 8" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["POST"],
  path: "/api/v1/hanzihome/content/mutations",
  scope: "content:write",
  summary: "Create, update, soft delete, restore hoặc reorder content canonical; không có purge.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "entityType": "vocab_item",\n  "operation": "update",\n  "entityId": "VOCAB_ITEM_ID",\n  "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",\n  "reason": "Đồng bộ từ CMS ngoài",\n  "changes": { "meaning": "ý nghĩa mới" }\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "VOCAB_ITEM_ID", "meaning": "ý nghĩa mới" }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["GET"],
  path: "/api/v1/hanzihome/content/deleted",
  scope: "content:read",
  summary: "Liệt kê content đã soft delete cho editor.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "kind": "canonical", "entityType": "lesson", "entityId": "LESSON_ID", "deletedAt": "2026-08-09T00:00:00.000Z" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["POST"],
  path: "/api/v1/hanzihome/content/vocab-children/bulk",
  scope: "content:read",
  summary: "List hoặc preview vocab child theo fingerprint.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "action": "preview",\n  "entityType": "vocab_example",\n  "scopeType": "lesson",\n  "scopeId": "LESSON_ID"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "preview": { "rowCount": 2, "fingerprint": "PREVIEW_FINGERPRINT" }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["POST"],
  path: "/api/v1/hanzihome/content/vocab-children/bulk",
  scope: "content:write",
  summary: "Soft delete hoặc restore vocab child theo fingerprint; không có purge.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "action": "mutate",\n  "entityType": "vocab_example",\n  "scopeType": "lesson",\n  "scopeId": "LESSON_ID",\n  "operation": "soft_delete",\n  "expectedCount": 2,\n  "expectedFingerprint": "PREVIEW_FINGERPRINT",\n  "reason": "Đồng bộ từ CMS ngoài"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "result": { "changedCount": 2 }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["PATCH"],
  path: "/api/v1/hanzihome/content/radicals/[entityId]",
  scope: "content:write",
  summary: "Cập nhật bộ thủ với optimistic concurrency.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody:
     '{\n  "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",\n  "reason": "Sửa nghĩa",\n  "changes": { "name_vi": "nhân" }\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "RADICAL_ID", "name_vi": "nhân" }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["PATCH"],
  path: "/api/v1/hanzihome/content/listening-items/[entityId]",
  scope: "content:write",
  summary: "Cập nhật listening item với optimistic concurrency.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody:
     '{\n  "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",\n  "reason": "Sửa transcript",\n  "changes": { "transcript": "你好" }\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "LISTENING_ITEM_ID" }\n}',
   },
  ],
 }),
 endpoint({
  group: "HanziHome content",
  methods: ["PATCH", "POST", "DELETE"],
  path: "/api/v1/hanzihome/content/sections/[entityId]/nodes/[nodeType]/[nodeId]",
  scope: "content:write",
  summary: "Cập nhật, soft delete hoặc restore node trong payload section.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody:
     '{\n  "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",\n  "reason": "Sửa node",\n  "nodePath": ["sections", 0, "items", 0],\n  "after": { "id": "NODE_ID", "text": "Nội dung mới" }\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "SECTION_ID" }\n}',
   },
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",\n  "reason": "Khôi phục node",\n  "changes": {}\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "SECTION_ID" }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody:
     '{\n  "expectedUpdatedAt": "2026-08-09T00:00:00.000Z",\n  "reason": "Ẩn node",\n  "changes": {}\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "SECTION_ID" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["GET"],
  path: "/api/v1/notes",
  scope: "notes:read",
  summary: "Liệt kê note thuộc owner của integration key.",
  operations: [
   {
    method: "GET",
    query: "folderId=FOLDER_ID&limit=50",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "id": "NOTE_ID", "title": "Ghi chú từ app ngoài", "tags": ["integration"] }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["POST"],
  path: "/api/v1/notes",
  scope: "notes:write",
  summary: "Tạo note thuộc owner của integration key.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "title": "Ghi chú từ app ngoài",\n  "tags": ["integration"],\n  "category": "general"\n}',
    responseStatus: 201,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "id": "NOTE_ID", "shortId": "note-short-id", "title": "Ghi chú từ app ngoài" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["GET"],
  path: "/api/v1/notes/[noteId]",
  scope: "notes:read",
  summary: "Đọc note thuộc owner.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "id": "NOTE_ID", "title": "Ghi chú từ app ngoài", "content": { "type": "doc", "content": [] } }\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["GET"],
  path: "/api/v1/notes/by-short-id/[shortId]",
  scope: "notes:read",
  summary: "Tìm note theo short ID thuộc owner của integration key.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "NOTE_ID", "shortId": "note-short-id" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["PATCH", "DELETE"],
  path: "/api/v1/notes/[noteId]",
  scope: "notes:write",
  summary: "Cập nhật hoặc xóa note thuộc owner.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody: '{\n  "title": "Tiêu đề đã sửa",\n  "tags": ["integration", "review"]\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "NOTE_ID", "title": "Tiêu đề đã sửa" }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "ok": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["GET"],
  path: "/api/v1/notes/search",
  scope: "notes:read",
  summary: "Tìm kiếm thư viện note của owner.",
  operations: [
   {
    method: "GET",
    query: "q=jinliang&limit=10",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "items": [{ "id": "NOTE_ID", "title": "尽量 jìnlìang" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["GET"],
  path: "/api/v1/notes/folders",
  scope: "notes:read",
  summary: "Liệt kê folder note của owner.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "items": [{ "id": "FOLDER_ID", "name": "Hán ngữ", "color": "purple" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["POST"],
  path: "/api/v1/notes/folders",
  scope: "notes:write",
  summary: "Tạo folder note của owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody: '{\n  "name": "Hán ngữ",\n  "color": "purple",\n  "position": 0\n}',
    responseStatus: 201,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "FOLDER_ID", "name": "Hán ngữ", "color": "purple" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["PATCH", "DELETE"],
  path: "/api/v1/notes/folders/[folderId]",
  scope: "notes:write",
  summary: "Cập nhật hoặc xóa folder note của owner.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody: '{\n  "name": "Hán ngữ Quyển 3",\n  "color": "purple"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "FOLDER_ID", "name": "Hán ngữ Quyển 3" }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "ok": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["GET"],
  path: "/api/v1/notes/lesson-links",
  scope: "notes:read",
  summary: "Đọc liên kết note với bài học HanziHome.",
  operations: [
   {
    method: "GET",
    query: "targetKey=LESSON_ID&relationType=main",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "noteId": "NOTE_ID", "targetType": "hanzihome_lesson", "targetKey": "LESSON_ID", "relationType": "main" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Ghi chú",
  methods: ["PUT"],
  path: "/api/v1/notes/lesson-links",
  scope: "notes:write",
  summary: "Thay thế liên kết note với bài học HanziHome.",
  operations: [
   {
    method: "PUT",
    query: null,
    requestBody:
     '{\n  "noteId": "NOTE_ID",\n  "targetType": "hanzihome_lesson",\n  "targetKey": "LESSON_ID",\n  "relationType": "main"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "noteId": "NOTE_ID", "targetKey": "LESSON_ID", "relationType": "main" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["GET"],
  path: "/api/v1/learning-state",
  scope: "learning:read",
  summary: "Đọc learning state của owner.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "state": {\n    "settings": { "lastLessonId": "LESSON_ID" },\n    "progress": { "vocab": {} },\n    "bookmarks": { "lessons": [] },\n    "reviewHistory": []\n  }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["PUT"],
  path: "/api/v1/learning-state",
  scope: "learning:write",
  summary: "Ghi learning state của owner.",
  operations: [
   {
    method: "PUT",
    query: null,
    requestBody:
     '{\n  "settings": { "lastLessonId": "LESSON_ID", "lastModule": "lessonText" },\n  "progress": { "vocab": {} },\n  "bookmarks": { "lessons": [] },\n  "reviewHistory": []\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "state": { "settings": { "lastLessonId": "LESSON_ID", "lastModule": "lessonText" }, "progress": {}, "bookmarks": {}, "reviewHistory": [] }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["GET"],
  path: "/api/v1/vocabulary/[hanzi]/progress",
  scope: "learning:read",
  summary: "Lấy tiến độ SRS và ghi chú cá nhân của một từ.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "hanzi": "尽量", "isFavorited": true, "personalNote": "Dùng với động từ" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["GET"],
  path: "/api/v1/vocabulary/progress",
  scope: "learning:read",
  summary: "Liệt kê các từ SRS đã lưu của owner, gồm tiến độ và dữ liệu từ điển liên kết.",
  operations: [
   {
    method: "GET",
    query: "limit=50&offset=0",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "hanzi": "尽量", "isFavorited": true }],\n  "nextOffset": null\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["POST"],
  path: "/api/v1/vocabulary/[hanzi]/srs",
  scope: "learning:write",
  summary: "Lưu từ vào SRS của owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "vocab": {\n    "hanzi": "尽量",\n    "pinyin": "jǐnliàng",\n    "sino_vietnamese": "tận lượng",\n    "meaning": "cố gắng hết mức có thể",\n    "ai_analysis": {}\n  },\n  "personalNote": "Dùng với động từ",\n  "personalNoteMode": "important"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "vocabId": "VOCAB_ID", "dictionaryId": "DICTIONARY_ID", "isFavorited": true }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["POST"],
  path: "/api/v1/vocabulary/[hanzi]/track",
  scope: "learning:write",
  summary: "Ghi nhận lượt tra từ cho owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "vocab": {\n    "hanzi": "尽量",\n    "pinyin": "jǐnliàng",\n    "meaning": "cố gắng hết mức có thể",\n    "ai_analysis": {}\n  }\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "vocabId": "VOCAB_ID", "isFavorited": false }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["GET"],
  path: "/api/v1/hanzihome/lessons/[lessonId]/annotations",
  scope: "learning:read",
  summary: "Liệt kê annotation và note liên kết theo bài học.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "id": "ANNOTATION_ID", "nodeId": "NODE_ID", "selectedText": "尽量", "noteText": "Ghi chú" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["POST"],
  path: "/api/v1/hanzihome/lessons/[lessonId]/annotations",
  scope: "learning:write",
  summary: "Tạo annotation và note liên kết theo bài học.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "nodeType": "lesson_text",\n  "nodeId": "NODE_ID",\n  "startOffset": 0,\n  "endOffset": 2,\n  "selectedText": "尽量",\n  "prefixText": "",\n  "suffixText": "地",\n  "noteText": "Ghi chú"\n}',
    responseStatus: 201,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "ANNOTATION_ID", "selectedText": "尽量" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["PATCH", "DELETE"],
  path: "/api/v1/hanzihome/annotations/[annotationId]",
  scope: "learning:write",
  summary: "Cập nhật note annotation hoặc xóa annotation của owner.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody: '{\n  "noteText": "Ghi chú đã sửa"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "ANNOTATION_ID", "noteText": "Ghi chú đã sửa" }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "ok": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["GET"],
  path: "/api/v1/hanzihome/memory-tips",
  scope: "learning:read",
  summary: "Liệt kê memory tip cá nhân.",
  operations: [
   {
    method: "GET",
    query: "limit=50",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "id": "TIP_ID", "tipType": "vocab", "title": "尽量", "isPinned": false }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["POST"],
  path: "/api/v1/hanzihome/memory-tips",
  scope: "learning:write",
  summary: "Tạo memory tip cá nhân.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "tipType": "vocab",\n  "title": "尽量",\n  "body": "Dùng để nói cố gắng ở mức tối đa.",\n  "sourceType": "custom",\n  "tags": ["HSK"],\n  "weight": 1,\n  "isPinned": false\n}',
    responseStatus: 201,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "TIP_ID", "title": "尽量", "isArchived": false }\n}',
   },
  ],
 }),
 endpoint({
  group: "Học tập",
  methods: ["PATCH", "DELETE"],
  path: "/api/v1/hanzihome/memory-tips/[tipId]",
  scope: "learning:write",
  summary: "Cập nhật hoặc xóa memory tip cá nhân.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody: '{\n  "isPinned": true,\n  "weight": 2\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "TIP_ID", "isPinned": true, "weight": 2 }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "ok": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["GET"],
  path: "/api/v1/hanzihome/html-artifacts",
  scope: "artifacts:read",
  summary: "Liệt kê HTML artifact của owner.",
  operations: [
   {
    method: "GET",
    query: "limit=100",
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "items": [{ "id": "ARTIFACT_ID", "title": "Luyện HSK", "artifactType": "practice_page" }],\n  "folders": []\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["POST"],
  path: "/api/v1/hanzihome/html-artifacts",
  scope: "artifacts:write",
  summary: "Tạo HTML artifact của owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "title": "Luyện HSK",\n  "artifactType": "practice_page",\n  "tags": ["HSK"],\n  "html": "<main>你好</main>"\n}',
    responseStatus: 201,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "id": "ARTIFACT_ID", "title": "Luyện HSK", "artifactType": "practice_page", "html": "<main>你好</main>" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["GET"],
  path: "/api/v1/hanzihome/html-artifacts/[artifactId]",
  scope: "artifacts:read",
  summary: "Đọc HTML artifact của owner.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "item": { "id": "ARTIFACT_ID", "title": "Luyện HSK", "artifactType": "practice_page", "html": "<main>你好</main>" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["PATCH", "DELETE"],
  path: "/api/v1/hanzihome/html-artifacts/[artifactId]",
  scope: "artifacts:write",
  summary: "Cập nhật hoặc xóa HTML artifact của owner.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody: '{\n  "title": "Luyện HSK đã sửa",\n  "tags": ["HSK", "review"]\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "ARTIFACT_ID", "title": "Luyện HSK đã sửa" }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "ok": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["GET"],
  path: "/api/v1/hanzihome/html-artifacts/folders",
  scope: "artifacts:read",
  summary: "Liệt kê folder cho HTML artifact.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "items": [{ "id": "FOLDER_ID", "name": "Bài luyện", "color": "blue" }]\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["POST"],
  path: "/api/v1/hanzihome/html-artifacts/folders",
  scope: "artifacts:write",
  summary: "Tạo folder cho HTML artifact.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody: '{\n  "name": "Bài luyện",\n  "color": "blue",\n  "position": 0\n}',
    responseStatus: 201,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "FOLDER_ID", "name": "Bài luyện", "color": "blue" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["PATCH", "DELETE"],
  path: "/api/v1/hanzihome/html-artifacts/folders/[folderId]",
  scope: "artifacts:write",
  summary: "Cập nhật hoặc xóa folder HTML artifact.",
  operations: [
   {
    method: "PATCH",
    query: null,
    requestBody: '{\n  "name": "Bài luyện HSK"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "item": { "id": "FOLDER_ID", "name": "Bài luyện HSK" }\n}',
   },
   {
    method: "DELETE",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "ok": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["GET"],
  path: "/api/v1/hanzihome/html-artifacts/[artifactId]/runtime-state",
  scope: "artifacts:read",
  summary: "Đọc runtime state của HTML artifact.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "state": { "currentQuestion": "2" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tệp HTML",
  methods: ["PUT"],
  path: "/api/v1/hanzihome/html-artifacts/[artifactId]/runtime-state",
  scope: "artifacts:write",
  summary: "Ghi runtime state của HTML artifact.",
  operations: [
   {
    method: "PUT",
    query: null,
    requestBody: '{\n  "state": { "currentQuestion": "2" }\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody: '{\n  "state": { "currentQuestion": "2" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["POST"],
  path: "/api/v1/lookup",
  scope: "ai:generate",
  summary: "Tra cứu từ/câu theo flow lookup chuẩn chỉ bằng BYOK của owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody: '{\n  "text": "尽量",\n  "type": "word"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "cached": false,\n  "data": { "hanzi": "尽量", "pinyin": "jǐnliàng", "meaning": "cố gắng hết mức có thể", "analysis": {} }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["POST"],
  path: "/api/v1/lookup/basic",
  scope: "lookup:read",
  summary: "Tra cứu cơ bản không yêu cầu provider credential platform.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody: '{\n  "text": "尽量",\n  "lessonId": "LESSON_ID"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "cached": true,\n  "source": "lesson_vocab",\n  "data": { "hanzi": "尽量", "pinyin": "jǐnliàng", "meaning": "cố gắng hết mức có thể", "analysis": {} }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["POST"],
  path: "/api/v1/lookup/deep",
  scope: "ai:generate",
  summary: "Tra cứu sâu chỉ bằng BYOK của chính owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody: '{\n  "text": "尽量"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "cached": false,\n  "data": { "hanzi": "尽量", "pinyin": "jǐnliàng", "meaning": "cố gắng hết mức có thể", "analysis": { "mnemonic_story": "..." } }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["POST"],
  path: "/api/v1/ai/generate-vocab",
  scope: "ai:generate",
  summary: "Tạo phân tích từ vựng chỉ bằng BYOK của owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody: '{\n  "hanzi": "尽量"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "cached": false,\n  "data": { "hanzi": "尽量", "pinyin": "jǐnliàng", "meaning": "cố gắng hết mức có thể" }\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["POST"],
  path: "/api/v1/editor/context",
  scope: "ai:generate",
  summary: "Sinh context editor chỉ bằng BYOK của owner.",
  operations: [
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "selection": "尽量",\n  "contextSentence": "请尽量早点来。",\n  "mode": "word"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "mode": "word",\n  "selection": "尽量",\n  "entry": { "hanzi": "尽量", "pinyin": "jǐnliàng", "meaning": "cố gắng hết mức có thể" },\n  "found": true\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["GET"],
  path: "/api/v1/settings/ai-prompts",
  scope: "ai-settings:read",
  summary: "Đọc prompt/model; không quản lý provider API key.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "wordLookupPrompt": "...",\n  "sentenceLookupPrompt": "...",\n  "geminiModel": "gemini-2.5-flash"\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["PUT"],
  path: "/api/v1/settings/ai-prompts",
  scope: "ai-settings:write",
  summary: "Lưu prompt/model; không quản lý provider API key.",
  operations: [
   {
    method: "PUT",
    query: null,
    requestBody:
     '{\n  "wordLookupPrompt": "Giải thích từ tiếng Trung bằng tiếng Việt.",\n  "sentenceLookupPrompt": "Dịch và giải thích câu tiếng Trung.",\n  "geminiModel": "gemini-2.5-flash"\n}',
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '{\n  "wordLookupPrompt": "Giải thích từ tiếng Trung bằng tiếng Việt.",\n  "sentenceLookupPrompt": "Dịch và giải thích câu tiếng Trung.",\n  "geminiModel": "gemini-2.5-flash"\n}',
   },
  ],
 }),
 endpoint({
  group: "Tra cứu và AI",
  methods: ["GET", "POST"],
  path: "/api/v1/tts",
  scope: "tts:generate",
  summary: "Lấy giọng Mandarin hoặc tạo audio, giới hạn 10 request/key/phút.",
  operations: [
   {
    method: "GET",
    query: null,
    requestBody: null,
    responseStatus: 200,
    responseContentType: "application/json",
    responseBody:
     '[\n  { "name": "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)", "shortName": "zh-CN-XiaoxiaoNeural", "gender": "Female", "locale": "zh-CN" }\n]',
   },
   {
    method: "POST",
    query: null,
    requestBody:
     '{\n  "text": "你好，欢迎学习汉语。",\n  "voice": "zh-CN-XiaoxiaoNeural",\n  "rate": 1\n}',
    responseStatus: 200,
    responseContentType: "audio/mpeg",
    responseBody: null,
   },
  ],
 }),
].map((item) => PublicApiEndpointSchema.parse(item));

export function filterPublicApiEndpoints({
 feature,
 method,
 scope,
 searchQuery,
}: {
 feature: string;
 method: string;
 scope: string;
 searchQuery: string;
}) {
 const normalizedSearch = searchQuery.trim().toLowerCase();

 return publicV1Endpoints.filter((endpoint) => {
  if (feature !== "all" && endpoint.group !== feature) return false;
  if (method !== "all" && !endpoint.methods.some((item) => item === method)) return false;
  if (scope !== "all" && endpoint.scope !== scope) return false;
  if (!normalizedSearch) return true;

  return [endpoint.group, endpoint.path, endpoint.scope, endpoint.summary, ...endpoint.methods]
   .join(" ")
   .toLowerCase()
   .includes(normalizedSearch);
 });
}

export const currentApiInventory = [
 inventoryEntry({
  currentPath: "/api/ai/generate-vocab",
  methods: ["POST"],
  source: "route",
  group: "AI",
  exposure: "public-v1",
  v1Path: "/api/v1/ai/generate-vocab",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/editor/context",
  methods: ["POST"],
  source: "route",
  group: "AI",
  exposure: "public-v1",
  v1Path: "/api/v1/editor/context",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/aggregate/[kind]",
  methods: ["GET"],
  source: "route",
  group: "HanziHome đọc",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/aggregate/[kind]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/catalog",
  methods: ["GET"],
  source: "route",
  group: "HanziHome đọc",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/catalog",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/books/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/books/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/books/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/books",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/courses/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/courses/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/courses/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/courses",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/deleted/purge",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "internal-only",
  v1Path: null,
  internalReason: "Permanent purge is intentionally unavailable to integration keys.",
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/deleted",
  methods: ["GET"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/deleted",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-detail-sections/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-detail-sections/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-detail-sections/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-detail-sections",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-examples/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-examples/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-examples/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-examples",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-points/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-points/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-points/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/grammar-points",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lesson-texts/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lesson-texts/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lesson-texts",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lessons/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lessons/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lessons/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/lessons",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/listening-items/[entityId]",
  methods: ["PATCH"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/listening-items/[entityId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/radicals/[entityId]",
  methods: ["PATCH"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/radicals/[entityId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/sections/[entityId]/nodes/[nodeType]/[nodeId]",
  methods: ["PATCH", "DELETE", "POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/sections/[entityId]/nodes/[nodeType]/[nodeId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/sections/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/sections/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/sections/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/sections",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-children/bulk",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/vocab-children/bulk",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-detail-sections/[entityId]/lines/[lineIndex]",
  methods: ["PATCH"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-detail-sections/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-detail-sections/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-detail-sections/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-detail-sections",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-examples/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-examples/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-examples/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-examples",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-items/[entityId]/reorder",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-items/[entityId]/restore",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-items/[entityId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/content/vocab-items",
  methods: ["POST"],
  source: "route",
  group: "HanziHome content",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/content/mutations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/html-artifacts/[artifactId]",
  methods: ["GET", "PATCH", "DELETE"],
  source: "route",
  group: "Tệp HTML",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/html-artifacts/[artifactId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/html-artifacts/[artifactId]/runtime-state",
  methods: ["GET", "PUT"],
  source: "route",
  group: "Tệp HTML",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/html-artifacts/[artifactId]/runtime-state",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/html-artifacts/folders/[folderId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "Tệp HTML",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/html-artifacts/folders/[folderId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/html-artifacts/folders",
  methods: ["GET", "POST"],
  source: "route",
  group: "Tệp HTML",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/html-artifacts/folders",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/html-artifacts/publish",
  methods: ["GET", "POST"],
  source: "route",
  group: "Tệp HTML",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Legacy static publish accepts a separate publish token and is not part of the owner-scoped v1 API.",
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/html-artifacts",
  methods: ["GET", "POST"],
  source: "route",
  group: "Tệp HTML",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/html-artifacts",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/lessons/[lessonId]",
  methods: ["GET"],
  source: "route",
  group: "HanziHome đọc",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/lessons/[lessonId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/lessons/[lessonId]/vocabulary",
  methods: ["GET"],
  source: "route",
  group: "HanziHome đọc",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/lessons/[lessonId]/vocabulary",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/listening/lessons/[lessonId]",
  methods: ["GET"],
  source: "route",
  group: "HanziHome đọc",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/listening/lessons/[lessonId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/memory-tips/[tipId]",
  methods: ["PATCH", "DELETE"],
  source: "route",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/memory-tips/[tipId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/memory-tips",
  methods: ["GET", "POST"],
  source: "route",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/memory-tips",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/search-index",
  methods: ["GET"],
  source: "route",
  group: "HanziHome đọc",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/search-index",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/learning-state",
  methods: ["GET", "PUT"],
  source: "route",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/learning-state",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/lookup/basic",
  methods: ["POST"],
  source: "route",
  group: "Tra cứu",
  exposure: "public-v1",
  v1Path: "/api/v1/lookup/basic",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/lookup/deep",
  methods: ["POST"],
  source: "route",
  group: "Tra cứu",
  exposure: "public-v1",
  v1Path: "/api/v1/lookup/deep",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/lookup",
  methods: ["POST"],
  source: "route",
  group: "Tra cứu",
  exposure: "public-v1",
  v1Path: "/api/v1/lookup",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/notes/search",
  methods: ["GET"],
  source: "route",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes/search",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/settings/ai-prompts",
  methods: ["GET", "PUT"],
  source: "route",
  group: "AI",
  exposure: "public-v1",
  v1Path: "/api/v1/settings/ai-prompts",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "/api/settings/api-keys",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  source: "route",
  group: "AI",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Provider credentials stay inside the signed-in app and are never exposed to integration keys.",
 }),
 inventoryEntry({
  currentPath: "/api/tts",
  methods: ["GET", "POST"],
  source: "route",
  group: "TTS",
  exposure: "public-v1",
  v1Path: "/api/v1/tts",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:notes-library",
  methods: ["GET", "POST"],
  source: "client-flow",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:notes-library:note-detail",
  methods: ["GET", "PATCH", "DELETE"],
  source: "client-flow",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes/[noteId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:note-short-id",
  methods: ["GET"],
  source: "client-flow",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes/by-short-id/[shortId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:notes-library:folders",
  methods: ["GET", "POST"],
  source: "client-flow",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes/folders",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:notes-library:folder-detail",
  methods: ["PATCH", "DELETE"],
  source: "client-flow",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes/folders/[folderId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:notes-library:lesson-links",
  methods: ["GET", "PUT"],
  source: "client-flow",
  group: "Ghi chú",
  exposure: "public-v1",
  v1Path: "/api/v1/notes/lesson-links",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:lesson-text-annotations",
  methods: ["GET", "POST"],
  source: "client-flow",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/lessons/[lessonId]/annotations",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:lesson-text-annotations:detail",
  methods: ["PATCH", "DELETE"],
  source: "client-flow",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/hanzihome/annotations/[annotationId]",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:vocabulary-srs-progress",
  methods: ["GET"],
  source: "client-flow",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/vocabulary/[hanzi]/progress",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:vocabulary-srs-progress:save",
  methods: ["POST"],
  source: "client-flow",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/vocabulary/[hanzi]/srs",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:dictionary-srs-list",
  methods: ["GET"],
  source: "client-flow",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/vocabulary/progress",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:vocabulary-srs-progress:track",
  methods: ["POST"],
  source: "client-flow",
  group: "Học tập",
  exposure: "public-v1",
  v1Path: "/api/v1/vocabulary/[hanzi]/track",
  internalReason: null,
 }),
 inventoryEntry({
  currentPath: "direct:hanzihome-content-role",
  methods: ["GET"],
  source: "client-flow",
  group: "HanziHome content",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Editor capability is derived in the signed-in UI; every v1 mutation independently authorizes the key owner.",
 }),
].map((item) => ApiInventoryEntrySchema.parse(item));
