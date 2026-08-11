"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
 ChevronDown,
 Copy,
 Filter,
 KeyRound,
 Play,
 PlugZap,
 Search,
 SearchX,
 ShieldCheck,
 Terminal,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { focusRingClassName } from "@/components/ui/focus-ring";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

import {
 currentApiInventory,
 filterPublicApiEndpoints,
 getOperationTypeScript,
 publicV1Endpoints,
 type PublicApiEndpoint,
 type PublicApiOperation,
} from "./api-registry";

type CopyAction = (text: string, successMessage: string) => Promise<void>;

const apiFeatures = Array.from(new Set(publicV1Endpoints.map((endpoint) => endpoint.group)));
const apiMethods = Array.from(new Set(publicV1Endpoints.flatMap((endpoint) => endpoint.methods)));
const apiScopes = Array.from(new Set(publicV1Endpoints.map((endpoint) => endpoint.scope)));

function curlForOperation(endpoint: PublicApiEndpoint, operation: PublicApiOperation) {
 const query = operation.query ? `?${operation.query}` : "";
 const requestBody = operation.requestBody
  ? ` \\
  --header "Content-Type: application/json" \\
  --data '${operation.requestBody}'`
  : "";
 const accept = operation.responseContentType === "audio/mpeg" ? "audio/mpeg" : "application/json";

 return `curl --request ${operation.method} \\
  --url "$HANZIHOME_API_BASE${endpoint.path.replace(/\[[^\]]+\]/g, "REPLACE_ME")}${query}" \\
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \\
  --header "Accept: ${accept}"${requestBody}`;
}

function methodLabel(operations: PublicApiOperation[]) {
 return operations.map((operation) => operation.method).join(" · ");
}

function demoOutputForOperation(operation: PublicApiOperation) {
 if (operation.responseBody) return operation.responseBody;

 return `{
  "status": ${operation.responseStatus},
  "contentType": ${JSON.stringify(operation.responseContentType)},
  "body": "[binary stream]"
}`;
}

function ApiCodeBlock({
 label,
 value,
 copyLabel,
 copyMessage,
 onCopy,
}: {
 label: string;
 value: string;
 copyLabel: string;
 copyMessage: string;
 onCopy: CopyAction;
}) {
 return (
  <div className="grid gap-1.5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <Typography as="p" variant="overline" tone="muted">
     {label}
    </Typography>
    <Button variant="outline" size="compact" onClick={() => void onCopy(value, copyMessage)}>
     <Copy />
     {copyLabel}
    </Button>
   </div>
   <Card variant="subtle" padding="sm" className="overflow-x-auto scrollbar-soft">
    <Typography as="pre" variant="code" tone="default" wrapping="preWrap">
     {value}
    </Typography>
   </Card>
  </div>
 );
}

