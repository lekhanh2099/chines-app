export type MandarinVoiceOption = {
 readonly shortName: string;
 readonly label: string;
 readonly description: string;
 readonly gender: "female" | "male";
};

export const STANDARD_MANDARIN_VOICES: readonly MandarinVoiceOption[] = [
 {
  shortName: "zh-CN-XiaoxiaoNeural",
  label: "Xiaoxiao (Nữ chuẩn - Phát thanh viên)",
  description:
   "Chuẩn phổ thông truyền hình, phát âm tròn vành rõ chữ, tối ưu học phát âm (Mặc định).",
  gender: "female",
 },
 {
  shortName: "zh-CN-YunxiNeural",
  label: "Yunxi (Nam chuẩn - Trẻ trung, tự nhiên)",
  description: "Giọng nam thanh niên hiện đại, lưu loát, tự nhiên như hội thoại thực tế.",
  gender: "male",
 },
 {
  shortName: "zh-CN-YunjianNeural",
  label: "Yunjian (Nam - Trầm ấm, truyền cảm)",
  description: "Giọng nam trầm ấm, phong thái đọc phóng sự, kể chuyện hoặc phim ảnh.",
  gender: "male",
 },
 {
  shortName: "zh-CN-XiaoyiNeural",
  label: "Xiaoyi (Nữ - Mềm mại, dịu dàng)",
  description: "Giọng nữ nhẹ nhàng, êm dịu, nhịp độ vừa phải dễ theo dõi.",
  gender: "female",
 },
 {
  shortName: "zh-CN-YunyangNeural",
  label: "Yunyang (Nam - Bản tin chuyên nghiệp)",
  description: "Giọng nam tin tức đài truyền hình, chuẩn xác từng thanh điệu, dứt khoát.",
  gender: "male",
 },
];
