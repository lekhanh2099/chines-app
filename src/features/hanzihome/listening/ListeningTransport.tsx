"use client";

import { ChevronLeft, ChevronRight, Pause, Play, Repeat2, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Typography } from "@/components/ui/typography";

import { ListeningShortcutLegend } from "./ListeningShortcutLegend";

export type ListeningPlaybackMode = "sentence" | "paragraph" | "passage";

type ListeningTransportSegment = {
 id: string;
 label: string;
 title?: string;
};

export function ListeningTransport({
 activeIndex,
 segments,
 playbackMode,
 loopCurrent,
 isLoading,
 isPaused,
 isPlaying,
 onModeChange,
 onSelect,
 onPrevious,
 onPlayToggle,
 onRepeat,
 onNext,
 onToggleLoop,
 onStop,
}: {
 activeIndex: number;
 segments: ListeningTransportSegment[];
 playbackMode: ListeningPlaybackMode;
 loopCurrent: boolean;
 isLoading: boolean;
 isPaused: boolean;
 isPlaying: boolean;
 onModeChange: (mode: ListeningPlaybackMode) => void;
 onSelect: (index: number) => void;
 onPrevious: () => void;
 onPlayToggle: () => void;
 onRepeat: () => void;
 onNext: () => void;
 onToggleLoop: () => void;
 onStop: () => void;
}) {
 const activeSegment = segments[activeIndex];
 const canPlay = activeSegment !== undefined;
 const hasPrevious = activeIndex > 0;
 const hasNext = activeIndex >= 0 && activeIndex < segments.length - 1;

 return (
  <Card variant="section" padding="md" className="grid gap-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      Điều khiển nghe
     </Typography>
     <Typography variant="caption" tone="muted">
      {activeSegment
       ? `Phần ${activeIndex + 1}/${segments.length} · ${activeSegment.title ?? "Nghe và chép"}`
       : "Chưa có phần nghe phù hợp."}
     </Typography>
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <Badge casing="natural">
      {segments.length > 0 ? `${activeIndex + 1}/${segments.length}` : "0/0"}
     </Badge>
     <ListeningShortcutLegend />
    </div>
   </div>

   <SegmentedControl<ListeningPlaybackMode>
    value={playbackMode}
    items={[
     { key: "sentence", label: "Theo câu" },
     { key: "paragraph", label: "Theo đoạn" },
     { key: "passage", label: "Toàn bài" },
    ]}
    onChange={onModeChange}
    aria-label="Chế độ phát nghe chép"
   />

   {segments.length > 1 ? (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-10" aria-label="Chọn phần nghe">
     {segments.map((segment, index) => (
      <Button
       key={segment.id}
       type="button"
       size="sm"
       variant={index === activeIndex ? "active" : "outline"}
       aria-current={index === activeIndex ? "step" : undefined}
       title={segment.title}
       onClick={() => onSelect(index)}
      >
       {segment.label}
      </Button>
     ))}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center justify-center gap-2">
    <Button
     type="button"
     size="icon"
     variant="outline"
     disabled={!hasPrevious}
     aria-label="Phần trước"
     title="Phần trước · phím 1 hoặc ←"
     onClick={onPrevious}
    >
     <ChevronLeft />
    </Button>
    <Button
     type="button"
     size="lg"
     disabled={!canPlay || isLoading}
     onClick={onPlayToggle}
    >
     {isPlaying && !isPaused ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
     {isLoading ? "Đang chuẩn bị" : isPlaying && !isPaused ? "Tạm dừng" : isPaused ? "Tiếp tục" : "Nghe"}
    </Button>
    <Button
     type="button"
     size="icon"
     variant="outline"
     disabled={!canPlay}
     aria-label="Nghe lại"
     title="Nghe lại · phím 3 hoặc R"
     onClick={onRepeat}
    >
     <Repeat2 />
    </Button>
    <Button
     type="button"
     size="icon"
     variant="outline"
     disabled={!hasNext}
     aria-label="Phần sau"
     title="Phần sau · phím 4 hoặc →"
     onClick={onNext}
    >
     <ChevronRight />
    </Button>
    <Button
     type="button"
     size="toolbar"
     variant={loopCurrent ? "active" : "outline"}
     aria-pressed={loopCurrent}
     title="Lặp phần hiện tại · phím 5 hoặc L"
     onClick={onToggleLoop}
    >
     <Repeat2 data-icon="inline-start" />
     Lặp
    </Button>
    <Button
     type="button"
     size="icon"
     variant="ghost"
     disabled={!isPlaying && !isPaused && !isLoading}
     aria-label="Dừng phát"
     title="Dừng · Esc"
     onClick={onStop}
    >
     <Square />
    </Button>
   </div>
  </Card>
 );
}