function ApiOperationCard({
 endpoint,
 operation,
 onCopy,
}: {
 endpoint: PublicApiEndpoint;
 operation: PublicApiOperation;
 onCopy: CopyAction;
}) {
 const [demoVisible, setDemoVisible] = useState(false);
 const curl = curlForOperation(endpoint, operation);
 const typeScript = getOperationTypeScript(endpoint, operation);
 const demoOutput = demoOutputForOperation(operation);

 return (
  <Card variant="default" padding="md" className="grid gap-4">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="info">{operation.method}</Badge>
     <Badge variant="success">{operation.responseStatus}</Badge>
     <Typography as="span" variant="caption" tone="muted">
      {operation.responseContentType}
     </Typography>
    </div>
    <Button
     variant="outline"
     size="compact"
     onClick={() => void onCopy(curl, `Đã copy curl ${operation.method} cho ${endpoint.path}`)}
    >
     <Copy />
     Copy curl
    </Button>
   </div>

   {operation.query ? (
    <ApiCodeBlock
     label="Query mẫu"
     value={operation.query}
     copyLabel="Copy query"
     copyMessage={`Đã copy query ${operation.method} cho ${endpoint.path}`}
     onCopy={onCopy}
    />
   ) : null}

   <div className="grid gap-4 xl:grid-cols-2">
    {operation.requestBody ? (
     <ApiCodeBlock
      label="Expected request body"
      value={operation.requestBody}
      copyLabel="Copy request"
      copyMessage={`Đã copy request mẫu ${operation.method} cho ${endpoint.path}`}
      onCopy={onCopy}
     />
    ) : (
     <div className="grid content-start gap-1.5">
      <Typography as="p" variant="overline" tone="muted">
       Expected request body
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Không có JSON request body.
      </Typography>
     </div>
    )}

    {operation.responseBody ? (
     <ApiCodeBlock
      label="Sample response body"
      value={operation.responseBody}
      copyLabel="Copy response"
      copyMessage={`Đã copy response mẫu ${operation.method} cho ${endpoint.path}`}
      onCopy={onCopy}
     />
    ) : (
     <div className="grid content-start gap-1.5">
      <Typography as="p" variant="overline" tone="muted">
       Sample response body
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Response body là audio stream {operation.responseContentType}.
      </Typography>
     </div>
    )}
   </div>

   <ApiCodeBlock
    label="Types TypeScript"
    value={typeScript}
    copyLabel="Copy type"
    copyMessage={`Đã copy type ${operation.method} cho ${endpoint.path}`}
    onCopy={onCopy}
   />

   <div className="grid gap-3 border-t border-border-default pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div className="grid gap-0.5">
      <Typography as="p" variant="label" tone="default" weight="bold">
       Demo response
      </Typography>
      <Typography as="p" variant="caption" tone="muted">
       Chạy hoàn toàn tại trình duyệt từ sample contract; không gửi request và không dùng key.
      </Typography>
     </div>
     <Button
      variant={demoVisible ? "active" : "outline"}
      size="compact"
      aria-pressed={demoVisible}
      onClick={() => {
       setDemoVisible((visible) => !visible);
       if (!demoVisible) toast.success("Đã chạy demo local — không có request nào được gửi.");
      }}
     >
      <Play />
      {demoVisible ? "Ẩn demo" : "Chạy demo"}
     </Button>
    </div>

    {demoVisible ? (
     <Card variant="subtle" padding="sm" className="grid gap-2" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <Badge variant="success">{operation.responseStatus}</Badge>
       <Button
        variant="outline"
        size="compact"
        onClick={() =>
         void onCopy(demoOutput, `Đã copy demo ${operation.method} cho ${endpoint.path}`)
        }
       >
        <Copy />
        Copy demo
       </Button>
      </div>
      <Typography as="pre" variant="code" tone="default" wrapping="preWrap">
       {demoOutput}
      </Typography>
     </Card>
    ) : null}
   </div>
  </Card>
 );
}

function ApiEndpointCard({
 endpoint,
 operations,
 onCopy,
}: {
 endpoint: PublicApiEndpoint;
 operations: PublicApiOperation[];
 onCopy: CopyAction;
}) {
 return (
  <Card variant="default" padding="none" className="overflow-hidden">
   <details className="group">
    <summary
     className={`flex cursor-pointer list-none items-start justify-between gap-3 p-4 marker:content-none sm:p-5 [&::-webkit-details-marker]:hidden ${focusRingClassName}`}
    >
     <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant="info">{methodLabel(operations)}</Badge>
       <Badge variant="accent">{endpoint.scope}</Badge>
      </div>
      <Typography as="h4" variant="cardTitle" tone="default" weight="black" wrapping="breakAll">
       {endpoint.path}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary">
       {endpoint.summary}
      </Typography>
     </div>
     <div className="flex shrink-0 items-center gap-2">
      <Typography as="span" variant="caption" tone="muted" className="hidden sm:inline">
       Chi tiết
      </Typography>
      <ChevronDown
       aria-hidden="true"
       className="size-4 text-text-muted transition-transform group-open:rotate-180"
      />
     </div>
    </summary>

    <div className="grid gap-4 border-t border-border-default bg-bg-subtle/45 p-4 sm:p-5">
     <Typography as="p" variant="caption" tone="muted">
      Path parameter dùng giá trị thay thế trong curl. TypeScript được suy ra từ JSON sample; mảng
      rỗng giữ kiểu{" "}
      <Typography as="code" variant="code">
       JsonValue[]
      </Typography>{" "}
      cho đến khi contract server có item schema cụ thể.
     </Typography>

     <div className="grid gap-3">
      {operations.map((operation) => (
       <ApiOperationCard
        key={`${endpoint.path}-${endpoint.scope}-${operation.method}`}
        endpoint={endpoint}
        operation={operation}
        onCopy={onCopy}
       />
      ))}
     </div>
    </div>
   </details>
  </Card>
 );
}

