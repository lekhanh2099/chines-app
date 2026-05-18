export type HskVocabItem = {
 hanzi: string;
 pinyin: string;
 type: string;
 vi: string;
 example: string;
};

export type HskPhraseItem = {
 hanzi: string;
 pinyin: string;
 vi: string;
 example: string;
};

export type HskGrammarItem = {
 title: string;
 formula: string;
 note: string;
 example: string;
};

export type HskTextItem = {
 title: string;
 body: string;
};

export type HskQuizItem =
 | {
    type: "choice";
    q: string;
    options: string[];
    answer: string;
    explain: string;
   }
 | {
    type: "fill";
    q: string;
    answer: string;
    hint: string;
   }
 | {
    type: "order";
    q: string;
    parts: string[];
    answer: string;
   };

export const hsk4Bai1Vocab: HskVocabItem[] = [
 { hanzi: "法律", pinyin: "fǎlǜ", type: "dt", vi: "pháp luật", example: "我想学习法律，成为一名律师。" },
 { hanzi: "律师", pinyin: "lǜshī", type: "dt", vi: "luật sư", example: "她想成为一名律师。" },
 { hanzi: "法官", pinyin: "fǎguān", type: "dt", vi: "thẩm phán", example: "法官正在工作。" },
 { hanzi: "法院", pinyin: "fǎyuàn", type: "dt", vi: "tòa án", example: "他明天要去法院。" },
 { hanzi: "证据", pinyin: "zhèngjù", type: "dt", vi: "bằng chứng", example: "这件事需要证据。" },
 { hanzi: "被告", pinyin: "bèigào", type: "dt", vi: "bị cáo", example: "被告没有说话。" },
 { hanzi: "原告", pinyin: "yuángào", type: "dt", vi: "nguyên cáo", example: "原告提供了证据。" },
 { hanzi: "俩", pinyin: "liǎ", type: "số lượng", vi: "hai, hai người", example: "她们俩是好朋友。" },
 { hanzi: "印象", pinyin: "yìnxiàng", type: "dt", vi: "ấn tượng", example: "我对他印象很深。" },
 { hanzi: "深", pinyin: "shēn", type: "tt", vi: "sâu, đậm, sâu sắc", example: "水太深了。" },
 { hanzi: "熟悉", pinyin: "shúxi", type: "đgt", vi: "quen thuộc, hiểu rõ", example: "我对这个地方特别熟悉。" },
 { hanzi: "知道", pinyin: "zhīdào", type: "đgt", vi: "biết", example: "我知道她，但我不认识她。" },
 { hanzi: "认识", pinyin: "rènshi", type: "đgt", vi: "quen, nhận biết", example: "我们是在比赛中认识的。" },
 { hanzi: "性格", pinyin: "xìnggé", type: "dt", vi: "tính cách", example: "他的性格非常开朗。" },
 { hanzi: "脾气", pinyin: "píqi", type: "dt", vi: "tính khí", example: "他的脾气也不错。" },
 { hanzi: "开朗", pinyin: "kāilǎng", type: "tt", vi: "cởi mở, vui vẻ", example: "她的性格很开朗。" },
 { hanzi: "外向", pinyin: "wàixiàng", type: "tt", vi: "hướng ngoại", example: "你是外向的人吗？" },
 { hanzi: "内向", pinyin: "nèixiàng", type: "tt", vi: "hướng nội", example: "他比较内向。" },
 { hanzi: "古怪", pinyin: "gǔguài", type: "tt", vi: "kỳ lạ, cổ quái", example: "他的性格有点儿古怪。" },
 { hanzi: "不仅", pinyin: "bùjǐn", type: "liên từ", vi: "không những", example: "他不仅聪明，也很努力。" },
 { hanzi: "新闻", pinyin: "xīnwén", type: "dt", vi: "tin tức, báo chí", example: "他学的是新闻。" },
 { hanzi: "专业", pinyin: "zhuānyè", type: "dt", vi: "chuyên ngành", example: "你的专业是什么？" },
 { hanzi: "同学", pinyin: "tóngxué", type: "dt", vi: "bạn học", example: "他是我的同学。" },
 { hanzi: "比赛", pinyin: "bǐsài", type: "dt/đgt", vi: "trận đấu, thi đấu", example: "我们班跟他们班比赛。" },
 { hanzi: "踢", pinyin: "tī", type: "đgt", vi: "đá", example: "他足球踢得很好。" },
 { hanzi: "身高", pinyin: "shēngāo", type: "dt", vi: "chiều cao", example: "你的身高是多少？" },
 { hanzi: "体重", pinyin: "tǐzhòng", type: "dt", vi: "cân nặng", example: "他的体重是六十公斤。" },
 { hanzi: "头发", pinyin: "tóufa", type: "dt", vi: "tóc", example: "她的头发很长。" },
 { hanzi: "眼睛", pinyin: "yǎnjing", type: "dt", vi: "mắt", example: "她有大眼睛。" },
 { hanzi: "长发", pinyin: "chángfà", type: "dt", vi: "tóc dài", example: "她是长发。" },
 { hanzi: "短发", pinyin: "duǎnfà", type: "dt", vi: "tóc ngắn", example: "他是短发。" },
 { hanzi: "直发", pinyin: "zhífà", type: "dt", vi: "tóc thẳng", example: "她是直发。" },
 { hanzi: "卷发", pinyin: "juǎnfà", type: "dt", vi: "tóc xoăn", example: "我妹妹是卷发。" },
 { hanzi: "幽默", pinyin: "yōumò", type: "tt", vi: "hài hước", example: "他是个很幽默的人。" },
 { hanzi: "可爱", pinyin: "kě'ài", type: "tt", vi: "dễ thương", example: "这个孩子很可爱。" },
 { hanzi: "安静", pinyin: "ānjìng", type: "tt", vi: "yên tĩnh, trầm lặng", example: "她很安静。" },
 { hanzi: "认真", pinyin: "rènzhēn", type: "tt", vi: "nghiêm túc", example: "他工作很认真。" },
 { hanzi: "运动", pinyin: "yùndòng", type: "dt/đgt", vi: "vận động, thể thao", example: "他喜欢运动。" },
 { hanzi: "电影", pinyin: "diànyǐng", type: "dt", vi: "phim", example: "她喜欢看电影。" },
 { hanzi: "音乐", pinyin: "yīnyuè", type: "dt", vi: "âm nhạc", example: "我喜欢音乐。" },
 { hanzi: "最好", pinyin: "zuìhǎo", type: "phó từ", vi: "tốt nhất là", example: "你最好准时来。" },
 { hanzi: "幸福", pinyin: "xìngfú", type: "tt/dt", vi: "hạnh phúc", example: "祝你们幸福！" },
 { hanzi: "适合", pinyin: "shìhé", type: "đgt", vi: "phù hợp với", example: "这件衣服适合我。" },
 { hanzi: "合适", pinyin: "héshì", type: "tt", vi: "phù hợp", example: "这个方法很合适。" },
 { hanzi: "从来", pinyin: "cónglái", type: "phó từ", vi: "từ trước đến nay", example: "他从来不迟到。" },
 { hanzi: "共同", pinyin: "gòngtóng", type: "tt/phó từ", vi: "chung, cùng", example: "我们有共同的爱好。" },
 { hanzi: "兴趣", pinyin: "xìngqù", type: "dt", vi: "hứng thú", example: "我对历史感兴趣。" },
 { hanzi: "爱好", pinyin: "àihào", type: "dt/đgt", vi: "sở thích, yêu thích", example: "你的爱好是什么？" },
 { hanzi: "浪漫", pinyin: "làngmàn", type: "tt", vi: "lãng mạn", example: "她喜欢浪漫的电影。" },
 { hanzi: "缺点", pinyin: "quēdiǎn", type: "dt", vi: "khuyết điểm", example: "每个人都有缺点。" },
 { hanzi: "优点", pinyin: "yōudiǎn", type: "dt", vi: "ưu điểm", example: "你的优点是什么？" },
 { hanzi: "生活", pinyin: "shēnghuó", type: "dt/đgt", vi: "cuộc sống, sống", example: "我们的生活很幸福。" },
 { hanzi: "刚", pinyin: "gāng", type: "phó từ", vi: "vừa mới", example: "我刚到。" },
 { hanzi: "刚才", pinyin: "gāngcái", type: "dt thời gian", vi: "vừa nãy", example: "刚才你不在。" },
 { hanzi: "丈夫", pinyin: "zhàngfu", type: "dt", vi: "chồng", example: "我和丈夫刚结婚。" },
 { hanzi: "妻子", pinyin: "qīzi", type: "dt", vi: "vợ", example: "他跟妻子结婚二十年了。" },
 { hanzi: "结婚", pinyin: "jiéhūn", type: "đgt", vi: "kết hôn", example: "我下个月结婚。" },
 { hanzi: "新鲜", pinyin: "xīnxiān", type: "tt", vi: "mới mẻ, tươi", example: "每天都觉得新鲜。" },
 { hanzi: "接受", pinyin: "jiēshòu", type: "đgt", vi: "chấp nhận", example: "我接受了他的礼物。" },
 { hanzi: "够", pinyin: "gòu", type: "đgt/tt", vi: "đủ", example: "这些钱够了。" },
 { hanzi: "羡慕", pinyin: "xiànmù", type: "đgt", vi: "ngưỡng mộ, ao ước", example: "我很羡慕她。" },
 { hanzi: "爱情", pinyin: "àiqíng", type: "dt", vi: "tình yêu", example: "爱情很重要。" },
 { hanzi: "友情", pinyin: "yǒuqíng", type: "dt", vi: "tình bạn", example: "爱情和友情有什么区别？" },
 { hanzi: "星星", pinyin: "xīngxing", type: "dt", vi: "ngôi sao", example: "夜晚的星星很美。" },
 { hanzi: "太阳", pinyin: "tàiyáng", type: "dt", vi: "mặt trời", example: "太阳出来了。" },
 { hanzi: "月亮", pinyin: "yuèliang", type: "dt", vi: "mặt trăng", example: "今晚的月亮很亮。" },
 { hanzi: "即使", pinyin: "jíshǐ", type: "liên từ", vi: "cho dù", example: "即使下雨，我也去。" },
 { hanzi: "加班", pinyin: "jiābān", type: "đgt", vi: "tăng ca", example: "他经常加班。" },
 { hanzi: "亮", pinyin: "liàng", type: "tt/đgt", vi: "sáng, phát sáng", example: "灯还亮着。" },
 { hanzi: "感动", pinyin: "gǎndòng", type: "đgt/tt", vi: "cảm động", example: "这个故事让我很感动。" },
 { hanzi: "感到", pinyin: "gǎndào", type: "đgt", vi: "cảm thấy", example: "我感到很幸福。" },
 { hanzi: "感冒", pinyin: "gǎnmào", type: "đgt/dt", vi: "cảm lạnh", example: "我感冒了。" },
 { hanzi: "自然", pinyin: "zìrán", type: "phó từ", vi: "đương nhiên, tự nhiên", example: "努力学习，自然会进步。" },
 { hanzi: "原因", pinyin: "yuányīn", type: "dt", vi: "nguyên nhân", example: "原因是什么？" },
 { hanzi: "互相", pinyin: "hùxiāng", type: "phó từ", vi: "lẫn nhau", example: "我们要互相帮助。" },
 { hanzi: "吸引", pinyin: "xīyǐn", type: "đgt", vi: "thu hút, hấp dẫn", example: "这个故事很吸引人。" },
 { hanzi: "普通", pinyin: "pǔtōng", type: "tt", vi: "bình thường", example: "这是一件普通的事。" },
 { hanzi: "难过", pinyin: "nánguò", type: "tt", vi: "buồn, khó chịu", example: "她今天很难过。" },
 { hanzi: "办法", pinyin: "bànfǎ", type: "dt", vi: "cách, biện pháp", example: "我有一个办法。" },
 { hanzi: "几乎", pinyin: "jīhū", type: "phó từ", vi: "gần như", example: "我几乎每天学习中文。" },
];

