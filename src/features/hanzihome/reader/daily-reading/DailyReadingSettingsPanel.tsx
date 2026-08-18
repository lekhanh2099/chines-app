"use client";

import { BookOpenText, CheckCircle2, RefreshCcw, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";

import {
 generateDailyReadingNow,
 testDailyReadingSource,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "./daily-reading-client";
import { dailyReadingLevelSchema } from "./daily-reading.schemas";
import { resolveDailyReadingReleaseState } from "./daily-reading.scheduler";
import { removeGeneratedDailyReadings } from "./daily-reading-storage.client";

export function DailyReadingSettingsPanel() {
 const { settings, update } = useDailyReadingSettings();
 const library = useDailyReadingLibrary();
 const [testingSource, setTestingSource] = useState(false);
 const [generating, setGenerating] = useState(false);
 const release = resolveDailyReadingReleaseState();
 const latestRuns = library.runs.slice(0, 6);
 const scheduledToday = useMemo(
  () => library.items.some((item) => item.releaseKind === "scheduled" && item.publishedDate === release.dateKey),
  [library.items, release.dateKey],
 );

 async function handleTestSource() {
  setTestingSource(true);
  try {
   const result = await testDailyReadingSource();
   toast.success(`Nguồn hoạt động: ${result.source.publisher} · ${result.source.titleZh}`);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể kiểm tra nguồn bài báo.");
  } finally {
   setTestingSource(false);
  }
 }

 async function handleGenerate() {
  setGenerating(true);
  try {
   const reading = await generateDailyReadingNow("manual", settings.preferredLevel);
   toast.success(`Đã tạo: ${reading.titleZh}`);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể tạo Daily Reading.");
  } finally {
   setGenerating(false);
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div className="grid gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      Bài đọc mới mỗi ngày
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" className="max-w-3xl">
      Tìm bài báo tiếng Trung thật, biên soạn thành 学习版 rồi lưu cục bộ. Tác vụ tự động chạy lúc 10:00 khi app đang mở; nếu app đóng, lần mở đầu tiên sau 10:00 sẽ chạy bù.
     </Typography>
    </div>
    <Badge variant={settings.autoGenerateEnabled ? "success" : "default"} size="md">
     {settings.autoGenerateEnabled ? "Tự động đang bật" : "Tự động đang tắt"}
    </Badge>
   </div>

   <Separator />

   <div className="grid gap-4 md:grid-cols-2">
    <div className="flex min-w-0 items-start justify-between gap-4">
     <div className="grid min-w-0 gap-1">
      <Typography as="h3" variant="cardTitle" weight="bold">
       Tạo bài tự động
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Mỗi ngày tối đa một bài scheduled. Lỗi tạm thời được retry có kiểm soát; nhiều tab không tạo trùng.
      </Typography>
     </div>
     <Switch
      checked={settings.autoGenerateEnabled}
      onCheckedChange={(checked) => update({ autoGenerateEnabled: checked })}
      aria-label="Bật hoặc tắt tạo Daily Reading tự động"
     />
    </div>

    <div className="grid gap-2">
     <Typography as="label" variant="label" weight="semibold" htmlFor="daily-reading-level">
      Trình độ mặc định
     </Typography>
     <Select
      value={settings.preferredLevel}
      onValueChange={(value) => update({ preferredLevel: dailyReadingLevelSchema.parse(value) })}
     >
      <SelectTrigger id="daily-reading-level" width="full">
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
       <SelectItem value="HSK4">HSK 4</SelectItem>
       <SelectItem value="HSK5">HSK 5</SelectItem>
       <SelectItem value="HSK6">HSK 6</SelectItem>
      </SelectContent>
     </Select>
    </div>
   </div>

   <Card variant="subtle" padding="md" className="grid gap-3 sm:grid-cols-3">
    <div className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">Lịch phát hành</Typography>
     <Typography weight="semibold">Mỗi ngày lúc 10:00</Typography>
    </div>
    <div className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">Thư viện local</Typography>
     <Typography weight="semibold">{library.items.length} bài đã lưu</Typography>
    </div>
    <div className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">Hôm nay</Typography>
     <Typography weight="semibold">{scheduledToday ? "Đã có bài scheduled" : release.isDue ? "Đang chờ tạo" : "Chưa tới giờ"}</Typography>
    </div>
   </Card>

   <div className="flex flex-wrap items-center gap-2">
    <Button type="button" variant="outline" size="toolbar" onClick={() => void handleTestSource()} disabled={testingSource || generating}>
     {testingSource ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
     Kiểm tra nguồn thật
    </Button>
    <Button type="button" size="toolbar" onClick={() => void handleGenerate()} disabled={testingSource || generating}>
     {generating ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
     Tìm và tạo bài ngay
    </Button>
    {library.items.length > 0 ? (
     <Button
      type="button"
      variant="ghost"
      size="toolbar"
      onClick={() => {
       removeGeneratedDailyReadings();
       toast.success("Đã xóa thư viện Daily Reading tạo tự động trên thiết bị này.");
      }}
     >
      <Trash2 data-icon="inline-start" />
      Xóa bài đã tạo
     </Button>
    ) : null}
   </div>

   <Separator />

   <div className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="bold">Lịch sử tác vụ</Typography>
     <Typography as="p" variant="bodySmall" tone="muted">Sáu lần chạy gần nhất trên thiết bị này.</Typography>
    </div>
    {latestRuns.length === 0 ? (
     <Typography variant="bodySmall" tone="muted">Chưa có lần tạo bài nào.</Typography>
    ) : (
     <div className="grid gap-2">
      {latestRuns.map((run) => (
       <div key={run.id} className="flex min-w-0 flex-wrap items-center gap-2">
        {run.status === "succeeded" ? <CheckCircle2 aria-hidden /> : run.status === "pending" ? <RefreshCcw aria-hidden /> : <BookOpenText aria-hidden />}
        <Typography variant="bodySmall" weight="semibold">{run.kind === "scheduled" ? "Tự động" : "Thủ công"} · {run.date}</Typography>
        <Badge variant={run.status === "succeeded" ? "success" : run.status === "pending" ? "info" : "warning"} size="sm">
         {run.status === "succeeded" ? "Hoàn tất" : run.status === "pending" ? "Đang chạy" : "Thất bại"}
        </Badge>
        {run.errorDetail ? <Typography variant="caption" tone="muted" className="min-w-0 flex-1">{run.errorDetail}</Typography> : null}
       </div>
      ))}
     </div>
    )}
   </div>
  </Card>
 );
}