export function DeveloperApiPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [featureFilter, setFeatureFilter] = useState("all");
 const [methodFilter, setMethodFilter] = useState("all");
 const [scopeFilter, setScopeFilter] = useState("all");
 const deferredSearchQuery = useDeferredValue(searchQuery);

 async function copyText(text: string, successMessage: string) {
  try {
   await navigator.clipboard.writeText(text);
   toast.success(successMessage);
  } catch {
   toast.error("Không copy được. Chọn text rồi copy thủ công.");
  }
 }

 const filteredEndpoints = useMemo(
  () =>
   filterPublicApiEndpoints({
    feature: featureFilter,
    method: methodFilter,
    scope: scopeFilter,
    searchQuery: deferredSearchQuery,
   }),
  [deferredSearchQuery, featureFilter, methodFilter, scopeFilter],
 );
 const visibleFeatureGroups = apiFeatures
  .map((feature) => ({
   feature,
   endpoints: filteredEndpoints
    .filter((endpoint) => endpoint.group === feature)
    .map((endpoint) => ({
     endpoint,
     operations: endpoint.operations.filter(
      (operation) => methodFilter === "all" || operation.method === methodFilter,
     ),
    }))
    .filter((endpoint) => endpoint.operations.length > 0),
  }))
  .filter((group) => group.endpoints.length > 0);
 const filteredEndpointCount = visibleFeatureGroups.reduce(
  (count, group) => count + group.endpoints.length,
  0,
 );
 const filteredOperationCount = visibleFeatureGroups.reduce(
  (count, group) =>
   count +
   group.endpoints.reduce(
    (operationCount, endpoint) => operationCount + endpoint.operations.length,
    0,
   ),
  0,
 );
 const hasActiveFilters =
  searchQuery.length > 0 ||
  featureFilter !== "all" ||
  methodFilter !== "all" ||
  scopeFilter !== "all";
 const publicInventoryCount = currentApiInventory.filter(
  (entry) => entry.exposure === "public-v1",
 ).length;
 const internalInventoryCount = currentApiInventory.length - publicInventoryCount;

 function resetFilters() {
  setSearchQuery("");
  setFeatureFilter("all");
  setMethodFilter("all");
  setScopeFilter("all");
 }

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5">
    <PageHeader
     title="API & tích hợp"
     description="Boundary server-to-server cho curl, Postman và service riêng; không dùng browser session hay copy Supabase access token."
    />

    <Card variant="section" padding="lg" className="grid gap-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid min-w-0 gap-1">
       <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="text-success-text" />
        <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
         API v1 dùng integration key có thể revoke
        </Typography>
       </div>
       <Typography as="p" variant="bodySmall" tone="secondary">
        Mỗi key có owner và scope riêng. API v1 chỉ nhận Bearer integration key; cookie đăng nhập và
        Supabase user token không mở quyền cho route v1.
       </Typography>
      </div>
      <Badge variant="warning">Chờ validation branch</Badge>
     </div>
     <Separator />
     <div className="grid gap-3 sm:grid-cols-3">
      <Typography as="p" variant="caption" tone="muted">
       <Typography as="span" variant="label" tone="default" weight="bold">
        Least privilege
       </Typography>
       <br />
       Cấp scope nhỏ nhất cho từng integration; mutation HanziHome còn kiểm tra editor/admin role.
      </Typography>
      <Typography as="p" variant="caption" tone="muted">
       <Typography as="span" variant="label" tone="default" weight="bold">
        BYOK cho AI
       </Typography>
       <br />
       Deep lookup và generation chỉ dùng credential AI của chính owner, không dùng platform
       fallback.
      </Typography>
      <Typography as="p" variant="caption" tone="muted">
       <Typography as="span" variant="label" tone="default" weight="bold">
        TTS được giới hạn
       </Typography>
       <br />
       Mỗi integration key có tối đa 10 yêu cầu audio mỗi phút và nhận 429 khi vượt ngưỡng.
      </Typography>
     </div>
    </Card>

    <Card variant="default" padding="lg" className="grid gap-4">
     <div className="flex items-center gap-2">
      <KeyRound className="text-accent-text" />
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
       Cách dùng
      </Typography>
     </div>
     <div className="grid gap-3 md:grid-cols-3">
      <Typography as="p" variant="bodySmall" tone="secondary">
       <Typography as="span" variant="label" tone="default" weight="bold">
        1. Tạo key
       </Typography>
       <br />
       Chọn label và scope đúng nhu cầu. Raw key chỉ được reveal một lần; lưu ngay vào secret store.
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary">
       <Typography as="span" variant="label" tone="default" weight="bold">
        2. Đặt biến môi trường
       </Typography>
       <br />
       Dùng{" "}
       <Typography as="code" variant="code">
        HANZIHOME_API_BASE
       </Typography>{" "}
       và{" "}
       <Typography as="code" variant="code">
        HANZIHOME_INTEGRATION_KEY
       </Typography>{" "}
       ở backend hoặc Postman secret variable.
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary">
       <Typography as="span" variant="label" tone="default" weight="bold">
        3. Gọi v1 và rotate
       </Typography>
       <br />
       Gửi Bearer key, tôn trọng 401/403/409/429, tạo key mới trước khi revoke key cũ.
      </Typography>
     </div>
     <Card variant="subtle" padding="sm" className="overflow-x-auto scrollbar-soft">
      <Typography as="pre" variant="code" tone="default" wrapping="preWrap">
       {`export HANZIHOME_API_BASE="https://your-hanzihome.example"
export HANZIHOME_INTEGRATION_KEY="hhz_live_replace_me"

curl --request GET \\
  --url "$HANZIHOME_API_BASE/api/v1/hanzihome/catalog" \\
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY"`}
      </Typography>
     </Card>
     <Typography as="p" variant="caption" tone="muted">
      Hướng dẫn đầy đủ, scope, Postman setup và cách xử lý lỗi nằm trong{" "}
      <Typography as="code" variant="code">
       docs/developer-api.md
      </Typography>
      . Browser cross-origin không được bật cho boundary này.
     </Typography>
    </Card>

    <section className="grid gap-3" aria-labelledby="public-api-title">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
       <Terminal className="text-accent-text" />
       <Typography
        as="h2"
        id="public-api-title"
        variant="sectionTitle"
        tone="default"
        weight="black"
       >
        Public API v1
       </Typography>
      </div>
      <Badge variant="success">{publicV1Endpoints.length} endpoint groups</Badge>
     </div>

     <Typography as="p" variant="bodySmall" tone="secondary">
      Endpoint được chia theo feature. Search quét path, mô tả và scope; filter không làm thay đổi
      contract hay gửi request ra ngoài.
     </Typography>

     <Card variant="subtle" padding="md" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
       <div className="flex items-center gap-2">
        <Filter className="text-accent-text" />
        <Typography as="h3" variant="cardTitle" tone="default" weight="black">
         Tìm và lọc endpoint
        </Typography>
       </div>
       <Button variant="ghost" size="compact" disabled={!hasActiveFilters} onClick={resetFilters}>
        Xóa bộ lọc
       </Button>
      </div>

      <Label htmlFor="api-endpoint-search" variant="label" className="grid gap-1.5">
       <Typography as="span" variant="caption" tone="muted">
        Search
       </Typography>
       <div className="relative">
        <Search
         aria-hidden="true"
         className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        />
        <Input
         id="api-endpoint-search"
         value={searchQuery}
         onChange={(event) => setSearchQuery(event.target.value)}
         placeholder="Ví dụ: note, content:write, /tts…"
         adornment="start"
         density="search"
         className="w-full"
        />
        {searchQuery ? (
         <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Xóa tìm kiếm API"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => setSearchQuery("")}
         >
          <SearchX />
         </Button>
        ) : null}
       </div>
      </Label>

      <div className="grid gap-3 md:grid-cols-2">
       <Label htmlFor="api-method-filter" variant="label" className="grid gap-1.5">
        <Typography as="span" variant="caption" tone="muted">
         HTTP method
        </Typography>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
         <SelectTrigger id="api-method-filter" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="all">Mọi method</SelectItem>
          {apiMethods.map((method) => (
           <SelectItem key={method} value={method}>
            {method}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </Label>

       <Label htmlFor="api-scope-filter" variant="label" className="grid gap-1.5">
        <Typography as="span" variant="caption" tone="muted">
         Required scope
        </Typography>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
         <SelectTrigger id="api-scope-filter" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="all">Mọi scope</SelectItem>
          {apiScopes.map((scope) => (
           <SelectItem key={scope} value={scope}>
            {scope}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </Label>
      </div>

      <div className="grid gap-2">
       <Typography as="span" variant="caption" tone="muted">
        Theo feature
       </Typography>
       <div className="flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-soft">
        <Chip
         variant={featureFilter === "all" ? "accent" : "outline"}
         size="sm"
         pressed={featureFilter === "all"}
         onClick={() => setFeatureFilter("all")}
        >
         Tất cả ({publicV1Endpoints.length})
        </Chip>
        {apiFeatures.map((feature) => {
         const count = publicV1Endpoints.filter((endpoint) => endpoint.group === feature).length;
         const active = featureFilter === feature;

         return (
          <Chip
           key={feature}
           variant={active ? "accent" : "outline"}
           size="sm"
           pressed={active}
           onClick={() => setFeatureFilter(feature)}
          >
           {feature} ({count})
          </Chip>
         );
        })}
       </div>
      </div>
     </Card>

     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography as="p" variant="bodySmall" tone="secondary">
       {filteredEndpointCount} endpoint groups · {filteredOperationCount} operations
      </Typography>
      {hasActiveFilters ? <Badge variant="accent">Đang lọc</Badge> : null}
     </div>

     {visibleFeatureGroups.length > 0 ? (
      <div className="grid gap-6">
       {visibleFeatureGroups.map((group) => (
        <section key={group.feature} className="grid gap-3" aria-label={group.feature}>
         <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography as="h3" variant="cardTitle" tone="default" weight="black">
           {group.feature}
          </Typography>
          <Badge variant="default">{group.endpoints.length} endpoint groups</Badge>
         </div>
         <div className="grid gap-3">
          {group.endpoints.map(({ endpoint, operations }) => (
           <ApiEndpointCard
            key={`${endpoint.path}-${endpoint.methods.join("-")}-${endpoint.scope}`}
            endpoint={endpoint}
            operations={operations}
            onCopy={copyText}
           />
          ))}
         </div>
        </section>
       ))}
      </div>
     ) : (
      <EmptyState
       surface="subtle"
       size="spacious"
       icon={<Search />}
       title="Không có endpoint phù hợp"
       description="Thử đổi từ khóa, feature, HTTP method hoặc scope để xem lại toàn bộ contract."
       actions={
        <Button variant="outline" onClick={resetFilters}>
         Xóa bộ lọc
        </Button>
       }
      />
     )}
    </section>

    <Card variant="subtle" padding="lg" className="grid gap-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-1">
       <div className="flex items-center gap-2">
        <PlugZap className="text-accent-text" />
        <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
         Current app inventory
        </Typography>
       </div>
       <Typography as="p" variant="bodySmall" tone="secondary">
        Registry kiểm tra mọi route handler và direct data flow để API docs không bị sót khi app
        phát triển.
       </Typography>
      </div>
      <div className="flex flex-wrap gap-2">
       <Badge variant="success">{publicInventoryCount} v1 contract</Badge>
       <Badge variant="warning">{internalInventoryCount} internal-only</Badge>
      </div>
     </div>
     <Separator />
     <div className="grid gap-2">
      {currentApiInventory.map((entry) => (
       <Card
        key={entry.currentPath}
        variant="default"
        padding="sm"
        className="grid gap-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
       >
        <Badge variant={entry.exposure === "public-v1" ? "success" : "warning"}>
         {entry.methods.join(" · ")}
        </Badge>
        <div className="grid min-w-0 gap-0.5">
         <Typography as="span" variant="code" tone="default" wrapping="breakAll">
          {entry.currentPath}
         </Typography>
         <Typography as="span" variant="caption" tone="muted">
          {entry.exposure === "public-v1" ? `v1: ${entry.v1Path}` : entry.internalReason}
         </Typography>
        </div>
        <Badge variant={entry.exposure === "public-v1" ? "accent" : "default"}>{entry.group}</Badge>
       </Card>
      ))}
     </div>
    </Card>
   </div>
  </PageContainer>
 );
}