export const hsk4Bai1Phrases: HskPhraseItem[] = [
 { hanzi: "留下深刻的印象", pinyin: "liúxià shēnkè de yìnxiàng", vi: "để lại ấn tượng sâu sắc", example: "赵老师给我留下了非常深刻的印象。" },
 { hanzi: "对……印象很深", pinyin: "duì... yìnxiàng hěn shēn", vi: "có ấn tượng sâu sắc với…", example: "我对他印象很深。" },
 { hanzi: "慢慢熟悉", pinyin: "mànmàn shúxi", vi: "dần dần quen thuộc", example: "后来我们就慢慢熟悉了。" },
 { hanzi: "不仅……也/还/而且……", pinyin: "bùjǐn... yě/hái/érqiě...", vi: "không những… mà còn…", example: "他不仅足球踢得好，性格也不错。" },
 { hanzi: "共同的兴趣和爱好", pinyin: "gòngtóng de xìngqù hé àihào", vi: "hứng thú và sở thích chung", example: "两个人在一起，最好有共同的兴趣和爱好。" },
 { hanzi: "找到适合自己的人", pinyin: "zhǎodào shìhé zìjǐ de rén", vi: "tìm được người phù hợp với mình", example: "看来你真的找到适合你的人了。" },
 { hanzi: "祝你们幸福", pinyin: "zhù nǐmen xìngfú", vi: "chúc hai người hạnh phúc", example: "祝你们幸福！" },
 { hanzi: "从来没……过", pinyin: "cónglái méi... guo", vi: "trước giờ chưa từng…", example: "我从来没这么快乐过。" },
 { hanzi: "你是在开玩笑吧？", pinyin: "nǐ shì zài kāiwánxiào ba?", vi: "bạn đang đùa đấy à?", example: "你是在开玩笑吧？" },
 { hanzi: "刚结婚的时候", pinyin: "gāng jiéhūn de shíhou", vi: "lúc vừa mới kết hôn", example: "我和丈夫刚结婚的时候，每天都觉得新鲜。" },
 { hanzi: "有说不完的话", pinyin: "yǒu shuō bu wán de huà", vi: "có chuyện nói mãi không hết", example: "我们在一起有说不完的话。" },
 { hanzi: "只有……才……", pinyin: "zhǐyǒu... cái...", vi: "chỉ khi… thì mới…", example: "只有接受了他的缺点，你们才能更好地一起生活。" },
 { hanzi: "浪漫和新鲜感", pinyin: "làngmàn hé xīnxiāngǎn", vi: "sự lãng mạn và cảm giác mới mẻ", example: "只有浪漫和新鲜感是不够的。" },
 { hanzi: "接受他的缺点", pinyin: "jiēshòu tā de quēdiǎn", vi: "chấp nhận khuyết điểm của anh ấy", example: "只有接受了他的缺点，才能更好地一起生活。" },
 { hanzi: "即使……也……", pinyin: "jíshǐ... yě...", vi: "cho dù… cũng…", example: "即使晚上加班到零点，家里也还亮着灯。" },
 { hanzi: "加班到零点", pinyin: "jiābān dào língdiǎn", vi: "tăng ca đến 0 giờ", example: "他晚上加班到零点。" },
 { hanzi: "家里还亮着灯", pinyin: "jiālǐ hái liàngzhe dēng", vi: "trong nhà vẫn còn sáng đèn", example: "到家时，家里还亮着灯。" },
 { hanzi: "一起慢慢变老", pinyin: "yìqǐ mànmàn biàn lǎo", vi: "cùng nhau từ từ già đi", example: "我能想到最浪漫的事，就是和你一起慢慢变老。" },
 { hanzi: "简单的爱情", pinyin: "jiǎndān de àiqíng", vi: "tình yêu giản dị", example: "让我们感动的，就是生活中简单的爱情。" },
 { hanzi: "最大的幸福", pinyin: "zuì dà de xìngfú", vi: "hạnh phúc lớn nhất", example: "有时候，简单就是最大的幸福。" },
 { hanzi: "说到结婚", pinyin: "shuōdào jiéhūn", vi: "nhắc đến kết hôn", example: "说到结婚，人们就会想起爱情。" },
 { hanzi: "自然地想起爱情", pinyin: "zìrán de xiǎngqǐ àiqíng", vi: "tự nhiên nghĩ đến tình yêu", example: "人们就会很自然地想起爱情。" },
 { hanzi: "性格上互相吸引", pinyin: "xìnggé shang hùxiāng xīyǐn", vi: "thu hút lẫn nhau về mặt tính cách", example: "更需要性格上互相吸引。" },
 { hanzi: "从他嘴里说出来", pinyin: "cóng tā zuǐ lǐ shuō chūlái", vi: "từ miệng anh ấy nói ra", example: "即使是很普通的事情，从他嘴里说出来也会变得很有意思。" },
 { hanzi: "让我高兴起来", pinyin: "ràng wǒ gāoxìng qǐlái", vi: "khiến tôi vui lên", example: "他总是有办法让我高兴起来。" },
 { hanzi: "几乎没红过脸", pinyin: "jīhū méi hóng guo liǎn", vi: "gần như chưa từng cãi nhau/mất hòa", example: "我们俩几乎没因为什么事红过脸。" },
 { hanzi: "在……上", pinyin: "zài... shang", vi: "về mặt/khía cạnh…", example: "他在学习上有很大的成果。" },
];

