"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, Terminal } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Typography } from "@/components/ui/display/typography";

import { filterPublicApiEndpoints, publicV1Endpoints } from "./api-registry";
import { ApiEndpointCard } from "./DeveloperApiEndpointCard";
import { DeveloperApiFilters } from "./DeveloperApiFilters";
import {
 DeveloperApiInventoryCard,
 DeveloperApiSecurityCard,
 DeveloperApiUsageCard,
} from "./DeveloperApiOverviewCards";
import { apiFeatures } from "./developer-api-utils";

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

    <DeveloperApiSecurityCard />

    <DeveloperApiUsageCard />

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

     <DeveloperApiFilters
      searchQuery={searchQuery}
      featureFilter={featureFilter}
      methodFilter={methodFilter}
      scopeFilter={scopeFilter}
      hasActiveFilters={hasActiveFilters}
      onSearchQueryChange={setSearchQuery}
      onFeatureFilterChange={setFeatureFilter}
      onMethodFilterChange={setMethodFilter}
      onScopeFilterChange={setScopeFilter}
      onReset={resetFilters}
     />

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

    <DeveloperApiInventoryCard />
   </div>
  </PageContainer>
 );
}
