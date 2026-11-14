"use client";

import { useState } from "react";
import { ChevronDown, Copy, Play } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Typography } from "@/components/ui/display/typography";

import {
 getOperationTypeScript,
 type PublicApiEndpoint,
 type PublicApiOperation,
} from "./api-registry";
import { curlForOperation, demoOutputForOperation, methodLabel } from "./developer-api-utils";

type CopyAction = (text: string, successMessage: string) => Promise<void>;

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

export function ApiEndpointCard({
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