export const hsk4Bai1Grammar: HskGrammarItem[] = [
 { title: "不仅……也/还/而且……", formula: "Chủ ngữ + 不仅……，也/还/而且……", note: "Dùng để nói 'không những… mà còn…'. Nếu 2 vế khác chủ ngữ, 不仅 đứng trước chủ ngữ 1.", example: "他不仅足球踢得好，性格也不错。" },
 { title: "最好", formula: "主语 + 最好 + động từ/cụm động từ", note: "Dùng để đưa ra lời khuyên: tốt nhất nên…", example: "你最好多穿点儿衣服。" },
 { title: "适合 vs 合适", formula: "A 适合 B / A 很合适", note: "适合 là động từ, thường có tân ngữ. 合适 là tính từ, không trực tiếp mang tân ngữ.", example: "这件衣服适合我。/ 我穿这件衣服不合适。" },
 { title: "从来", formula: "从来不…… / 从来没……", note: "Thường dùng trong câu phủ định để nói 'trước giờ không/chưa từng'.", example: "我从来没这么快乐过。" },
 { title: "刚 vs 刚才", formula: "刚 + V / 刚才 + câu", note: "刚 là phó từ đứng trước động từ. 刚才 là danh từ chỉ thời gian: vừa nãy.", example: "我刚给妈妈打了电话。/ 刚才你不在。" },
 { title: "只有……才……", formula: "只有 + điều kiện，才 + kết quả", note: "Chỉ khi có điều kiện này thì kết quả mới xảy ra.", example: "只有接受了他的缺点，你们才能更好地一起生活。" },
 { title: "即使……也……", formula: "即使……，也……", note: "Cho dù… cũng…; diễn tả nhượng bộ.", example: "即使晚上加班到零点，家里也还亮着灯。" },
 { title: "在……上", formula: "在 + phương diện + 上", note: "Ngoài nghĩa vị trí, còn dùng để nói 'về mặt/khía cạnh'.", example: "两个人共同生活，更需要性格上互相吸引。" },
];

