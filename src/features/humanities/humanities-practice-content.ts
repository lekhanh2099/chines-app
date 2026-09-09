export type HumanitiesPracticeTrack = "translation" | "interpreting";

export type HumanitiesFoundationLesson = {
 title: string;
 question: string;
 explanation: string;
};

export type HumanitiesPracticeLevel = {
 title: string;
 description: string;
};

type HumanitiesPracticeTrackContent = {
 definition: string;
 beginnerStart: string;
 detailStart: string;
 workflow: readonly string[];
 foundationLessons: readonly HumanitiesFoundationLesson[];
 levels: readonly HumanitiesPracticeLevel[];
 knowledge: readonly string[];
 skills: readonly string[];
 mistakes: readonly string[];
 sourceReminder: string;
};

export const humanitiesPracticeContent: Record<
 HumanitiesPracticeTrack,
 HumanitiesPracticeTrackContent
> = {
 translation: {
  definition:
   "Biên dịch là chuyển một thông điệp viết sang ngôn ngữ khác cho đúng mục đích và người đọc, không phải thay từng từ Trung bằng một từ Việt.",
  beginnerStart:
   "Đầu tiên học cách đọc yêu cầu, chia đơn vị ý, dịch nháp và kiểm tra; chỉ sau đó mới học thuật ngữ, văn phong và công nghệ.",
  detailStart:
   "Bài đầu dùng câu ngắn đời sống và cho sẵn khung phân tích; chưa yêu cầu văn phong chuyên nghiệp ngay.",
  workflow: [
   "Đọc yêu cầu dịch và phân tích văn bản nguồn",
   "Đánh dấu đơn vị ý",
   "Tra cứu và lập bảng thuật ngữ",
   "Viết bản đầu không nhìn phương án tham khảo",
   "Sửa bản dịch theo bộ tiêu chí",
   "Dịch ngược và tự nhận xét",
  ],
  foundationLessons: [
   {
    title: "Biên dịch là gì?",
    question: "Vì sao biết tiếng Trung chưa đồng nghĩa biết dịch?",
    explanation:
     "Người dịch phải hiểu thông điệp, mục đích, người đọc và viết lại bằng tiếng đích; tra nghĩa từ chỉ là một phần nhỏ.",
   },
   {
    title: "Đọc yêu cầu dịch",
    question: "Ai sẽ đọc bản dịch và dùng nó để làm gì?",
    explanation: "Yêu cầu dịch quyết định sắc thái, mức giải thích và cách chọn từ trong bản đích.",
   },
   {
    title: "Chia câu thành đơn vị ý",
    question: "Phải giữ những gì dù câu chữ thay đổi?",
    explanation:
     "Đơn vị ý gồm người, hành động, đối tượng, thời gian, nơi chốn, số liệu, phủ định và quan hệ logic.",
   },
   {
    title: "Tạo bản nháp",
    question: "Có cần dịch từng chữ theo thứ tự không?",
    explanation:
     "Bản nháp nên giữ đủ ý trước; sau đó mới đổi trật tự, tách–gộp câu và chọn từ tự nhiên.",
   },
   {
    title: "Tra cứu và quản lý thuật ngữ",
    question: "Dùng từ điển thế nào để không chọn nghĩa đầu tiên?",
    explanation:
     "Tra cả từ, ngữ cảnh, kết hợp từ và lĩnh vực; ghi nguồn và giữ thuật ngữ nhất quán.",
   },
   {
    title: "Sửa và kiểm tra bản dịch",
    question: "Sửa câu trôi có đủ chưa?",
    explanation:
     "Kiểm tra đúng nghĩa, đủ ý, đúng logic, đúng thuật ngữ, đúng sắc thái rồi mới tới độ tự nhiên.",
   },
  ],
  levels: [
   {
    title: "Xem bài dịch mẫu từng bước",
    description: "Mỗi quyết định được giải thích từ yêu cầu đến lần sửa cuối.",
   },
   {
    title: "Dịch có khung đơn vị ý",
    description: "Hệ thống cho câu hỏi dẫn và phần bắt buộc phải giữ.",
   },
   {
    title: "Tự dịch và tự sửa",
    description: "Chỉ mở phương án tham khảo sau khi đã nộp bản đầu.",
   },
  ],
  knowledge: [
   "Yêu cầu dịch, người đọc đích, sắc thái và văn phong",
   "Logic, tình thái, phủ định và thuật ngữ",
   "Tra cứu, lần sửa và kiểm soát chất lượng",
  ],
  skills: [
   "Phân tích nguồn trước khi dịch",
   "Giữ đủ ý và số liệu",
   "Tạo nhiều phương án hợp lệ",
   "Sửa bản dịch và dịch ngược",
  ],
  mistakes: [
   "Thay từng từ và giữ nguyên trật tự câu Trung.",
   "Mở bản tham khảo trước khi tự phân tích.",
   "Chỉ sửa cho câu trôi mà không kiểm tra phần bị mất hoặc thêm.",
  ],
  sourceReminder: "Giữ đủ người, hành động, số liệu, phủ định và quan hệ logic.",
 },
 interpreting: {
  definition:
   "Phiên dịch là nghe hoặc đọc một thông điệp rồi chuyển bằng lời nói gần như ngay lập tức; người học phải đồng thời hiểu, nhớ, chọn ý, diễn đạt và tự kiểm soát.",
  beginnerStart:
   "Đầu tiên học cách nghe ý, ghi chú, truyền đạt và tự kiểm tra; chỉ sau đó mới tăng độ dài và tốc độ.",
  detailStart:
   "Bài đầu dùng đoạn ngắn và giới hạn số lần nghe lại để người học hình thành thói quen nghe ý.",
  workflow: [
   "Nghe hoặc đọc hết đoạn và nắm thông điệp chính",
   "Ghi chú người, hành động, số liệu và quan hệ logic",
   "Truyền đạt đủ đơn vị thông tin bằng lời tự nhiên",
   "Tự đánh dấu ý đã giữ và ý còn thiếu",
   "Nghe lại bản ghi và sửa cách diễn đạt",
  ],
  foundationLessons: [
   {
    title: "Phiên dịch khác biên dịch",
    question: "Vì sao phiên dịch cần giữ ý trước câu chữ?",
    explanation:
     "Phiên dịch diễn ra dưới áp lực thời gian; phải ưu tiên thông điệp, độ đủ ý và sự rõ ràng.",
   },
   {
    title: "Nghe ý và ghi chú",
    question: "Ghi gì để không quên quan hệ giữa các ý?",
    explanation:
     "Ghi người, hành động, số liệu, phủ định và quan hệ logic thay vì chép nguyên câu.",
   },
   {
    title: "Bắt đầu từ đoạn ngắn",
    question: "Làm sao tăng độ dài mà không mất ý?",
    explanation: "Tăng dần độ dài, mật độ thông tin, tốc độ và số lần nghe lại.",
   },
   {
    title: "Trình bày bằng lời",
    question: "Nói thế nào để người nghe theo kịp?",
    explanation: "Ưu tiên câu rõ, nhịp ổn định và từ nối giúp người nghe nhận ra cấu trúc.",
   },
   {
    title: "Phục hồi khi quên",
    question: "Làm gì khi bỏ sót một chi tiết?",
    explanation:
     "Giữ mạch thông điệp, đánh dấu phần chưa chắc và phục hồi sau khi hoàn thành ý chính.",
   },
   {
    title: "Tự đánh giá bản ghi",
    question: "Dựa vào đâu để biết mình đã truyền đạt đủ?",
    explanation: "Đối chiếu từng đơn vị thông tin và nghe lại để sửa nội dung lẫn cách diễn đạt.",
   },
  ],
  levels: [
   {
    title: "Xem bài mẫu từng bước",
    description: "Theo dõi cách nghe ý, ghi chú và phục hồi thông điệp.",
   },
   {
    title: "Phiên dịch có khung",
    description: "Đánh dấu các đơn vị thông tin bắt buộc phải truyền đạt.",
   },
   {
    title: "Tự phiên dịch và tự sửa",
    description: "Ghi âm, tự đánh dấu ý và xem lại sau khi hoàn thành.",
   },
  ],
  knowledge: [
   "Thông điệp chính và quan hệ giữa các ý",
   "Ghi chú, trí nhớ và số liệu",
   "Tốc độ, phục hồi và tự đánh giá bản ghi",
  ],
  skills: [
   "Nghe và ghi chú theo đơn vị ý",
   "Truyền đạt rõ dưới áp lực thời gian",
   "Tự đánh dấu ý đã giữ",
   "Nghe lại và phục hồi",
  ],
  mistakes: [
   "Chép nguyên câu thay vì ghi ý.",
   "Nghe lại quá nhiều lần mà không tự nói.",
   "Bỏ qua phần chưa chắc thay vì đánh dấu để phục hồi.",
  ],
  sourceReminder: "Giữ đủ người, hành động, số liệu, phủ định và quan hệ logic.",
 },
};
