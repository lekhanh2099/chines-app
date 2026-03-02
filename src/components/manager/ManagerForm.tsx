"use client";

import { z } from "zod";
import { useState } from "react";
import { Sparkles, Loader2, Save } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useAppForm } from "@/components/tanstack-form/hooks/form";
import { pinyin } from "pinyin-pro";

const managerSchema = z.object({
 hanzi: z.string().min(1, "Vui lòng nhập Chữ Hán"),
 pinyin: z.string().min(1, "Vui lòng nhập Pinyin"),
 meaning: z.string().min(1, "Vui lòng nhập Hán Việt"),
 components: z.string(),
 logic: z.string(),
 fixedPhrases: z.string(),
 example: z.string(),
 trap: z.string(),
});

type FormValues = z.infer<typeof managerSchema>;

export function ManagerForm() {
 const [isAiLoading, setIsAiLoading] = useState(false);

 const form = useAppForm({
  defaultValues: {
   hanzi: "",
   pinyin: "",
   meaning: "",
   components: "",
   logic: "",
   fixedPhrases: "",
   example: "",
   trap: "",
  } as FormValues,
  validators: { onChange: managerSchema },
  onSubmit: async ({ value }) => {
   console.log("Form data saved:", value);
   toast.success("Đã lưu từ vựng: " + value.hanzi);
   form.reset();
  },
 });

 const handleAiAutoFill = async () => {
  const hanziValue = form.getFieldValue("hanzi");
  if (!hanziValue) {
   toast.error("Vui lòng nhập Chữ Hán trước khi tự động điền.");
   return;
  }

  setIsAiLoading(true);

  setTimeout(() => {
   form.setFieldValue("pinyin", "nǐ hǎo");
   form.setFieldValue("meaning", "Xin chào");
   form.setFieldValue("components", "Nỉ (bạn) + Hảo (tốt)");
   form.setFieldValue("logic", "Chúc bạn tốt lành");
   form.setFieldValue("fixedPhrases", "你好吗 (Bạn khỏe không?)");
   form.setFieldValue("example", "A: 你好！\nB: 你好！");
   form.setFieldValue("trap", "Không dịch là 'bạn tốt'");
   setIsAiLoading(false);
   toast.success("Tự động điền thành công!");
  }, 1500);
 };

 return (
  <form
   onSubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
   }}
   className={clsx(
    "flex flex-col gap-8 transition-opacity",
    isAiLoading && "opacity-60 pointer-events-none",
   )}
  >
   <div>
    <h2 className="text-xl font-bold text-slate-800 mb-6">Thông tin Cơ bản</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     <form.AppField name="hanzi">
      {(field) => (
       <div className="flex flex-col">
        <label className="text-sm font-semibold text-slate-700 mb-2">
         Chữ Hán <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
         <input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12 transition-all"
          placeholder="VD: 你好"
         />
         <button
          type="button"
          onClick={handleAiAutoFill}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          title="AI Auto-Fill"
         >
          {isAiLoading ? (
           <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
           <Sparkles className="w-4 h-4" />
          )}
         </button>
        </div>
        {field.state.meta.errors.length > 0 ? (
         <p className="text-xs text-rose-500 mt-1">
          {field.state.meta.errors.join(", ")}
         </p>
        ) : null}
       </div>
      )}
     </form.AppField>

     <form.AppField name="pinyin">
      {(field) => (
       <field.TextField
        label="Pinyin"
        inputProps={{ required: true, placeholder: "VD: nǐ hǎo" }}
       />
      )}
     </form.AppField>

     <form.AppField name="meaning">
      {(field) => (
       <field.TextField
        label="Hán Việt / Ý nghĩa"
        inputProps={{ required: true, placeholder: "VD: Xin chào" }}
       />
      )}
     </form.AppField>
    </div>
   </div>

   <hr className="border-t border-slate-100" />

   <div>
    <h2 className="text-xl font-bold text-slate-800 mb-6">
     Phân tích Chiều sâu
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
     <div className="flex flex-col gap-6">
      <form.AppField name="components">
       {(field) => (
        <field.TextareaField
         label="Chiết tự"
         placeholder="Phân tích các bộ thủ cấu tạo thành chữ..."
        />
       )}
      </form.AppField>

      <form.AppField name="logic">
       {(field) => (
        <field.TextareaField
         label="Core Logic"
         placeholder="Giải thích quá trình tư duy hoặc logic mấu chốt..."
        />
       )}
      </form.AppField>

      <form.AppField name="fixedPhrases">
       {(field) => (
        <field.TextareaField
         label="Cụm từ cố định"
         placeholder="Liệt kê các cụm từ thường đi kèm..."
        />
       )}
      </form.AppField>
     </div>

     <div className="flex flex-col gap-6">
      <form.AppField name="example">
       {(field) => (
        <field.TextareaField
         label="Ví dụ thực chiến"
         placeholder="Cung cấp các mẫu câu hội thoại thực tế..."
        />
       )}
      </form.AppField>

      <form.AppField name="trap">
       {(field) => (
        <div className="flex flex-col gap-2">
         <label className="text-sm font-semibold text-rose-700">
          Bẫy Tiếng Việt
         </label>
         <textarea
          value={field.state.value || ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder="Cảnh báo các cách dùng sai do thói quen tư duy Tiếng Việt..."
          className="w-full min-h-[120px] bg-rose-50 border border-rose-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none text-rose-900"
         />
        </div>
       )}
      </form.AppField>
     </div>
    </div>
   </div>

   <div className="flex justify-end pt-6 border-t border-slate-100">
    <form.Subscribe
     selector={(state) => [state.canSubmit, state.isSubmitting] as const}
    >
     {([canSubmit, isSubmitting]) => (
      <button
       type="submit"
       disabled={!canSubmit || isSubmitting}
       className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-indigo-700 transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {isSubmitting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
       ) : (
        <Save className="w-5 h-5" />
       )}
       Lưu Từ Vựng
      </button>
     )}
    </form.Subscribe>
   </div>
  </form>
 );
}