export const hsk4Bai1Texts: HskTextItem[] = [
 { title: "课文 1", body: "孙月：听说你男朋友李进跟你是一个学校的，是你同学吗？\n王静：是的，他学的是新闻，我学的是法律，我和他不是一个班。\n孙月：那你们俩是怎么认识的？\n王静：我们是在一次足球比赛中认识的。我们班跟他们班比赛，他一个人踢进两个球，我对他印象很深，后来就慢慢熟悉了。\n孙月：你为什么喜欢他？\n王静：他不仅足球踢得好，性格也不错。" },
 { title: "课文 2", body: "王静：李老师，我下个月五号就要结婚了。\n李老师：你是在开玩笑吧？你们不是才认识一个月？\n王静：虽然我们认识的时间不长，但我从来没这么快乐过。\n李老师：两个人在一起，最好能有共同的兴趣和爱好。\n王静：我们有很多共同的爱好，经常一起打球、唱歌、做菜。\n李老师：看来你真的找到适合你的人了。祝你们幸福！" },
 { title: "课文 3", body: "高老师：听说您跟妻子结婚快二十年了？\n李老师：到6月9号，我们就结婚二十年了。这么多年，我们的生活一直挺幸福的。\n高老师：我和丈夫刚结婚的时候，每天都觉得新鲜，在一起有说不完的话。但是现在……\n李老师：两个人共同生活，只有浪漫和新鲜感是不够的。\n高老师：你说得对！我现在每天看到的都是他的缺点。\n李老师：两个人在一起时间长了，就会有很多问题，只有接受了他的缺点，你们才能更好地一起生活。" },
 { title: "课文 4", body: "很多女孩子羡慕浪漫的爱情。那什么是浪漫呢？年轻人说：浪漫是她想要月亮时，你不会给她星星；中年人说：浪漫是即使晚上加班到零点，到家时，自己家里也还亮着灯；老年人说：浪漫其实就像歌中唱的那样，“我能想到最浪漫的事，就是和你一起慢慢变老。”其实，让我们感动的，就是生活中简单的爱情。有时候，简单就是最大的幸福。" },
 { title: "课文 5", body: "说到结婚，人们就会很自然地想起爱情。爱情是结婚的重要原因，因为两个人共同生活，不仅需要浪漫的爱情，更需要性格上互相吸引。我丈夫是个很幽默的人。即使是很普通的事情，从他嘴里说出来也会变得很有意思。在我难过的时候，他总是有办法让我高兴起来。而且他的脾气也不错，结婚快十年了，我们俩几乎没因为什么事红过脸，很多人都特别羡慕我们。" },
];

