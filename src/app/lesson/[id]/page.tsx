import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";

// Mock Data for the lesson
const mockLessonData = {
 id: "1",
 title: "Bài 1: Xin chào",
 content: "你好！我叫王明。认识你很高兴。",
 dictionary: {
  你好: {
   pinyin: "nǐ hǎo",
   meaning: "Xin chào",
   components: "Nỉ (bạn) + Hảo (tốt)",
   logic: "Chúc bạn tốt lành",
   trap: "Không dịch là 'bạn tốt'",
   example: "你好吗？ (Bạn khỏe không?)",
  },
  我: {
   pinyin: "wǒ",
   meaning: "Tôi",
   components: "Bộ qua (cái thương) + thủ (tay)",
   logic: "Tay cầm vũ khí bảo vệ bản thân -> Tôi",
   trap: "Dùng cho cả nam và nữ",
   example: "我是学生 (Tôi là học sinh)",
  },
  高兴: {
   pinyin: "gāo xìng",
   meaning: "Vui vẻ, hân hạnh",
   components: "Cao (cao) + Hứng (hứng thú)",
   logic: "Tâm trạng dâng cao -> vui vẻ",
   trap: "Chỉ dùng cho cảm xúc nhất thời, không dùng cho tính cách",
   example: "今天我很高兴 (Hôm nay tôi rất vui)",
  },
 },
};

export default async function LessonPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;

 return (
  <div className="h-full w-full">
   <LessonWorkspace lesson={mockLessonData} />
  </div>
 );
}
