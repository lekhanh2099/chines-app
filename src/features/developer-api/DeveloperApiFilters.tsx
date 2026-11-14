"use client";

import { Filter, Search, SearchX } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Chip } from "@/components/ui/actions/chip";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";

import { publicV1Endpoints } from "./api-registry";
import { apiFeatures, apiMethods, apiScopes } from "./developer-api-utils";

type DeveloperApiFiltersProps = {
 searchQuery: string;
 featureFilter: string;
 methodFilter: string;
 scopeFilter: string;
 hasActiveFilters: boolean;
 onSearchQueryChange(value: string): void;
 onFeatureFilterChange(value: string): void;
 onMethodFilterChange(value: string): void;
 onScopeFilterChange(value: string): void;
 onReset(): void;
};

export function DeveloperApiFilters({
 searchQuery,
 featureFilter,
 methodFilter,
 scopeFilter,
 hasActiveFilters,
 onSearchQueryChange: setSearchQuery,
 onFeatureFilterChange: setFeatureFilter,
 onMethodFilterChange: setMethodFilter,
 onScopeFilterChange: setScopeFilter,
 onReset: resetFilters,
}: DeveloperApiFiltersProps) {
 return (
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
 );
}
