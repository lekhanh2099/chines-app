"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
 AlertTriangle,
 Check,
 ClipboardPaste,
 Eye,
 EyeOff,
 ExternalLink,
 Key,
 Loader2,
 Shield,
 Trash2,
 Zap,
} from "lucide-react";

type DeepSeekModel = {
 id: string;
 label: string;
 description: string;
};

type ByokStatus = {
 hasKey: boolean;
 enabled: boolean;
 models: DeepSeekModel[];
};

export default function ByokDeepSeekSection() {
 const [status, setStatus] = useState<ByokStatus>({
  hasKey: false,
  enabled: false,
  models: [],
 });
 const [selectedModel, setSelectedModel] = useState<string>("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [isToggling, setIsToggling] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);

 const loadStatus = useCallback(async () => {
  try {
   const res = await fetch("/api/settings/deepseek", {
    credentials: "include",
   });
   if (res.ok) {
    const data = (await res.json()) as ByokStatus;
    setStatus(data);
    // Auto-select first model if available
    if (data.models.length > 0) {
     setSelectedModel(data.models[0].id);
    }
   }
  } catch {
   // Silently fail, user sees default state
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  loadStatus();
 }, [loadStatus]);

 async function handleVerifyAndSave() {
  if (!apiKey.trim()) {
   toast.error("Vui lòng nhập API Key");
   return;
  }

  setIsSaving(true);
  try {
   // Step 1: Validate key & fetch models via server (key encrypted server-side)
   const res = await fetch("/api/settings/deepseek", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ apiKey: apiKey.trim() }),
   });

   const data = (await res.json()) as {
    success?: boolean;
    error?: string;
    models?: DeepSeekModel[];
    message?: string;
   };

   if (!res.ok || !data.success) {
    toast.error(data.error || "Không thể xác thực API Key");
    // Clear models on failure
    setStatus((prev) => ({ ...prev, models: [] }));
    setSelectedModel("");
    return;
   }

   // Step 2: Update state with models from the validated key
   const models = data.models || [];
   toast.success(data.message || "Đã kết nối thành công!");
   setApiKey("");
   setShowKey(false);
   setStatus((prev) => ({
    ...prev,
    hasKey: true,
    enabled: true,
    models,
   }));

   // Step 3: Auto-select first model
   if (models.length > 0) {
    setSelectedModel(models[0].id);
   }
  } catch {
   toast.error("Lỗi kết nối. Vui lòng thử lại.");
  } finally {
   setIsSaving(false);
  }
 }

 async function handleToggle() {
  setIsToggling(true);
  try {
   const newEnabled = !status.enabled;
   const res = await fetch("/api/settings/deepseek", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ enabled: newEnabled }),
   });

   if (res.ok) {
    setStatus((prev) => ({ ...prev, enabled: newEnabled }));
    toast.success(
     newEnabled ? "Đã bật chế độ Key cá nhân" : "Đã tắt chế độ Key cá nhân",
    );
   } else {
    toast.error("Không thể cập nhật trạng thái");
   }
  } catch {
   toast.error("Lỗi kết nối");
  } finally {
   setIsToggling(false);
  }
 }

 async function handleDeleteKey() {
  setIsDeleting(true);
  try {
   const res = await fetch("/api/settings/deepseek", {
    method: "DELETE",
    credentials: "include",
   });

   if (res.ok) {
    setStatus({ hasKey: false, enabled: false, models: [] });
    setApiKey("");
    setSelectedModel("");
    toast.success("Đã xóa API Key");
   } else {
    toast.error("Không thể xóa API Key");
   }
  } catch {
   toast.error("Lỗi kết nối");
  } finally {
   setIsDeleting(false);
  }
 }

 async function handlePaste() {
  try {
   const text = await navigator.clipboard.readText();
   if (text) {
    setApiKey(text.trim());
    toast.info("Đã dán từ clipboard");
   }
  } catch {
   toast.error("Không thể truy cập clipboard");
  }
 }

 if (isLoading) {
  return (
   <section className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
    <div className="flex items-center gap-3">
     <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
     <span className="text-sm text-text-secondary">
      Đang tải cấu hình DeepSeek...
     </span>
    </div>
   </section>
  );
 }

 return (
  <section className="space-y-6">
   {/* Header */}
   <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
     <div className="max-w-2xl space-y-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent">
       <Key className="h-3.5 w-3.5" />
       BYOK — DeepSeek
      </div>
      <h2 className="text-xl font-bold text-text-primary">
       Cấu hình API Key cá nhân (Bring Your Own Key)
      </h2>
      <p className="text-sm leading-6 text-text-secondary">
       Sử dụng API Key DeepSeek cá nhân để không bị giới hạn số lần tra cứu, tốc
       độ phản hồi nhanh hơn, và tự chủ chi phí.
      </p>

      {/* Current status badge */}
      <div className="flex items-center gap-2">
       {status.hasKey && status.enabled ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success-text">
         <Check className="h-3 w-3" />
         Đã kết nối — Đang dùng Key cá nhân
        </span>
       ) : status.hasKey && !status.enabled ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs font-semibold text-text-secondary">
         <Key className="h-3 w-3" />
         Key đã lưu — Chưa bật
        </span>
       ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs font-semibold text-text-muted">
         Đang dùng gói Miễn phí (Giới hạn)
        </span>
       )}
      </div>
     </div>

     {/* Toggle */}
     {status.hasKey && (
      <div className="flex items-center gap-3">
       <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isToggling}
        isLoading={isToggling}
       >
        {status.enabled ? (
         <>
          <Zap className="h-4 w-4" />
          Tắt BYOK
         </>
        ) : (
         <>
          <Zap className="h-4 w-4" />
          Bật BYOK
         </>
        )}
       </Button>
       <Button
        variant="outline"
        size="sm"
        onClick={handleDeleteKey}
        disabled={isDeleting}
        isLoading={isDeleting}
        className="text-danger-text hover:bg-danger/10"
       >
        <Trash2 className="h-4 w-4" />
        Xóa Key
       </Button>
      </div>
     )}
    </div>
   </div>

   {/* BYOK Active Banner */}
   {status.hasKey && status.enabled && (
    <div className="rounded-xl border border-success/30 bg-success/5 p-4">
     <p className="text-sm leading-6 text-success-text">
      <strong>BYOK Mode Active:</strong> You are using your personal API Key.
      Usage costs are billed directly by DeepSeek. This app acts as a client
      interface and does not collect fees for this connection.
     </p>
    </div>
   )}

   {/* Key Input Section */}
   {!status.hasKey && (
    <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
     <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">
       Nhập DeepSeek API Key
      </h3>

      {/* Input */}
      <div className="flex items-center gap-2">
       <div className="relative flex-1">
        <input
         type={showKey ? "text" : "password"}
         value={apiKey}
         onChange={(e) => setApiKey(e.target.value)}
         placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
         className="h-11 w-full rounded-xl border border-border-default bg-bg-primary px-4 pr-10 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
         autoComplete="off"
         spellCheck={false}
        />
        <button
         type="button"
         onClick={() => setShowKey(!showKey)}
         className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-secondary"
         aria-label={showKey ? "Ẩn key" : "Hiện key"}
        >
         {showKey ? (
          <EyeOff className="h-4 w-4" />
         ) : (
          <Eye className="h-4 w-4" />
         )}
        </button>
       </div>

       <Button variant="outline" size="sm" onClick={handlePaste}>
        <ClipboardPaste className="h-4 w-4" />
        Paste
       </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
       <a
        href="https://platform.deepseek.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
       >
        Lấy Key ở đâu?
        <ExternalLink className="h-3.5 w-3.5" />
       </a>

       <Button
        onClick={handleVerifyAndSave}
        disabled={!apiKey.trim() || isSaving}
        isLoading={isSaving}
        loadingText="Đang kiểm tra..."
       >
        <Shield className="h-4 w-4" />
        Verify &amp; Save
       </Button>
      </div>
     </div>
    </div>
   )}

   <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
    <h3 className="mb-3 text-lg font-semibold text-text-primary">
     DeepSeek Models (từ Key của bạn)
    </h3>

    {!status.hasKey ? (
     <div className="space-y-3">
      <label className="block text-sm font-medium text-text-muted">
       Chọn model
      </label>
      <select
       disabled
       className="h-11 w-full cursor-not-allowed rounded-xl border border-border-default bg-bg-primary/50 px-4 text-sm text-text-muted opacity-60 outline-none"
      >
       <option>Vui lòng nhập API Key trước</option>
      </select>
      <p className="text-xs text-text-muted">
       Nhập và xác thực API Key để xem danh sách model khả dụng.
      </p>
     </div>
    ) : status.models.length > 0 ? (
     <div className="space-y-3">
      <label className="block text-sm font-medium text-text-secondary">
       Chọn model
      </label>
      <select
       value={selectedModel}
       onChange={(e) => setSelectedModel(e.target.value)}
       disabled={!status.enabled}
       className={cn(
        "h-11 w-full rounded-xl border px-4 text-sm outline-none transition",
        status.enabled
         ? "border-border-default bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
         : "cursor-not-allowed border-border-default bg-bg-primary/50 text-text-muted opacity-60",
       )}
      >
       {status.models.map((model) => (
        <option key={model.id} value={model.id}>
         {model.id} — DeepSeek model: {model.id}
        </option>
       ))}
      </select>
      {!status.enabled && (
       <p className="text-xs text-text-muted">
        Bật BYOK để sử dụng model từ key cá nhân.
       </p>
      )}
     </div>
    ) : (
     <div className="flex items-center gap-2 text-sm text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Đang tải danh sách model...</span>
     </div>
    )}
   </div>

   {/* Disclaimer / Warning Box */}
   <div className="rounded-2xl border border-warning/40 bg-warning-subtle p-6">
    <div className="flex gap-3">
     <AlertTriangle className="h-5 w-5 shrink-0 text-warning-text" />
     <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-warning-text">
       ⚠️ Lưu ý quan trọng (Disclaimer)
      </h3>

      <div className="space-y-2 text-sm leading-6 text-warning-text/90">
       <p>
        <strong>Bảo mật:</strong> API Key của bạn được mã hóa AES-256 và chỉ lưu
        trên server. Chúng tôi <strong>TUYỆT ĐỐI KHÔNG</strong> chia sẻ key của
        bạn với bên thứ ba. Key chỉ được giải mã khi gọi DeepSeek API.
       </p>
       <p>
        <strong>Chi phí:</strong> Khi bật tính năng này, chi phí sử dụng sẽ được
        trừ trực tiếp vào tài khoản DeepSeek của bạn. App không chịu trách nhiệm
        về các khoản phí phát sinh.
       </p>
       <p>
        <strong>Rủi ro:</strong> Không chia sẻ Key cho người khác. Nếu nghi ngờ
        lộ key, hãy xóa key cũ và tạo key mới trên{" "}
        <a
         href="https://platform.deepseek.com"
         target="_blank"
         rel="noopener noreferrer"
         className="underline transition hover:text-warning-text"
        >
         platform.deepseek.com
        </a>{" "}
        ngay lập tức.
       </p>
       <p>
        <strong>Cài lại app:</strong> Nếu bạn xóa tài khoản hoặc dữ liệu, bạn sẽ
        cần nhập lại Key.
       </p>
      </div>
     </div>
    </div>
   </div>
  </section>
 );
}
