import { ManagerForm } from "@/components/manager/ManagerForm";

export default function ManagerPage() {
 return (
  <div className="max-w-5xl mx-auto py-8">
   <div className="flex items-center justify-between mb-8">
    <div>
     <h1 className="text-3xl font-bold text-slate-900">Content Manager</h1>
     <p className="text-slate-500 mt-2">
      Thêm từ vựng hạt nhân mới vào hệ thống dữ liệu.
     </p>
    </div>
   </div>

   <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
    <ManagerForm />
   </div>
  </div>
 );
}
