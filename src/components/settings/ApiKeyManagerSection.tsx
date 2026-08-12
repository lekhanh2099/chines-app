"use client";

import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { useMemo, useState } from "react";
import {
 API_KEY_PROVIDER_OPTIONS,
 ApiKeyProviderSchema,
 getApiKeyProviderDocsUrl,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import {
 getApiKeyModelDescription,
 getApiKeyModelOptions,
 getDefaultApiKeyModel,
} from "@/lib/api-key-models";
import { useManagedApiKeys } from "@/features/settings/useManagedApiKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
 Check,
 ClipboardPaste,
 Eye,
 EyeOff,
 ExternalLink,
 KeyRound,
 Loader2,
 Pause,
 Play,
 Plus,
 ShieldCheck,
 Trash2,
 Cpu,
} from "lucide-react";

const EMPTY_SUMMARY = {
 total: 0,
 active: 0,
 groq: 0,
 deepseek: 0,
 gemini: 0,
 openai: 0,
};

export default function ApiKeyManagerSection() {
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [provider, setProvider] = useState<ApiKeyProvider>("groq");
 const [model, setModel] = useState(getDefaultApiKeyModel("groq"));
 const [label, setLabel] = useState("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const {
  query,
  addMutation,
  toggleMutation,
  moveMutation,
  modelMutation,
  deleteMutation,
  busyKeyId,
 } = useManagedApiKeys();
 const keys = query.data?.keys ?? [];
 const selectedKeyId = keys.find((key) => key.isActive)?.id ?? null;
 const summary = query.data?.summary ?? EMPTY_SUMMARY;
 const schemaReady = query.data?.schemaReady ?? true;
 const schemaMessage = query.data?.schemaMessage ?? null;
 const isLoading = query.isPending;
 const isSubmitting = addMutation.isPending;

 const selectedProviderOption = useMemo(() => {
  return API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider) || null;
 }, [provider]);
 const modelOptions = useMemo(() => getApiKeyModelOptions(provider), [provider]);

 async function handlePaste() {
  try {
   const text = await navigator.clipboard.readText();
   if (text) {
    setApiKey(text.trim());
    toast.info("Đã dán key từ clipboard.");
   }
  } catch {
   toast.error("Không thể truy cập clipboard.");
  }
 }

 async function handleAddKey() {
  if (!apiKey.trim()) {
   toast.error("Vui lòng nhập API key.");
   return;
  }

  try {
   const data = await addMutation.mutateAsync({
    apiKey: apiKey.trim(),
    label: label.trim() || undefined,
    provider,
    model,
   });
   toast.success(data.message);
   setApiKey("");
   setLabel("");
   setProvider("groq");
   setModel(getDefaultApiKeyModel("groq"));
   setShowKey(false);
   setIsDialogOpen(false);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể thêm API key.");
  }
 }

 async function handleModelChange(keyId: string, nextModel: string) {
  try {
   await modelMutation.mutateAsync({ keyId, model: nextModel });
   toast.success("Đã đổi model.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể đổi model.");
  }
 }

 async function handleToggleKey(key: (typeof keys)[number]) {
  try {
   await toggleMutation.mutateAsync({
    keyId: key.id,
    isActive: !key.isActive,
   });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái key.");
  }
 }

 async function handleMoveKey(
  keyId: string,
  direction: Parameters<typeof moveMutation.mutateAsync>[0]["direction"],
 ) {
  try {
   await moveMutation.mutateAsync({ keyId, direction });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể đổi thứ tự key.");
  }
 }

 async function handleDeleteKey(keyId: string) {
  try {
   await deleteMutation.mutateAsync(keyId);
   toast.success("Đã xóa API key.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa key.");
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid gap-5">
   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="flex max-w-3xl flex-col gap-2">
     <Typography
      as="h2"
      variant="sectionTitle"
      tone="default"
      weight="bold"
      className="flex items-center gap-2"
     >
      <Cpu className="size-5 text-accent-text" />
      API key cá nhân cho Xem chi tiết
     </Typography>
     <Typography as="p" tone="secondary" leading="standard">
      Tất cả model trong phần này đều cần API key cá nhân. Provider có thể cấp quota miễn phí, nhưng
      app vẫn cần key để gọi API. Khi request lỗi, app không tự đổi key hoặc model.
     </Typography>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
     <DialogTrigger asChild>
      <Button disabled={isLoading || !schemaReady}>
       <Plus data-icon="inline-start" />
       Thêm API key
      </Button>
     </DialogTrigger>
     <DialogContent>
      <DialogHeader>
       <DialogTitle>Thêm API key mới</DialogTitle>
       <DialogDescription>Chọn provider, model và nhập key tương ứng.</DialogDescription>
      </DialogHeader>

      <DialogBody>
       <div className="grid gap-2">
        <Label htmlFor="api-key-provider" variant="label" tone="default" weight="semibold">
         Provider
        </Label>
        <Select
         value={provider}
         onValueChange={(value) => {
          const parsedProvider = ApiKeyProviderSchema.safeParse(value);
          if (!parsedProvider.success) return;
          setProvider(parsedProvider.data);
          setModel(getDefaultApiKeyModel(parsedProvider.data));
         }}
        >
         <SelectTrigger id="api-key-provider" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          {API_KEY_PROVIDER_OPTIONS.map((option) => (
           <SelectItem key={option.value} value={option.value}>
            {option.label}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="api-key-model" variant="label" tone="default" weight="semibold">
         Model
        </Label>
        <Select value={model} onValueChange={setModel}>
         <SelectTrigger id="api-key-model" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          {modelOptions.map((option) => (
           <SelectItem key={option.value} value={option.value}>
            {option.label}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Typography as="p" variant="bodySmall" tone="muted">
         {modelOptions.find((option) => option.value === model)?.description}
        </Typography>
       </div>

       {selectedProviderOption ? (
        <div className="grid gap-1 text-sm text-text-secondary">
         <Typography as="p" tone="default" weight="semibold">
          {selectedProviderOption.label}
         </Typography>
         <Typography as="p">{selectedProviderOption.description}</Typography>
         <a
          href={getApiKeyProviderDocsUrl(selectedProviderOption.value)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-accent-text transition hover:underline"
         >
          Mở trang lấy key
          <ExternalLink className="h-3.5 w-3.5" />
         </a>
        </div>
       ) : null}

       <Label variant="label" className="flex flex-col gap-2">
        <Typography tone="default" weight="semibold">
         Tên hiển thị
        </Typography>
        <Input
         value={label}
         onChange={(event) => setLabel(event.target.value)}
         placeholder="Ví dụ: Groq tra từ"
         maxLength={80}
        />
       </Label>

       <Label variant="label" className="flex flex-col gap-2">
        <Typography tone="default" weight="semibold">
         API key
        </Typography>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
         <Input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={selectedProviderOption?.placeholder || "Dán API key vào đây"}
          autoComplete="off"
          spellCheck={false}
         />
         <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowKey((current) => !current)}
          aria-label={showKey ? "Ẩn API key" : "Hiện API key"}
          title={showKey ? "Ẩn API key" : "Hiện API key"}
         >
          {showKey ? <EyeOff /> : <Eye />}
         </Button>
         <Button
          variant="outline"
          size="icon"
          onClick={handlePaste}
          aria-label="Dán API key"
          title="Dán API key"
         >
          <ClipboardPaste />
         </Button>
        </div>
       </Label>
      </DialogBody>

      <DialogFooter>
       <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
        Hủy
       </Button>
       <Button onClick={handleAddKey} disabled={!apiKey.trim() || isSubmitting || !schemaReady}>
        {isSubmitting ? (
         <Spinner data-icon="inline-start" />
        ) : (
         <ShieldCheck data-icon="inline-start" />
        )}
        Verify và lưu
       </Button>
      </DialogFooter>
     </DialogContent>
    </Dialog>
   </div>

   {!schemaReady && (
    <div className="rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 leading-6 text-warning-text">
     {schemaMessage ||
      "Database chưa sẵn sàng cho user_api_keys. Hãy apply migration hoặc repair migration rồi tải lại trang."}
    </div>
   )}

   <Typography as="p" variant="bodySmall" tone="muted">
    {summary.total} key · {summary.active} đang bật · chỉ áp dụng khi mở phân tích chi tiết
   </Typography>

   {query.isError ? (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-5 text-danger-text">
     <Typography as="p" weight="semibold">
      Không tải được danh sách API key.
     </Typography>
     <Typography as="p" variant="bodySmall">
      Kiểm tra kết nối rồi thử lại. Dữ liệu key hiện tại chưa bị thay đổi.
     </Typography>
     <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
      Thử lại
     </Button>
    </div>
   ) : isLoading ? (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-primary p-5 text-text-secondary">
     <Loader2 className="h-4 w-4 animate-spin" />
     Đang tải danh sách API key...
    </div>
   ) : keys.length === 0 ? (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border-default bg-bg-primary p-4">
     <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
      <KeyRound className="h-5 w-5" />
     </div>
     <div className="grid gap-1">
      <Typography as="p" tone="default" weight="semibold">
       Chưa có API key cá nhân
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" leading="compact">
       {schemaReady
        ? "Tra nhanh vẫn hoạt động bằng model hệ thống. Chỉ thêm key khi cần model riêng cho Xem chi tiết."
        : "Apply migration database trước, rồi quay lại thêm key."}
      </Typography>
     </div>
    </div>
   ) : (
    <div className="divide-y divide-border-default border-y border-border-default">
     {keys.map((key, index) => {
      const isBusy = busyKeyId === key.id;

      return (
       <article key={key.id} className="py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)_auto] lg:items-center">
         <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
           <Badge
            variant={
             key.provider === "deepseek"
              ? "success"
              : key.provider === "gemini"
                ? "info"
                : "warning"
            }
            size="sm"
           >
            {key.providerLabel}
           </Badge>
           <Badge
            variant={key.id === selectedKeyId ? "info" : key.isActive ? "success" : "default"}
            size="sm"
           >
            {key.isActive ? <Check className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {key.id === selectedKeyId ? "Đang dùng" : key.isActive ? "Đang bật" : "Tạm dừng"}
           </Badge>
          </div>

          <div className="grid min-w-0 gap-1">
           <Typography as="h3" variant="cardTitle" tone="default" weight="bold" clamp="one">
            {key.label}
           </Typography>
           <Typography as="p" variant="code" tone="secondary" clamp="one">
            {key.maskedKey}
           </Typography>
          </div>
         </div>

         <div className="grid min-w-0 gap-1.5">
          <Typography variant="caption" tone="muted" weight="semibold">
           Model sử dụng
          </Typography>
          <Select
           value={key.defaultModel || getDefaultApiKeyModel(key.provider)}
           onValueChange={(value) => void handleModelChange(key.id, value)}
           disabled={isBusy || !schemaReady}
          >
           <SelectTrigger width="full" aria-label={`Model cho ${key.label}`}>
            <SelectValue />
           </SelectTrigger>
           <SelectContent align="start">
            {key.defaultModel &&
            !getApiKeyModelOptions(key.provider).some(
             (option) => option.value === key.defaultModel,
            ) ? (
             <SelectItem value={key.defaultModel}>{key.defaultModel} (đã lưu)</SelectItem>
            ) : null}
            {getApiKeyModelOptions(key.provider).map((option) => (
             <SelectItem key={option.value} value={option.value}>
              {option.label}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
          <Typography as="span" variant="caption" tone="muted" leading="compact">
           {getApiKeyModelDescription(key.provider, key.defaultModel)}
          </Typography>
         </div>

         <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {index > 0 ? (
           <Button
            variant="outline"
            size="sm"
            onClick={() => handleMoveKey(key.id, "up")}
            disabled={isBusy || !schemaReady}
           >
            Đưa lên
           </Button>
          ) : null}
          <Button
           variant="outline"
           size="sm"
           onClick={() => handleToggleKey(key)}
           disabled={isBusy || !schemaReady}
          >
           {isBusy ? (
            <Spinner data-icon="inline-start" />
           ) : key.isActive ? (
            <Pause data-icon="inline-start" />
           ) : (
            <Play data-icon="inline-start" />
           )}
           {key.isActive ? "Tạm dừng" : "Bật lại"}
          </Button>
          <Button
           variant="destructive"
           size="sm"
           onClick={() => handleDeleteKey(key.id)}
           disabled={isBusy || !schemaReady}
          >
           <Trash2 className="h-4 w-4" />
           Xóa
          </Button>
         </div>
        </div>
       </article>
      );
     })}
    </div>
   )}
  </Card>
 );
}