export const hsk4Bai1Quiz: HskQuizItem[] = [
 { type: "choice", q: "'适合' đúng cách dùng nào?", options: ["这件衣服适合我。", "这件衣服适合。", "我适合。", "他很适合。"], answer: "这件衣服适合我。", explain: "适合 là động từ, thường cần tân ngữ phía sau." },
 { type: "choice", q: "Chọn từ đúng: 我对这本书的内容非常____。", options: ["知道", "认识", "熟悉", "共同"], answer: "熟悉", explain: "熟悉 dùng khi hiểu rõ nội dung/người/nơi/môi trường." },
 { type: "choice", q: "'从来没这么快乐过' nghĩa là gì?", options: ["Trước giờ chưa từng vui như vậy", "Tôi vừa mới vui", "Tôi thường vui như vậy", "Tôi không muốn vui"], answer: "Trước giờ chưa từng vui như vậy", explain: "从来没……过 = trước giờ chưa từng…." },
 { type: "choice", q: "Câu nào dùng 不仅 đúng?", options: ["他不仅足球踢得好，性格也不错。", "他足球不仅踢得好，性格不错也。", "不仅他足球，性格也。", "他不仅也足球踢得好。"], answer: "他不仅足球踢得好，性格也不错。", explain: "Cùng chủ ngữ: 主语 + 不仅……，也……." },
 { type: "choice", q: "'即使……也……' diễn tả quan hệ gì?", options: ["nhượng bộ", "nguyên nhân", "mục đích", "so sánh"], answer: "nhượng bộ", explain: "即使……也…… = cho dù… cũng…." },
 { type: "fill", q: "Điền từ: 你是在____吧？", answer: "开玩笑", hint: "nói đùa" },
 { type: "fill", q: "Điền từ: 两个人在一起，最好有____的兴趣和爱好。", answer: "共同", hint: "chung" },
 { type: "fill", q: "Điền từ: 只有____他的缺点，你们才能更好地一起生活。", answer: "接受", hint: "chấp nhận" },
 { type: "fill", q: "Điền từ: 很多人都特别____我们。", answer: "羡慕", hint: "ngưỡng mộ" },
 { type: "fill", q: "Điền từ: 爱情是结婚的重要____。", answer: "原因", hint: "nguyên nhân" },
 { type: "order", q: "Sắp xếp câu:", parts: ["他", "不仅", "足球踢得好", "性格", "也", "不错"], answer: "他不仅足球踢得好，性格也不错" },
 { type: "order", q: "Sắp xếp câu:", parts: ["我", "从来", "没", "这么", "快乐", "过"], answer: "我从来没这么快乐过" },
 { type: "order", q: "Sắp xếp câu:", parts: ["这件衣服", "不", "适合", "我"], answer: "这件衣服不适合我" },
];

export const hsk4Bai1Lesson = {
 key: "hsk4-bai-1",
 hskLevel: "HSK 4",
 lessonNumber: 1,
 title: "简单的爱情",
 subtitle: "App ôn bài",
 description:
  "Ôn từ vựng chuẩn, cụm cố định, bài khóa, ngữ pháp và bài tập kiểm tra. Từ đơn với cụm được tách riêng cho dễ học.",
 vocab: hsk4Bai1Vocab,
 phrases: hsk4Bai1Phrases,
 grammar: hsk4Bai1Grammar,
 texts: hsk4Bai1Texts,
 quiz: hsk4Bai1Quiz,
};
