"use client";

import { useMemo, useState } from "react";
import {
 AUTO_API_KEY_PROVIDER,
 API_KEY_PROVIDER_OPTIONS,
 getApiKeyProviderDocsUrl,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import { useManagedApiKeys } from "@/features/settings/useManagedApiKeys";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
 ArrowDown,
 ArrowUp,
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
 Workflow,
} from "lucide-react";

type ProviderSelectValue = ApiKeyProvider | typeof AUTO_API_KEY_PROVIDER;

const EMPTY_SUMMARY = {
 total: 0,
 active: 0,
 deepseek: 0,
 gemini: 0,
 openai: 0,
};

export default function ApiKeyManagerSection() {
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [provider, setProvider] = useState<ProviderSelectValue>(AUTO_API_KEY_PROVIDER);
 const [label, setLabel] = useState("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const { query, addMutation, toggleMutation, moveMutation, deleteMutation, busyKeyId } =
  useManagedApiKeys();
 const keys = query.data?.keys ?? [];
 const summary = query.data?.summary ?? EMPTY_SUMMARY;
 const schemaReady = query.data?.schemaReady ?? true;
 const schemaMessage = query.data?.schemaMessage ?? null;
 const isLoading = query.isPending;
 const isSubmitting = addMutation.isPending;

 const selectedProviderOption = useMemo(() => {
  if (provider === AUTO_API_KEY_PROVIDER) {
   return null;
  }

  return API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider) || null;
 }, [provider]);

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
   });
   toast.success(data.message);
   setApiKey("");
   setLabel("");
   setProvider(AUTO_API_KEY_PROVIDER);
   setShowKey(false);
   setIsDialogOpen(false);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể thêm API key.");
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

 async function handleMoveKey(keyId: string, direction: "up" | "down") {
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
  <section className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="flex max-w-3xl flex-col gap-2">
     <div className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
      <Workflow className="h-3.5 w-3.5" />
      API Key Manager
     </div>
     <h2 className="text-xl font-bold text-text-primary">Quản lý API key và thứ tự failover</h2>
     <p className=" leading-6 text-text-secondary">
      Chỉ còn một section để quản lý toàn bộ key. App sẽ thử đúng theo thứ tự bạn sắp xếp từ trên
      xuống dưới, nên nếu muốn ưu tiên DeepSeek thì hãy để các DeepSeek key ở phía trên.
     </p>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
     <DialogTrigger asChild>
      <Button disabled={isLoading || !schemaReady}>
       <Plus data-icon="inline-start" />
       Thêm API key
      </Button>
     </DialogTrigger>
     <DialogContent className="max-w-xl rounded-2xl  border border-border-default bg-bg-card p-6">
      <DialogHeader>
       <DialogTitle className="text-text-primary">Thêm API key mới</DialogTitle>
       <DialogDescription className="text-text-secondary">
        Có thể để app tự detect provider, hoặc chọn tay nếu key thuộc dạng khó phân biệt.
       </DialogDescription>
      </DialogHeader>

      <DialogBody>
       <label className="flex flex-col gap-2">
        <span className=" font-semibold text-text-primary">Provider</span>
        <select
         value={provider}
         onChange={(event) => setProvider(event.target.value as ProviderSelectValue)}
         className="h-11 w-full rounded-xl border border-border-default bg-bg-primary px-4 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
         <option value={AUTO_API_KEY_PROVIDER}>Tự nhận diện</option>
         {API_KEY_PROVIDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
           {option.label}
          </option>
         ))}
        </select>
       </label>

       {selectedProviderOption ? (
        <div className="rounded-2xl border border-border-default bg-bg-primary px-4 py-3  text-text-secondary">
         <p className="font-semibold text-text-primary">{selectedProviderOption.label}</p>
         <p className="mt-1 leading-6">{selectedProviderOption.description}</p>
         <a
          href={getApiKeyProviderDocsUrl(selectedProviderOption.value)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium text-accent-text transition hover:underline"
         >
          Mở trang lấy key
          <ExternalLink className="h-3.5 w-3.5" />
         </a>
        </div>
       ) : (
        <div className="rounded-2xl border border-border-default bg-bg-primary px-4 py-3  leading-6 text-text-secondary">
         App sẽ thử detect theo thứ tự hợp lý. Với key dạng `sk-...`, app sẽ thử DeepSeek trước rồi
         mới đến OpenAI.
        </div>
       )}

       <label className="flex flex-col gap-2">
        <span className=" font-semibold text-text-primary">Tên hiển thị</span>
        <Input
         value={label}
         onChange={(event) => setLabel(event.target.value)}
         placeholder="Ví dụ: DeepSeek chính, Gemini backup"
         maxLength={80}
        />
       </label>

       <label className="flex flex-col gap-2">
        <span className=" font-semibold text-text-primary">API key</span>
        <div className="flex items-center gap-2">
         <div className="relative flex-1">
          <Input
           type={showKey ? "text" : "password"}
           value={apiKey}
           onChange={(event) => setApiKey(event.target.value)}
           placeholder={selectedProviderOption?.placeholder || "Dán API key vào đây"}
           className="h-11 pr-11"
           autoComplete="off"
           spellCheck={false}
          />
          <button
           type="button"
           onClick={() => setShowKey((current) => !current)}
           className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-primary"
          >
           {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
         </div>
         <Button variant="outline" onClick={handlePaste}>
          <ClipboardPaste data-icon="inline-start" />
          Paste
         </Button>
        </div>
       </label>
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
    <div className="mt-5 rounded-2xl border border-warning/30 bg-warning-subtle px-4 py-3 leading-6 text-warning-text">
     {schemaMessage ||
      "Database chưa sẵn sàng cho user_api_keys. Hãy apply migration hoặc repair migration rồi tải lại trang."}
    </div>
   )}

   <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryPill label="Tổng key" value={summary.total} />
    <SummaryPill label="Đang active" value={summary.active} tone="success" />
    <SummaryPill label="DeepSeek" value={summary.deepseek} />
    <SummaryPill label="Gemini / OpenAI" value={summary.gemini + summary.openai} />
   </div>

   <div className="mt-5 rounded-2xl border border-border-default bg-bg-primary p-4  leading-6 text-text-secondary">
    Thứ tự fallback: app đọc từ trên xuống dưới trong danh sách key active. Khi một key lỗi hoặc hết
    balance, app chuyển sang key kế tiếp. Nếu toàn bộ key user đều fail, app mới fallback sang
    system provider của app.
   </div>

   {query.isError ? (
    <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-5 text-danger-text">
     <p className="font-semibold">Không tải được danh sách API key.</p>
     <p className="text-sm">Kiểm tra kết nối rồi thử lại. Dữ liệu key hiện tại chưa bị thay đổi.</p>
     <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
      Thử lại
     </Button>
    </div>
   ) : isLoading ? (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border-default bg-bg-primary p-5  text-text-secondary">
     <Loader2 className="h-4 w-4 animate-spin" />
     Đang tải danh sách API key...
    </div>
   ) : keys.length === 0 ? (
    <div className="mt-6 rounded-2xl  border border-dashed border-border-default bg-bg-primary px-6 py-10 text-center">
     <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-subtle text-accent-text">
      <KeyRound className="h-5 w-5" />
     </div>
     <p className="mt-4 text-base font-semibold text-text-primary">Chưa có API key nào</p>
     <p className="mt-2  leading-6 text-text-secondary">
      {schemaReady
       ? "Thêm ít nhất một key để app có thể tự failover khi provider cá nhân bị hết quota hoặc mất kết nối."
       : "Apply migration database trước, rồi quay lại thêm key để bật failover cá nhân."}
     </p>
    </div>
   ) : (
    <div className="mt-6 flex flex-col gap-3">
     {keys.map((key, index) => {
      const isBusy = busyKeyId === key.id;

      return (
       <article
        key={key.id}
        className="rounded-2xl  border border-border-default bg-bg-primary p-4 shadow-theme-sm"
       >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <div className="flex flex-col gap-3">
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
            className="normal-case tracking-normal"
           >
            {key.providerLabel}
           </Badge>
           <span className="rounded-full bg-bg-card px-3 py-1 text-xs font-semibold text-text-muted">
            Ưu tiên #{index + 1}
           </span>
           <span
            className={cn(
             "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
             key.isActive ? "bg-success/10 text-success" : "bg-bg-card text-text-muted",
            )}
           >
            {key.isActive ? <Check className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {key.isActive ? "Đang active" : "Đang tạm dừng"}
           </span>
          </div>

          <div>
           <h3 className="text-base font-bold text-text-primary">{key.label}</h3>
           <p className="mt-1 font-mono  text-text-secondary">{key.maskedKey}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
           {key.defaultModel && <span>Model mặc định: {key.defaultModel}</span>}
           {key.lastValidatedAt && <span>Đã verify key này</span>}
          </div>
         </div>

         <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
           variant="outline"
           size="sm"
           onClick={() => handleMoveKey(key.id, "up")}
           disabled={isBusy || index === 0 || !schemaReady}
          >
           <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
           variant="outline"
           size="sm"
           onClick={() => handleMoveKey(key.id, "down")}
           disabled={isBusy || index === keys.length - 1 || !schemaReady}
          >
           <ArrowDown className="h-4 w-4" />
          </Button>
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
           variant="outline"
           size="sm"
           onClick={() => handleDeleteKey(key.id)}
           disabled={isBusy || !schemaReady}
           className="text-danger-text hover:bg-danger/10"
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
  </section>
 );
}

function SummaryPill({
 label,
 value,
 tone = "default",
}: {
 label: string;
 value: number;
 tone?: "default" | "success";
}) {
 return (
  <div
   className={cn(
    "rounded-2xl border px-4 py-3",
    tone === "success" ? "border-success/20 bg-success/5" : "border-border-default bg-bg-primary",
   )}
  >
   <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
   <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
  </div>
 );
}
