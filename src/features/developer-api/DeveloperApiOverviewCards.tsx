"use client";

import { KeyRound, PlugZap, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";

import { currentApiInventory } from "./api-registry";

export function DeveloperApiSecurityCard() {
 return (
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
     Deep lookup và generation chỉ dùng credential AI của chính owner, không dùng platform fallback.
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
 );
}

export function DeveloperApiUsageCard() {
 return (
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
 );
}

export function DeveloperApiInventoryCard() {
 const publicInventoryCount = currentApiInventory.filter(
  (entry) => entry.exposure === "public-v1",
 ).length;
 const internalInventoryCount = currentApiInventory.length - publicInventoryCount;

 return (
  <Card variant="subtle" padding="lg" className="grid min-w-0 gap-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <div className="flex items-center gap-2">
      <PlugZap className="text-accent-text" />
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
       Current app inventory
      </Typography>
     </div>
     <Typography as="p" variant="bodySmall" tone="secondary">
      Registry kiểm tra mọi route handler và direct data flow để API docs không bị sót khi app phát
      triển.
     </Typography>
    </div>
    <div className="flex flex-wrap gap-2">
     <Badge variant="success">{publicInventoryCount} v1 contract</Badge>
     <Badge variant="warning">{internalInventoryCount} internal-only</Badge>
    </div>
   </div>
   <Separator />
   <div className="grid min-w-0 gap-2">
    {currentApiInventory.map((entry) => (
     <Card
      key={entry.currentPath}
      variant="default"
      padding="sm"
      className="grid min-w-0 gap-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
     >
      <Badge variant={entry.exposure === "public-v1" ? "success" : "warning"}>
       {entry.methods.join(" · ")}
      </Badge>
      <div className="grid min-w-0 gap-0.5">
       <Typography as="span" variant="code" tone="default" wrapping="breakAll">
        {entry.currentPath}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" wrapping="breakAll">
        {entry.exposure === "public-v1" ? `v1: ${entry.v1Path}` : entry.internalReason}
       </Typography>
      </div>
      <Badge variant={entry.exposure === "public-v1" ? "accent" : "default"}>{entry.group}</Badge>
     </Card>
    ))}
   </div>
  </Card>
 );
}
