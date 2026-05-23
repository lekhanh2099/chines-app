"use client";

import { useEffect, useMemo, useState } from "react";
import {
 AUTO_API_KEY_PROVIDER,
 API_KEY_PROVIDER_OPTIONS,
 getApiKeyProviderDocsUrl,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ManagedApiKey = {
 id: string;
 provider: ApiKeyProvider;
 providerLabel: string;
 label: string;
 maskedKey: string;
 isActive: boolean;
 priority: number;
 defaultModel: string | null;
 lastValidatedAt: string | null;
 createdAt: string;
 updatedAt: string;
};

type ApiKeysSummary = {
 total: number;
 active: number;
 deepseek: number;
 gemini: number;
 openai: number;
};

type ApiKeysResponse = {
 schemaReady?: boolean;
 schemaReason?: "ok" | "missing-table" | "schema-error";
 schemaMessage?: string | null;
 keys: ManagedApiKey[];
 summary: ApiKeysSummary;
};

type ProviderSelectValue = ApiKeyProvider | typeof AUTO_API_KEY_PROVIDER;

const EMPTY_SUMMARY: ApiKeysSummary = {
 total: 0,
 active: 0,
 deepseek: 0,
 gemini: 0,
 openai: 0,
};

export default function ApiKeyManagerSection() {
 const [keys, setKeys] = useState<ManagedApiKey[]>([]);
 const [summary, setSummary] = useState<ApiKeysSummary>(EMPTY_SUMMARY);
 const [schemaReady, setSchemaReady] = useState(true);
 const [schemaMessage, setSchemaMessage] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [provider, setProvider] = useState<ProviderSelectValue>(
  AUTO_API_KEY_PROVIDER,
 );
 const [label, setLabel] = useState("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [busyKeyId, setBusyKeyId] = useState<string | null>(null);

 async function loadKeys() {
  setIsLoading(true);

  try {
   const response = await fetch("/api/settings/api-keys", {
    method: "GET",
    credentials: "include",
   });

   if (!response.ok) {
    throw new Error("load_failed");
   }

   const data = (await response.json()) as ApiKeysResponse;
   setSchemaReady(data.schemaReady ?? true);
   setSchemaMessage(data.schemaMessage ?? null);
   setKeys(data.keys || []);
   setSummary(data.summary || EMPTY_SUMMARY);
  } catch {
   toast.error("Không tải được danh sách API key.");
  } finally {
   setIsLoading(false);
  }
 }

 useEffect(() => {
  void loadKeys();
 }, []);

 const selectedProviderOption = useMemo(() => {
  if (provider === AUTO_API_KEY_PROVIDER) {
   return null;
  }

  return (
   API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider) || null
  );
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

  setIsSubmitting(true);

  try {
   const response = await fetch("/api/settings/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
     apiKey: apiKey.trim(),
     label: label.trim() || undefined,
     provider,
    }),
   });

   const data = (await response.json()) as {
    success?: boolean;
    error?: string;
    message?: string;
   };

   if (!response.ok || !data.success) {
    toast.error(data.error || "Không thể thêm API key.");
    return;
   }

   toast.success(data.message || "Đã thêm API key.");
   setApiKey("");
   setLabel("");
   setProvider(AUTO_API_KEY_PROVIDER);
   setShowKey(false);
   setIsDialogOpen(false);
   await loadKeys();
  } catch {
   toast.error("Lỗi kết nối khi thêm API key.");
  } finally {
   setIsSubmitting(false);
  }
 }

 async function handleToggleKey(key: ManagedApiKey) {
  setBusyKeyId(key.id);

  try {
   const response = await fetch("/api/settings/api-keys", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
     action: "toggle",
     keyId: key.id,
     isActive: !key.isActive,
    }),
   });

   const data = (await response.json()) as {
    success?: boolean;
    error?: string;
    key?: ManagedApiKey;
   };

   if (!response.ok || !data.success || !data.key) {
    toast.error(data.error || "Không thể cập nhật trạng thái key.");
    return;
   }

   const updatedKey = data.key;
   setKeys((current) =>
    current.map((item) => (item.id === updatedKey.id ? updatedKey : item)),
   );
   setSummary((current) => ({
    ...current,
    active: current.active + (updatedKey.isActive ? 1 : -1),
   }));
  } catch {
   toast.error("Lỗi kết nối khi cập nhật key.");
  } finally {
   setBusyKeyId(null);
  }
 }

 async function handleMoveKey(keyId: string, direction: "up" | "down") {
  setBusyKeyId(keyId);

  try {
   const response = await fetch("/api/settings/api-keys", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
     action: "move",
     keyId,
     direction,
    }),
   });

   const data = (await response.json()) as {
    success?: boolean;
    error?: string;
    keys?: ManagedApiKey[];
   };

   if (!response.ok || !data.success || !data.keys) {
    toast.error(data.error || "Không thể đổi thứ tự key.");
    return;
   }

   setKeys(data.keys);
  } catch {
   toast.error("Lỗi kết nối khi đổi thứ tự key.");
  } finally {
   setBusyKeyId(null);
  }
 }

 async function handleDeleteKey(keyId: string) {
  setBusyKeyId(keyId);

  try {
   const response = await fetch("/api/settings/api-keys", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ keyId }),
   });

   const data = (await response.json()) as {
    success?: boolean;
    error?: string;
   };

   if (!response.ok || !data.success) {
    toast.error(data.error || "Không thể xóa key.");
    return;
   }

   toast.success("Đã xóa API key.");
   await loadKeys();
  } catch {
   toast.error("Lỗi kết nối khi xóa key.");
  } finally {
   setBusyKeyId(null);
  }
 }

 return (
  <section className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="max-w-3xl space-y-2">
     <div className="inline-flex items-center gap-2 rounded-2xl -full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]  ">
      <Workflow className="h-3.5 w-3.5" />
      API Key Manager
     </div>
     <h2 className="text-xl font-bold text-text-primary">
      Quản lý API key và thứ tự failover
     </h2>
     <p className="text-sm leading-6 text-text-secondary">
      Chỉ còn một section để quản lý toàn bộ key. App sẽ thử đúng theo thứ tự
      bạn sắp xếp từ trên xuống dưới, nên nếu muốn ưu tiên DeepSeek thì hãy để
      các DeepSeek key ở phía trên.
     </p>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
     <DialogTrigger>
      <Button disabled={isLoading || !schemaReady}>
       <Plus className="h-4 w-4" />
       Thêm API key
      </Button>
     </DialogTrigger>
     <DialogContent className="max-w-xl rounded-2xl  border border-border-default bg-bg-card p-6">
      <DialogHeader>
       <DialogTitle className="text-text-primary">Thêm API key mới</DialogTitle>
       <DialogDescription className="text-text-secondary">
        Có thể để app tự detect provider, hoặc chọn tay nếu key thuộc dạng khó
        phân biệt.
       </DialogDescription>
      </DialogHeader>

      <DialogBody>
       <label className="space-y-2">
        <span className="text-sm font-semibold text-text-primary">
         Provider
        </span>
        <select
         value={provider}
         onChange={(event) =>
          setProvider(event.target.value as ProviderSelectValue)
         }
         className="h-11 w-full rounded-2xl -xl border border-border-default bg-bg-primary px-4 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
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
        <div className="rounded-2xl border border-border-default bg-bg-primary px-4 py-3 text-sm text-text-secondary">
         <p className="font-semibold text-text-primary">
          {selectedProviderOption.label}
         </p>
         <p className="mt-1 leading-6">{selectedProviderOption.description}</p>
         <a
          href={getApiKeyProviderDocsUrl(selectedProviderOption.value)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium   transition hover: -hover"
         >
          Mở trang lấy key
          <ExternalLink className="h-3.5 w-3.5" />
         </a>
        </div>
       ) : (
        <div className="rounded-2xl border border-border-default bg-bg-primary px-4 py-3 text-sm leading-6 text-text-secondary">
         App sẽ thử detect theo thứ tự hợp lý. Với key dạng `sk-...`, app sẽ thử
         DeepSeek trước rồi mới đến OpenAI.
        </div>
       )}

       <label className="space-y-2">
        <span className="text-sm font-semibold text-text-primary">
         Tên hiển thị
        </span>
        <Input
         value={label}
         onChange={(event) => setLabel(event.target.value)}
         placeholder="Ví dụ: DeepSeek chính, Gemini backup"
         maxLength={80}
        />
       </label>

       <label className="space-y-2">
        <span className="text-sm font-semibold text-text-primary">API key</span>
        <div className="flex items-center gap-2">
         <div className="relative flex-1">
          <Input
           type={showKey ? "text" : "password"}
           value={apiKey}
           onChange={(event) => setApiKey(event.target.value)}
           placeholder={
            selectedProviderOption?.placeholder || "Dán API key vào đây"
           }
           className="h-11 pr-11"
           autoComplete="off"
           spellCheck={false}
          />
          <button
           type="button"
           onClick={() => setShowKey((current) => !current)}
           className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-primary"
          >
           {showKey ? (
            <EyeOff className="h-4 w-4" />
           ) : (
            <Eye className="h-4 w-4" />
           )}
          </button>
         </div>
         <Button variant="outline" onClick={handlePaste}>
          <ClipboardPaste className="h-4 w-4" />
          Paste
         </Button>
        </div>
       </label>
      </DialogBody>

      <DialogFooter>
       <Button
        variant="outline"
        onClick={() => setIsDialogOpen(false)}
        disabled={isSubmitting}
       >
        Hủy
       </Button>
       <Button
        onClick={handleAddKey}
        disabled={!apiKey.trim() || isSubmitting || !schemaReady}
        isLoading={isSubmitting}
       >
        <ShieldCheck className="h-4 w-4" />
        Verify và lưu
       </Button>
      </DialogFooter>
     </DialogContent>
    </Dialog>
   </div>

   {!schemaReady && (
    <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
     {schemaMessage ||
      "Database chưa sẵn sàng cho user_api_keys. Hãy apply migration hoặc repair migration rồi tải lại trang."}
    </div>
   )}

   <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryPill label="Tổng key" value={summary.total} />
    <SummaryPill label="Đang active" value={summary.active} tone="success" />
    <SummaryPill label="DeepSeek" value={summary.deepseek} />
    <SummaryPill
     label="Gemini / OpenAI"
     value={summary.gemini + summary.openai}
    />
   </div>

   <div className="mt-5 rounded-2xl border border-border-default bg-bg-primary p-4 text-sm leading-6 text-text-secondary">
    Thứ tự fallback: app đọc từ trên xuống dưới trong danh sách key active. Khi
    một key lỗi hoặc hết balance, app chuyển sang key kế tiếp. Nếu toàn bộ key
    user đều fail, app mới fallback sang system provider của app.
   </div>

   {isLoading ? (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border-default bg-bg-primary p-5 text-sm text-text-secondary">
     <Loader2 className="h-4 w-4 animate-spin" />
     Đang tải danh sách API key...
    </div>
   ) : keys.length === 0 ? (
    <div className="mt-6 rounded-2xl  border border-dashed border-border-default bg-bg-primary px-6 py-10 text-center">
     <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl -full bg-accent/10  ">
      <KeyRound className="h-5 w-5" />
     </div>
     <p className="mt-4 text-base font-semibold text-text-primary">
      Chưa có API key nào
     </p>
     <p className="mt-2 text-sm leading-6 text-text-secondary">
      {schemaReady
       ? "Thêm ít nhất một key để app có thể tự failover khi provider cá nhân bị hết quota hoặc mất kết nối."
       : "Apply migration database trước, rồi quay lại thêm key để bật failover cá nhân."}
     </p>
    </div>
   ) : (
    <div className="mt-6 space-y-3">
     {keys.map((key, index) => {
      const isBusy = busyKeyId === key.id;

      return (
       <article
        key={key.id}
        className="rounded-2xl  border border-border-default bg-bg-primary p-4 shadow-theme-sm"
       >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
           <span
            className={cn(
             "rounded-2xl -full px-3 py-1 text-xs font-semibold",
             key.provider === "deepseek"
              ? "bg-emerald-100 text-emerald-900"
              : key.provider === "gemini"
                ? "bg-sky-100 text-sky-900"
                : "bg-orange-100 text-orange-900",
            )}
           >
            {key.providerLabel}
           </span>
           <span className="rounded-2xl -full bg-bg-card px-3 py-1 text-xs font-semibold text-text-muted">
            Ưu tiên #{index + 1}
           </span>
           <span
            className={cn(
             "inline-flex items-center gap-1 rounded-2xl -full px-3 py-1 text-xs font-semibold",
             key.isActive
              ? "bg-success/10 text-success"
              : "bg-bg-card text-text-muted",
            )}
           >
            {key.isActive ? (
             <Check className="h-3.5 w-3.5" />
            ) : (
             <Pause className="h-3.5 w-3.5" />
            )}
            {key.isActive ? "Đang active" : "Đang tạm dừng"}
           </span>
          </div>

          <div>
           <h3 className="text-base font-bold text-text-primary">
            {key.label}
           </h3>
           <p className="mt-1 font-mono text-sm text-text-secondary">
            {key.maskedKey}
           </p>
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
           isLoading={isBusy}
          >
           {key.isActive ? (
            <Pause className="h-4 w-4" />
           ) : (
            <Play className="h-4 w-4" />
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
    tone === "success"
     ? "border-success/20 bg-success/5"
     : "border-border-default bg-bg-primary",
   )}
  >
   <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
    {label}
   </p>
   <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
  </div>
 );
}
