import { describe, expect, it } from "vitest";
import {
 analyzeContextualPronunciation,
 formatContextualPinyinRange,
 formatContextualReading,
 formatContextualReadingPinyin,
 formatContextualReadingUnitPinyin,
 formatContextualSpokenPinyin,
 getContextualReadingUnits,
} from "./contextual-pronunciation";

describe("HanziHome contextual pronunciation", () => {
 it.each([
  {
   id: "nhip-cau-lesson-01-source-747",
   text:
    '2. 听录音填空： (Câu hoàn chỉnh trong tài liệu nguồn; không có vị trí trống) → (1) 我女儿17岁上大学，今年暑假以后 该 上二年级 了。\n(2) 原来，我和妻子 都 希望她能 利用 假期好好复习复习功课。 可 女儿说："我要 凭 自己的本事挣钱交学费。" 我们觉得她说的 也 有道理， 让 她试 着 锻炼锻炼吧。\n(3) 第一天下班回来，女儿激动得 不得了，觉得自己长 大 了， 能 挣钱了。\n(4) 临 睡觉的时候，女儿小声 对 妈妈说："妈，我现在 才 知道爸 和 您挣钱真不容易。"\n(5) 十天过去了，女儿的话又多 了。开学了，女儿结束 了 打工。她 把 挣的钱交 给 妈妈之后，好半天才说 出 一句话："将来一定 要 当老板！" 我和妻子都呆 了。',
   readings: [
    { start: 101, end: 102, char: "了", reading: "le5" },
    { start: 222, end: 223, char: "了", reading: "le5" },
    { start: 297, end: 298, char: "了", reading: "le5" },
    { start: 308, end: 309, char: "了", reading: "le5" },
    { start: 362, end: 363, char: "了", reading: "le5" },
   ],
  },
  {
   id: "nhip-cau-lesson-02-source-33",
   text:
    '有一天，差不多先生忽然得了急病，赶快叫家人去请东街的汪先生。那家人急急忙忙地跑去，一时寻不着东街汪大夫，却把西街的牛医王大夫请来了。差不多先生病在床上，知道寻错了人，但病急了，身上痛苦，心里焦急，等不得了，心里想到："好在王大夫同汪大夫也差不多，让他试试看吧。"于是，这位牛医王大夫走近床前，用医牛的方法给差不多先生治病。不到一个小时，差不多先生就死了。',
   readings: [{ start: 101, end: 102, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-02-source-652",
   text:
    "2. 听录音填空： (Câu hoàn chỉnh trong tài liệu nguồn; không có vị trí trống) → (1) 胖嫂结婚一年，就生了一个胖儿子，日子过得 很开心。\n(2) 晚上，胖嫂一个人 哄着 孩子睡觉。忽然有人敲门。\n(3) 胖嫂急得 不得了，马上抱起孩子就走。\n(4) 胖嫂走 着 走 着 就进了西瓜地。她 被 绊了一交，孩子也被摔 到 了地上。\n(5) 她连忙爬 起来，抱 起 孩子 就 走。\n(6) 到了娘家才发现她手里抱的并 不是 孩子，而 是 一个西瓜。\n(7) 进屋一看，发现孩子在床上睡得 正香呢。",
   readings: [{ start: 193, end: 194, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-03-source-33",
   text:
    "以后又谈了些什么，我记不得了。只记得走出她的宿舍时，脚下发软……那夜我总觉得明天太阳再也不会出来了。我有些恨她。",
   readings: [{ start: 13, end: 14, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-04-source-287",
   text: "掏不着 (không móc thấy)",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhao2" }],
  },
  {
   id: "nhip-cau-lesson-04-source-304",
   text: "(1) 你呀，瞎花钱，见着什么买什么. Bạn đấy, tiêu tiền vô phí, thấy gì mua nấy.",
   readings: [{ start: 12, end: 13, char: "着", reading: "zhao2" }],
  },
  {
   id: "nhip-cau-lesson-05-source-569",
   text:
    '一天晚饭后，张主任和儿子聊天儿。儿子突然问道："我告诉您的好办法，您是不是跟您单位的人说了？"张主任不明白地问："怎么了？"儿子说："今天下午我路过您单位时，从公司院里出来个人叫车。我一听又是九公里多。我刚说不往那边去，他马上伸手掏钢笔。我一看，心想，想用这办法治我呀，你还差点儿。我没等他摸着钢笔，一踩油门跟他拜拜了。"',
   readings: [{ start: 146, end: 147, char: "着", reading: "zhao2" }],
  },
  {
   id: "nhip-cau-lesson-06-source-763",
   text:
    "他发 __ 现 小偷把很多值 __ 钱的东西都偷 __ 走 __。 → 他发现 了 小偷把很多值 钱的 东西都偷 走了。",
   readings: [{ start: 40, end: 41, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-765",
   text: "写 __ 这篇文章我花 __ 五个小时才完成 __。 → 写 这篇文章我花 了 五个小时才完成。",
   readings: [{ start: 38, end: 39, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-767",
   text: "老师批评 __ 我，因为我昨天没去 __ 上课。 → 老师批评 了 我，因为我昨天没去 上课。",
   readings: [{ start: 32, end: 33, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-769",
   text: "我知道 __ 她已经习惯 __ 每天听音乐。 → 我知道 了 她已经习惯 了 每天听音乐。",
   readings: [
    { start: 29, end: 30, char: "了", reading: "le5" },
    { start: 37, end: 38, char: "了", reading: "le5" },
   ],
  },
  {
   id: "nhip-cau-lesson-07-source-509",
   text: "那可不行。光喝酒我就快受不了了，再抽烟我就别活了。你不要命，我还要呢。",
   readings: [{ start: 14, end: 15, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-07-source-673",
   text: "(2) 怎么办呢？真的 无可奈何 了吗？",
   readings: [{ start: 17, end: 18, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-07-source-679",
   text: "(5) 结果，这些进来的人差不多都 被 店里弥漫的酒香迷 住 了。",
   readings: [{ start: 31, end: 32, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-08-source-682",
   text:
    '听人说，向阳商店 正在出售 一种我要买的名牌牛仔裤，我骑上自行车，很快到了向阳商店。一进店，两个卖服装的售货员正在聊天，看 也 没看我一眼。我自己一看，这里真有我要买的那种。我用手指着那条裤子 问，一听，贵点，可我一点也不 犹豫 就 付款 了，把牛仔裤买走了。到了家，我 刚要 穿，我朋友赵明来了。我得意地说："看，怎么样？名牌！"赵明仔细一看，摇着头说："你上当了，这 假冒 牛仔裤！"我一听，气得 不得了，说："如此弄虚作假，欺骗顾客，太不信誉了！"说完，我 立即 骑上自行车，到向阳商店去 退 这条所谓名牌牛仔裤。',
   readings: [{ start: 120, end: 121, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-11-source-589",
   text: "(1) 他们在一家旅馆里 租 了一个房间.",
   readings: [{ start: 15, end: 16, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-11-source-591",
   text: "(2) 房东突然 通知 他们，房间的钥匙 丢 了.",
   readings: [{ start: 23, end: 24, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-11-source-593",
   text: "(3) 他们 商量 了半天，决定三个人在房间里 看着，另一个人去找房东换一把新锁.",
   readings: [{ start: 10, end: 11, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-11-source-595",
   text: "(4) 找房东的那个年轻人 回来 了，他见房间里一个人也没有，大家的包却都在，他 愣住 了.",
   readings: [
    { start: 17, end: 18, char: "了", reading: "le5" },
    { start: 44, end: 45, char: "了", reading: "le5" },
   ],
  },
  {
   id: "nhip-cau-lesson-12-source-630",
   text: "(2) 我正在看一本书，电话铃忽然 响 了。",
   readings: [{ start: 20, end: 21, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-13-source-276",
   text: "(4) 他一旦做错了事，从不隐瞒. Hễ anh ấy làm sai việc gì, không bao giờ che giấu.",
   readings: [{ start: 9, end: 10, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-13-source-594",
   text: "(2) 他走了，家里好像 少 了很多人。",
   readings: [{ start: 15, end: 16, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-14-source-343",
   text:
    "(2) 正当大家争论不休的时候，主席宣布了结果. Đúng lúc mọi người đang tranh cãi không ngớt thì chủ tịch công bố kết quả.",
   readings: [{ start: 20, end: 21, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-14-source-551",
   text: "(2) 王洛宾一生 收集、整理、改编 了大量民歌。",
   readings: [{ start: 19, end: 20, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-02-article-03-practice-block-550",
   text:
    '4. 从调查中我们可以发现\nA. 承担所有家务的妻子已经很少了\nB. 男子已经都成为"家庭妇男"了\nC. 愿意和丈夫分担家务的妻子越来越少\nD. 大部分家庭是丈夫做家务 → A. 承担所有家务的妻子已经很少了 ✓\n👉 Đáp án: A (vì 40%+55% = 95% là chồng có làm việc nhà)',
   readings: [{ start: 48, end: 49, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-02-article-03-practice-block-581",
   text:
    "妻子的 ____ 成为家庭经济的重要 ____ 之一，这为建立 ____ 的夫妻关系 ____ 了经济基础。 → 妻子的 收入 成为家庭经济的重要 来源 之一，这为建立 平等民主 的夫妻关系 打下 了经济基础。",
   readings: [{ start: 99, end: 100, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-02-article-03-practice-block-587",
   text: '生活现实 ____ 了越来越多的" ____ "。 → 生活现实 造就 了越来越多的" 家庭妇男 "。',
   readings: [{ start: 36, end: 37, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-03-article-01-practice-block-163",
   text:
    '3. 堂弟和婶婶意见不一致是因为\nA. 堂弟半年前就"登记"了\nB. 婚礼春节才能举行\nC. 对别人送的礼物看法不同\nD. 对婚礼的形式看法不同 → D. 对婚礼的形式看法不同 ✓\n👉 Đáp án: D',
   readings: [{ start: 30, end: 31, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-03-article-02-practice-block-423",
   text:
    "小萨沙很漂亮，他 ____ 了父母的优点， ____ 的皮肤， ____ 的卷发， ____ 的眼睛。 → 小萨沙很漂亮，他 继承 了父母的优点， 白皙 的皮肤， 棕色 的卷发， 大而黑 的眼睛。",
   readings: [{ start: 66, end: 67, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-03-article-03-practice-block-677",
   text:
    "人往往对已经得到的东西 ____，一旦要失去了却又 ____。 → 人往往对已经得到的东西 不珍惜，一旦要失去了却又 依依不舍。",
   readings: [
    { start: 22, end: 23, char: "了", reading: "le5" },
    { start: 55, end: 56, char: "了", reading: "le5" },
   ],
  },
  {
   id: "doc-hieu-unit-04-article-01-practice-block-182",
   text:
    "为了让老人都得到照顾，愉快地度过晚年，各地政府 ____ 很大的努力，____ 了许多新办法。 → 为了让老人都得到照顾，愉快地度过晚年，各地政府 作了 很大的努力，想出 了许多新办法。",
   readings: [{ start: 86, end: 87, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-04-article-04-practice-block-874",
   text: "时间 ____ 长，老张爱 ____ 了跳舞。 → 时间 一 长，老张爱 上 了跳舞。",
   readings: [{ start: 39, end: 40, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-05-article-04-practice-block-861",
   text:
    "一些父母为了孩子的前途，几乎 ____ 了自己所有的 ____ 和 ____。 → 一些父母为了孩子的前途，几乎 投入 了自己所有的 精力 和 财力。",
   readings: [{ start: 60, end: 61, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-06-article-04-practice-block-835",
   text:
    "随着高考的 ____ 我家饭桌上的话题只有 ____ 和 ____ 了。 → 随着高考的 临近 我家饭桌上的话题只有 学习 和 考试 了。",
   readings: [{ start: 67, end: 68, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-07-article-03-practice-block-612",
   text:
    "由于出了一次 ____，一下子就 ____ 了马上买车的 ____。 → 由于出了一次 车祸，一下子就 打消 了马上买车的 念头。",
   readings: [{ start: 55, end: 56, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-08-article-02-practice-block-488",
   text: "这种样子太 ____ 了。 → 这种样子太 土 了。",
   readings: [{ start: 24, end: 25, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-08-article-02-practice-block-492",
   text: "这件黑的 ____，样子有点儿 ____ 了。 → 这件黑的 颜色不错，样子有点儿 过时 了。",
   readings: [{ start: 45, end: 46, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-08-article-02-practice-block-494",
   text:
    "这件红的挺 ____，可是我穿是不是太 ____ 了？ → 这件红的挺 时髦，可是我穿是不是太 年轻 了？",
   readings: [{ start: 51, end: 52, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-08-article-04-practice-block-986",
   text:
    "妇女穿裙子的习惯 ____ 于汉代，到了隋唐已经很 ____ 了。 → 妇女穿裙子的习惯 兴起 于汉代，到了隋唐已经很 流行 了。",
   readings: [{ start: 63, end: 64, char: "了", reading: "le5" }],
  },
  {
   id: "doc-hieu-unit-08-article-04-practice-block-992",
   text:
    "杨贵妃由于 ____ 了 ____ 的胭脂，连汗水都 ____ 红了。 → 杨贵妃由于 涂 了 厚厚 的胭脂，连汗水都 染 红了。",
   readings: [{ start: 46, end: 47, char: "了", reading: "le5" }],
  },
  {
   id: "khau-ngu-lesson-03-p07-b12",
   text: "（4）他把事情搞【糟】了。",
   readings: [{ start: 11, end: 12, char: "了", reading: "le5" }],
  },
  {
   id: "khau-ngu-lesson-06-en-p55-b11",
   text: "③ 你的冰箱用了多少年了？该【换新的】了吧？",
   readings: [{ start: 19, end: 20, char: "了", reading: "le5" }],
  },
  {
   id: "khau-ngu-lesson-07-p20-b03",
   text: "时间过得真快啊，又到周末了，想不想去哪儿玩儿玩儿？",
   readings: [{ start: 12, end: 13, char: "了", reading: "le5" }],
  },
  {
   id: "business-chinese-tm2-lesson-05-section-10-block-003",
   text:
    "A: 小王，又到周末了，1 ______。 B: 我 2 ______。 A: 那我们就去苏州玩吧。苏州离这里挺近的。 B: 是吗？坐公共汽车 3 ______？ A: 大概一个小时。 B: 那让我先 4 ______，下午再告诉你。 A: 嗯，好的，你想好了 5 ______ 来我办公室找我。",
   readings: [{ start: 10, end: 11, char: "了", reading: "le5" }],
  },
  {
   id: "khau-ngu-lesson-13-en-p106-b04",
   text: "4 差点儿来不了了",
   readings: [{ start: 8, end: 9, char: "了", reading: "le5" }],
  },
  {
   id: "khau-ngu-lesson-13-en-p106-b07",
   text: "不累。你不知道，我今天差点儿来不了了。[7]",
   readings: [{ start: 17, end: 18, char: "了", reading: "le5" }],
  },
  {
   id: "khau-ngu-lesson-13-en-p108-b05",
   text: "[7] 我今天差点儿来不了了。",
   readings: [{ start: 13, end: 14, char: "了", reading: "le5" }],
  },
  {
   id: "business-chinese-tm2-lesson-07-section-18-block-003",
   text: "讲解员是怎样带领我们参观的？ A. 慢步走  B. 快步走  C. 倒着走  D. 正着走 → C. 倒着走",
   readings: [{ start: 43, end: 44, char: "着", reading: "zhe5" }],
  },
  {
   id: "nhip-cau-lesson-01-source-687",
   text: "安娜接到那个通知以后怎么样？ (控制) → 她激动得控制不住自己的情绪。",
   readings: [{ start: 25, end: 26, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-02-source-176",
   text: "(1) 你刚才算错了，这回算得对。 Vừa rồi bạn tính sai rồi, lần này tính đúng.",
   readings: [{ start: 14, end: 15, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-02-source-445",
   text:
    '大夫一见我就把脸拉下来了，不过还是把"冬"改成了"东"。要说大夫还是挺负责任的，可能他觉得一个字划了三个黑疙瘩不太好看，特意把名字在旁边重写了一遍。我仔细看了一遍那个"东"字。这回一点没错，我跑回一楼，刚递进药方，里边又问了："嗨，你到底姓什么？"我接过药方一看，哎呀，怎么又把"李东"写成"刘东"了呢？没办法，我不得不再上三楼。这回大夫火了："你有完没有？一个破字得改多少回？"我赔着笑脸听着，心里却很生气。大夫这回写得一点没错儿，确实是我的名字"李东".',
   readings: [{ start: 210, end: 211, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-04-source-430",
   text:
    "(5) 那匹马高大得出奇，冲着我们直奔过来. Con ngựa đó cao lớn kỳ lạ, chạy thẳng về phía chúng tôi.",
   readings: [{ start: 9, end: 10, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-05-source-603",
   text:
    'BP机一叫，他腾地就坐起来，手忙脚乱地穿衣服，嘴里念叨着："可能有事，单位呼我。"说着，提上鞋就要回电话。',
   readings: [{ start: 8, end: 9, char: "地", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-05-source-658",
   text: "愁 → 愁死了 | 愁得睡不着",
   readings: [{ start: 11, end: 12, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-387",
   text: "吃惊得说不出话来 (giật mình không nói nên lời)",
   readings: [{ start: 2, end: 3, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-727",
   text: "他们俩结婚的新房收拾得怎么样了？（显得 讲究） → 收拾得挺讲究的，显得很温馨。",
   readings: [{ start: 28, end: 29, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-753",
   text: "难说 / 事 / 办不成 / 很 / 这 / 办得成 / 还 → 这事很难说办得成还办不成。",
   readings: [
    { start: 24, end: 25, char: "得", reading: "de5" },
    { start: 39, end: 40, char: "得", reading: "de5" },
   ],
  },
  {
   id: "nhip-cau-lesson-06-source-807",
   text:
    "1. 年轻的妻子为什么爱画家？从哪些地方可以看得出来画家的前妻是真正爱他的？ → Cô yêu ông vì sùng bái tài năng của ông. Vợ cũ yêu ông bằng cách lặng lẽ, hy sinh cả tính mạng và dùng chiến lược để giúp ông thành công.",
   readings: [{ start: 23, end: 24, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-08-source-29",
   text:
    '还有更可笑的事呢。有一对青年工人，恋爱了几年后，终于选了个好日子举行婚礼。结婚那天，新郎家敲锣打鼓，好不热闹。结婚典礼定在上午10点举行。快到10点了，新郎忽然不见了。新郎的父母非常着急，特别是新娘，更是急得不得了。不料，新郎的弟弟在厕所发现了新郎，忙说："你怎么还不快去？大伙儿都急死了！"新郎说："真气人！这裤子我是头一回穿，刚才拉开了拉锁，可现在怎么拉也拉不上了。"弟弟一边帮他拉一边问："你是从哪儿买的？"新郎说："就是在一个叫大华的商店买的。广告还说这是进口的名牌产品……"弟弟帮了半天忙也没拉上，只好说："干脆换一身衣服吧。"新郎急忙跑到屋子里换了一身衣服。新娘见新郎穿的不是那套高价的名牌服装，十分生气。正要怪他，录音机里发出猫叫似的怪声，大家的注意力都被吸引过去了。忽然，没有声音了。新郎的弟弟走过去查看，带子还在转。他正奇怪，那位名歌星又唱了起来，声音时大时小，吐字不清，而且唱着唱着又走了调。新郎的弟弟在人们的笑声中取出磁带一看，磁带上的字印得极不清楚，而且还有错别字，磁带的颜色发暗，重量也轻，就对哥哥说："这是假冒产品，不是原声磁带，是复制的。"',
   readings: [{ start: 431, end: 432, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-10-source-397",
   text:
    "(9) 想到很快就要和妻子、儿女们团聚了，他高兴得一夜没睡好. Nghĩ đến sắp được đoàn tụ với vợ và các con, anh ấy vui đến nỗi không ngủ ngon cả đêm.",
   readings: [{ start: 24, end: 25, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-13-source-448",
   text: '你说得对。这种"四二一综合症"对中国社会的影响可不小呢。',
   readings: [{ start: 2, end: 3, char: "得", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-02-article-02-text-block-223",
   text:
    '在老家，过年最重要的活动之一就是走亲戚。亲戚亲戚，只有走动才能显示出"亲"来。大年初一一过，我就开始带着媳妇走东家串西家地去拜年。一天下来累得说话的劲儿都没有了。我媳妇对这些倒没抱怨。她最怕的是，有人亲亲热热地和她聊家常，而她却不知道怎么称呼对方。晚上回来对着图找，怎么找也找不到。于是，我便指着图中的一个人说，这是我二舅的丈母娘的姐姐的外甥，我们该叫他"舅舅"。哇！我媳妇惊叹道，这样连下去，所有的中国人都会是亲戚呢。',
   readings: [{ start: 70, end: 71, char: "得", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-02-article-03-practice-block-501",
   text:
    "7. 难以胜任\nA. 很难认为是胜利\nB. 困难得做不到\nC. 很难做好\nD. 虽然难但还是能做好 → C. 很难做好 ✓\n👉 Đáp án: C",
   readings: [{ start: 24, end: 25, char: "得", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-05-article-02-practice-block-484",
   text:
    '国王 ____ 地骂道："水怎么能从牛奶里分出来！" → 国王 火冒三丈 地骂道："水怎么能从牛奶里分出来！"',
   readings: [{ start: 37, end: 38, char: "地", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-06-article-04-text-block-607",
   text:
    "高考是考学生，也是考家长。家有高考生，生活就会变得极端紧张。今年，我家就一直生活在这样的气氛中。",
   readings: [{ start: 24, end: 25, char: "得", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-07-article-02-text-block-230",
   text:
    "王鹏这几个月来总是在想一件事：富余的钱怎么办？王鹏工作十几年了，现在小日子过得挺舒服，有房有车，家用电器该有的都有了。他们两口子工资都不低，经常还有一些外快。每个月除去日常生活的开销，还剩下不少。要在以前，没的说，存银行去！可现在，越来越多的投资机会，使人们有了多种选择的可能：储蓄、股票、债券、保险等。所以，王鹏开始重新考虑：富余的钱到底怎么处置才最合适。",
   readings: [{ start: 38, end: 39, char: "得", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-08-article-02-practice-block-484",
   text: "逛完百货大楼，我已经累得走不动了。 → Đúng ✓",
   readings: [{ start: 11, end: 12, char: "得", reading: "de5" }],
  },
  {
   id: "doc-hieu-unit-09-article-01-practice-block-133",
   text:
    '6. "喜欢吃杂食"，意思是：喜欢吃\nA. 乱七八糟的食物\nB. 做得复杂的食物\nC. 各种各样的食物\nD. 有很多热量的食物 → C. 各种各样的食物 ✓\n👉 Đáp án: C',
   readings: [{ start: 34, end: 35, char: "得", reading: "de5" }],
  },
  {
   id: "khau-ngu-lesson-06-en-p53-b05",
   text:
    "结婚前我跟丈夫说好，家务不能全让我一个人干，得两个人分担。所以结婚后我们这样分工：我买菜、做饭、收拾房间，他洗碗、洗衣服、擦地板、倒垃圾。听起来他的活儿不少，可是都比较简单。就说洗衣服吧，他只不过是把脏衣服放到洗衣机里，再按几下开关罢了。[7]洗完衣服该烫的烫，该叠的叠，全都是我的事儿。不过，丈夫能帮我分担一些家务，我已经很满足了。",
   readings: [{ start: 22, end: 23, char: "得", reading: "dei3" }],
  },
  {
   id: "khau-ngu-lesson-18-en-p148-b02",
   text:
    "我也早就注意过这个问题。中国人的含蓄有时候也并不是因为场合的问题。我妻子是中国人，她和她父母关系很好，他们非常爱她。可是他们从来没有直接说过爱她的话。我也没有看见过他们用拥抱、亲吻的方式表达感情。我妻子说：爱是无需表白的，他们彼此体会得出来。[3]",
   readings: [{ start: 117, end: 118, char: "得", reading: "de5" }],
  },
  {
   id: "khau-ngu-lesson-18-en-p150-b01",
   text: "[3] 他们彼此体会得出来。",
   readings: [{ start: 10, end: 11, char: "得", reading: "de5" }],
  },
  {
   id: "business-chinese-tm2-lesson-08-section-03-block-012",
   text:
    "张经理： 你说得对。我们下一步打算建立一个重点研发室，开发新产品。为了吸引更多的新客户，今后我们还要到国外去参加展销会，宣传我们的产品。 (Giám đốc Trương: Anh nói đúng. Bước tiếp theo chúng tôi dự định xây dựng một phòng nghiên cứu phát triển trọng điểm, phát triển sản phẩm mới. Để thu hút thêm nhiều khách hàng mới, từ nay về sau chúng tôi còn phải ra nước ngoài tham gia triển lãm, quảng bá sản phẩm của chúng tôi.)",
   readings: [{ start: 7, end: 8, char: "得", reading: "de5" }],
  },
  {
   id: "business-chinese-tm2-lesson-09-section-03-block-008",
   text:
    "张明： 您说得对，好的店名才会吸引顾客。 (Trương Minh: Anh nói đúng, tên cửa hàng hay mới có thể thu hút khách hàng.)",
   readings: [{ start: 6, end: 7, char: "得", reading: "de5" }],
  },
  {
   id: "business-chinese-tm2-lesson-09-section-14-block-004",
   text:
    "而且在中国开店，要入乡随俗，起的名字得中国顾客喜欢才行。 (Hơn nữa mở cửa hàng ở Trung Quốc, phải nhập gia tùy tục, tên đặt ra phải được khách hàng Trung Quốc yêu thích mới được.)",
   readings: [{ start: 18, end: 19, char: "得", reading: "dei3" }],
  },
  {
   id: "business-chinese-tm2-lesson-10-section-14-block-004",
   text:
    '开业那天早晨，下起了小雨，小李很不安。妈妈却说："老人们都说，下雨意味着招财进宝，别人还求之不得呢。"一句话说得儿子开心起来。 (Sáng ngày khai trương, trời đổ mưa nhỏ, Tiểu Lý rất lo lắng. Mẹ lại nói: "Người già đều nói, mưa có nghĩa là hút tài lộc vào nhà, người khác còn cầu còn không được." Một câu nói khiến con trai vui vẻ trở lại.)',
   readings: [{ start: 55, end: 56, char: "得", reading: "de5" }],
  },
  {
   id: "business-chinese-tm3-lesson-03-section-14-block-004",
   text:
    "于是，我和老公商量，早晚得有自己的房子，还是先贷款买吧。我觉得我们的工作都很稳定，按揭应该没问题。半年之后，我们在一个交通方便、设施完备的小区，订下了一套130平方米的房子，贷了20年的款。 (Thế là, tôi và chồng bàn bạc, sớm muộn gì cũng phải có nhà riêng, vẫn là vay tiền mua trước đi. Tôi thấy công việc của chúng tôi đều rất ổn định, vay thế chấp chắc không vấn đề. Nửa năm sau, chúng tôi ở một khu dân cư có giao thông thuận tiện, tiện nghi đầy đủ, đã đặt mua một căn nhà 130 mét vuông, vay trong 20 năm.)",
   readings: [{ start: 12, end: 13, char: "得", reading: "dei3" }],
  },
  {
   id: "nhip-cau-lesson-03-source-219",
   text: "合得来 (hợp nhau)",
   readings: [{ start: 1, end: 2, char: "得", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-06-source-859",
   text:
    "(4) 婷婷的什么画得了一等奖？是在哪儿得的一等奖？ → Tranh gà mái già đẻ trứng. Đạt giải nhất tại triển lãm tranh nhi đồng quốc tế ở Tây Ban Nha.",
   readings: [
    { start: 10, end: 11, char: "得", reading: "de2" },
    { start: 11, end: 12, char: "了", reading: "le5" },
   ],
  },
  {
   id: "nhip-cau-lesson-09-source-665",
   text: '"太聪明了，什么事都自己拿主意作主张，这样的人最容易坏事。不可信任。"',
   readings: [{ start: 4, end: 5, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-09-source-883",
   text:
    '(3) 太聪明了，什么事都自己拿主意作主张。张经理说第三个小伙子"太聪明了"，是： A. 否定。 B. 肯定。 C. 称赞。 D. 吃惊。 → Đáp án: A',
   readings: [
    { start: 7, end: 8, char: "了", reading: "le5" },
    { start: 36, end: 37, char: "了", reading: "le5" },
   ],
  },
  {
   id: "nhip-cau-lesson-13-source-9",
   text:
    '刚到德国时，我住在一位德国老太太家里。老太太60多岁了，她很善良，也很热情。她每天为我做早饭，还教我德语。我对她非常尊重。有一天，我因为有事，晚上12点才回家。我轻轻地开门，又轻轻地上了楼。我估计没有吵醒任何人。第二天吃饭时，老太太却对我说："你以后能不能早点回来？你虽然是轻轻的，可是门和楼梯还是响了。德国人的房子隔音不太好。"我觉得她说得也有道理。这虽然是件小事，但它使我认识到，应当尊重别人的生活习惯。',
   readings: [{ start: 90, end: 91, char: "地", reading: "de5" }],
  },
  {
   id: "nhip-cau-lesson-13-source-432",
   text: '小李，你听说没有？老张的太太可厉害了，老张特别怕她。大家都说老张得了"气管炎"。',
   readings: [
    { start: 32, end: 33, char: "得", reading: "de2" },
    { start: 33, end: 34, char: "了", reading: "le5" },
   ],
  },
  {
   id: "khau-ngu-review-02-en-p83-b05",
   text:
    "另外，为了装修和布置房子，我还学会了室内设计并自己动手完成了很多工作。房子还没建好之前我就制定了一个装修方案，打算在三个月内把所有的工作分期分批干完。时间是比较紧，可是我想快点儿住进漂亮的新房。为了抓紧时间，我把日程排得满满的，所有的业余时间都花在了房子上面。星期天，别人都出去娱乐、轻松，我却不是在画设计图，就是油漆墙壁和地板。累是累，可心情很好。以前闲着没事的时候常常觉得很无聊，在新房子里干活时却根本没时间想这个问题。现在住着完全靠自己得来的房子，心里很满足。",
   readings: [{ start: 221, end: 222, char: "得", reading: "de2" }],
  },
  {
   id: "business-chinese-tm2-lesson-07-section-15-block-007",
   text:
    "在海尔参观，我们会发现很多细节。比如每个电源开关、水龙头上都贴着一个小纸条，标明了责任人。每一件样品上都有一个特殊的纸牌，标明型号经理。产品从设计到市场销售，型号经理始终要负责任。这样，人人都管事了，事事都有人管了。",
   readings: [{ start: 40, end: 41, char: "了", reading: "le5" }],
  },
  {
   id: "nhip-cau-lesson-01-source-421",
   text:
    "(3) 大林和小妹生活了一辈子，其实，大林并不真正了解小妹。 Đại Lâm và Tiểu Muội sống với nhau cả đời, thật ra, Đại Lâm chưa thực sự hiểu Tiểu Muội.",
   readings: [{ start: 25, end: 26, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-01-source-723",
   text:
    '(1) 张文为什么说："没有同学们的爱心，我就念不了书，也成不了大学生"？ → Vì hồi học lớp 8, Trương Văn từng bị bệnh phải nhập viện tốn rất nhiều tiền. Chính nhờ các bạn trong trường quyên góp, anh mới có thể tiếp tục học và trở thành sinh viên đại học.',
   readings: [{ start: 31, end: 32, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-03-source-331",
   text: "遗憾得不得了 (tiếc không chịu được)",
   readings: [{ start: 5, end: 6, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-05-source-225",
   text: "服得不得了 (phục không chịu được)",
   readings: [{ start: 4, end: 5, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-07-source-179",
   text: "生气得不得了 (tức không chịu được)",
   readings: [{ start: 5, end: 6, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-07-source-252",
   text: "委屈得不得了 (ấm ức không chịu được)",
   readings: [{ start: 5, end: 6, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-08-source-162",
   text: "赔偿不了 (không thể bồi thường)",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   id: "nhip-cau-lesson-08-source-454",
   text:
    "(3) 小马请她参加自己的结婚典礼，她高兴得不得了. Tiểu Mã mời cô tham dự đám cưới của mình, cô ấy vui không chịu được.",
   readings: [{ start: 24, end: 25, char: "了", reading: "liao3" }],
  },
  {
   id: "khau-ngu-lesson-01-en-p16-b27",
   text: "去认识或进一步了解一位你不认识或不太熟悉的同学或老师，也让他了解一下你。",
   readings: [{ start: 7, end: 8, char: "了", reading: "liao3" }],
  },
  {
   id: "khau-ngu-lesson-12-en-p99-b09",
   text:
    "“免不了”，不能避免，某种事情一定会发生。例如：\n① 刚到国外，免不了会想家。\n② 男人碰到漂亮的女人总免不了多看几眼。",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   id: "khau-ngu-lesson-12-en-p100-b05",
   text:
    "“不妨”，表示可以这样做，不会有什么不好的影响，用于提出比较大胆的建议。例如：\n① 这是个机会，你不妨试试。\n② A：这个难题我怎么也解决不了。\nB：你不妨先把它放在一边，过一段时间再说。",
   readings: [{ start: 70, end: 71, char: "了", reading: "liao3" }],
  },
  {
   id: "khau-ngu-lesson-17-en-p140-b11",
   text:
    "对，这个问题避免不了。但是我劝人们想开一点儿，[2]如果你的爱人骗你，说明他还重视你，不想破坏你们的关系，如果他连谎也懒得撒了，[3]说明他就真的不爱你了。这不是更可怕吗？",
   readings: [{ start: 9, end: 10, char: "了", reading: "liao3" }],
  },
  {
   id: "business-chinese-tm3-lesson-04-section-12-block-024",
   text:
    "物业都应该多了解业主的情况，______。 → 物业都应该多了解业主的情况，并且尽力解决业主的困难。 (Ban quản lý nên tìm hiểu kỹ hơn tình hình của cư dân, và cố gắng giải quyết khó khăn cho cư dân.)",
   readings: [{ start: 30, end: 31, char: "了", reading: "liao3" }],
  },
 ])("keeps confirmed corpus readings at their original offsets in $id", ({ text, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.normalizedText).toBe(text);
  for (const { start, end, char, reading } of readings) {
   const glyph = result.glyphs.find((item) => item.start === start);
   expect(text.slice(start, end)).toBe(char);
   expect(glyph?.text).toBe(char);
   expect(glyph?.end).toBe(end);
   expect(glyph?.lexicalReadingKey).toBe(reading);
   expect(glyph?.spokenReadingKey).toBe(reading);
  }
 });

 it.each([
  {
   text: "他说明了情况",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他说明 了 情况",
   readings: [{ start: 4, end: 5, char: "了", reading: "le5" }],
  },
  {
   text: "他表明了态度",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他表明 了 态度",
   readings: [{ start: 4, end: 5, char: "了", reading: "le5" }],
  },
  {
   text: "他声明了立场",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他讲明了原因",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他查明了真相",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他注明了日期",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他失明了",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "她比以前聪明了许多",
   readings: [{ start: 6, end: 7, char: "了", reading: "le5" }],
  },
  {
   text: "这座城市更文明了",
   readings: [{ start: 7, end: 8, char: "了", reading: "le5" }],
  },
  {
   text: "他明了事情的经过",
   readings: [{ start: 2, end: 3, char: "了", reading: "liao3" }],
  },
  {
   text: "他明 了 事情的经过",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   text: "我吃了解药",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他服了解药",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "我喝了解药",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他买了解药",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他找到了解药",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "我吃了解毒丸",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他服了解热镇痛药",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他用了解剖图",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他得到了解脱",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他听了解说",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他了解事情的经过",
   readings: [{ start: 1, end: 2, char: "了", reading: "liao3" }],
  },
  {
   text: "他深刻了解情况",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   text: "我想了解药的成分",
   readings: [{ start: 2, end: 3, char: "了", reading: "liao3" }],
  },
  {
   text: "为了解决问题，他认真分析原因",
   readings: [{ start: 1, end: 2, char: "了", reading: "le5" }],
  },
  {
   text: "因为了解你，所以相信你",
   readings: [{ start: 2, end: 3, char: "了", reading: "liao3" }],
  },
  {
   text: "他认为了解背景很重要",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   text: "买这些花得多少钱",
   readings: [{ start: 4, end: 5, char: "得", reading: "dei3" }],
  },
  {
   text: "他的钱花得很快",
   readings: [{ start: 4, end: 5, char: "得", reading: "de5" }],
  },
  {
   text: "他只得承认错误",
   readings: [{ start: 2, end: 3, char: "得", reading: "de2" }],
  },
  {
   text: "我们求得一致意见",
   readings: [{ start: 3, end: 4, char: "得", reading: "de2" }],
  },
  {
   text: "他腾地就坐起来",
   readings: [{ start: 2, end: 3, char: "地", reading: "de5" }],
  },
  {
   text: "他们腾地建房",
   readings: [{ start: 3, end: 4, char: "地", reading: "di4" }],
  },
  {
   text: "静静 地上了霜",
   readings: [{ start: 3, end: 4, char: "地", reading: "di4" }],
  },
  {
   text: "他轻轻地上了楼",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "老师讲了解题思路",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他买了解暑药",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "这种说教我们不接受",
   readings: [{ start: 3, end: 4, char: "教", reading: "jiao4" }],
  },
  {
   text: "家教我们很看重",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "印度教我们不了解",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "新教我们不熟悉",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "旧教我们不熟悉",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "这种礼教我们不认同",
   readings: [{ start: 3, end: 4, char: "教", reading: "jiao4" }],
  },
  {
   text: "天主教我们很熟悉",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "主教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "基督教我们都知道",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "伊斯兰教他们不熟悉",
   readings: [{ start: 3, end: 4, char: "教", reading: "jiao4" }],
  },
  {
   text: "老师教我写字",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao1" }],
  },
  {
   text: "国教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "异教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "文教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "社教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "胎教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "政教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "助教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "白莲教我们并不陌生",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "摩门教我们并不陌生",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "天理教我们并不陌生",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "祆教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "明教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "名教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "景教我们并不陌生",
   readings: [{ start: 1, end: 2, char: "教", reading: "jiao4" }],
  },
  {
   text: "他信教我们都知道",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "他入教我们都知道",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao4" }],
  },
  {
   text: "经理教我写字",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao1" }],
  },
  {
   text: "我怀疑地质报告有误。",
   readings: [{ start: 3, end: 4, char: "地", reading: "di4" }],
  },
  {
   text: "我怀疑地租算错了。",
   readings: [{ start: 3, end: 4, char: "地", reading: "di4" }],
  },
  {
   text: "他怀疑地心引力的数据有误。",
   readings: [{ start: 3, end: 4, char: "地", reading: "di4" }],
  },
  {
   text: "她温柔地面对孩子。",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "他从容地面对观众。",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "她郑重地承诺不会迟到。",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "他激烈地反对这个计划。",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "他一寸寸地挪动身体。",
   readings: [{ start: 4, end: 5, char: "地", reading: "de5" }],
  },
  {
   text: "她一天天地进步。",
   readings: [{ start: 4, end: 5, char: "地", reading: "de5" }],
  },
  {
   text: "你听得到我的声音吗？",
   readings: [{ start: 2, end: 3, char: "得", reading: "de5" }],
  },
  {
   text: "你看得到远处的灯吗？",
   readings: [{ start: 2, end: 3, char: "得", reading: "de5" }],
  },
  {
   text: "这么远的地方，你走得到吗？",
   readings: [{ start: 9, end: 10, char: "得", reading: "de5" }],
  },
  {
   text: "他明天得到北京去出差。",
   readings: [{ start: 3, end: 4, char: "得", reading: "dei3" }],
  },
  {
   text: "你得到超市买点菜。",
   readings: [{ start: 1, end: 2, char: "得", reading: "dei3" }],
  },
  {
   text: "他得分清是非。",
   readings: [{ start: 1, end: 2, char: "得", reading: "dei3" }],
  },
  {
   text: "你得体会一下他的难处。",
   readings: [{ start: 1, end: 2, char: "得", reading: "dei3" }],
  },
  {
   text: "他得知道真相。",
   readings: [{ start: 1, end: 2, char: "得", reading: "dei3" }],
  },
  {
   text: "他得救那个孩子。",
   readings: [{ start: 1, end: 2, char: "得", reading: "dei3" }],
  },
  {
   text: "他胖得像个球。",
   readings: [{ start: 2, end: 3, char: "得", reading: "de5" }],
  },
  {
   text: "这道菜咸得不能吃。",
   readings: [{ start: 4, end: 5, char: "得", reading: "de5" }],
  },
  {
   text: "他高兴得全家都笑了。",
   readings: [{ start: 3, end: 4, char: "得", reading: "de5" }],
  },
  {
   text: "我看了结案报告。",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "她走了却没有告诉我。",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "雨停了却更冷了。",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "检查发现了断裂的管道。",
   readings: [{ start: 4, end: 5, char: "了", reading: "le5" }],
  },
  {
   text: "他删除了解释文字。",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "她发送了解压密码。",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "他否认了解约传闻。",
   readings: [{ start: 3, end: 4, char: "了", reading: "le5" }],
  },
  {
   text: "她的穿着风格很独特。",
   readings: [{ start: 3, end: 4, char: "着", reading: "zhuo2" }],
  },
  {
   text: "她的穿着和打扮都很朴素。",
   readings: [{ start: 3, end: 4, char: "着", reading: "zhuo2" }],
  },
  {
   text: "我对她的穿着品味印象深刻。",
   readings: [{ start: 5, end: 6, char: "着", reading: "zhuo2" }],
  },
  {
   text: "他一边找着资料，一边写报告。",
   readings: [{ start: 4, end: 5, char: "着", reading: "zhe5" }],
  },
  {
   text: "孩子们猜着谜语，唱着歌。",
   readings: [{ start: 4, end: 5, char: "着", reading: "zhe5" }],
  },
  {
   text: "他正猜着谜语。",
   readings: [{ start: 3, end: 4, char: "着", reading: "zhe5" }],
  },
  {
   text: "他想着手解决这个问题。",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhuo2" }],
  },
  {
   text: "他棋高一着，总能取胜。",
   readings: [{ start: 4, end: 5, char: "着", reading: "zhao1" }],
  },
  {
   text: "这着棋下得妙。",
   readings: [{ start: 1, end: 2, char: "着", reading: "zhao1" }],
  },
  {
   text: "他使出了一着妙计。",
   readings: [{ start: 5, end: 6, char: "着", reading: "zhao1" }],
  },
  {
   text: "这是一着险棋。",
   readings: [{ start: 3, end: 4, char: "着", reading: "zhao1" }],
  },
  {
   text: "他没着了，只好认输。",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhao1" }],
  },
  {
   text: "她将陪我同行，去北京开会。",
   readings: [{ start: 5, end: 6, char: "行", reading: "xing2" }],
  },
  {
   text: "我们相约同行去旅行。",
   readings: [{ start: 5, end: 6, char: "行", reading: "xing2" }],
  },
  {
   text: "你要还我一个公道。",
   readings: [{ start: 2, end: 3, char: "还", reading: "huan2" }],
  },
  {
   text: "我还在等你还我的书。",
   readings: [{ start: 5, end: 6, char: "还", reading: "huan2" }],
  },
  {
   text: "她长他十岁。",
   readings: [{ start: 1, end: 2, char: "长", reading: "zhang3" }],
  },
  {
   text: "假期过后，他的头发长长了。",
   readings: [{ start: 9, end: 10, char: "长", reading: "zhang3" }],
  },
  {
   text: "笼里有五只鸟，这三只要飞走。",
   readings: [{ start: 9, end: 10, char: "只", reading: "zhi1" }],
  },
  {
   text: "他今天摔倒一次，膝盖擦破了。",
   readings: [{ start: 4, end: 5, char: "倒", reading: "dao3" }],
  },
  {
   text: "这场风暴吹倒一棵树。",
   readings: [{ start: 5, end: 6, char: "倒", reading: "dao3" }],
  },
  {
   text: "那位业主教我们如何装修房子。",
   readings: [{ start: 4, end: 5, char: "教", reading: "jiao1" }],
  },
  {
   text: "张主任教我们游泳。",
   readings: [{ start: 3, end: 4, char: "教", reading: "jiao1" }],
  },
  {
   text: "鱼刺牢牢卡在喉咙里。",
   readings: [{ start: 4, end: 5, char: "卡", reading: "qia3" }],
  },
  {
   text: "钥匙紧紧卡在锁孔里。",
   readings: [{ start: 4, end: 5, char: "卡", reading: "qia3" }],
  },
  {
   text: "他冲着冷水澡说笑，觉得很舒服。",
   readings: [{ start: 1, end: 2, char: "冲", reading: "chong1" }],
  },
  {
   text: "小孩冲着妈妈撒娇。",
   readings: [{ start: 2, end: 3, char: "冲", reading: "chong4" }],
  },
  {
   text: "他冲着我发脾气。",
   readings: [{ start: 1, end: 2, char: "冲", reading: "chong4" }],
  },
  {
   text: "我查看地质报告。",
   readings: [{ start: 3, end: 4, char: "地", reading: "di4" }],
  },
  {
   text: "她温柔地拥抱孩子。",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "他从容地回答观众的问题。",
   readings: [{ start: 3, end: 4, char: "地", reading: "de5" }],
  },
  {
   text: "他一寸一寸地挪动身体。",
   readings: [{ start: 5, end: 6, char: "地", reading: "de5" }],
  },
  {
   text: "他得到了消息。",
   readings: [{ start: 1, end: 2, char: "得", reading: "de2" }],
  },
  {
   text: "你买得到这本书吗？",
   readings: [{ start: 2, end: 3, char: "得", reading: "de5" }],
  },
  {
   text: "他得去北京出差。",
   readings: [{ start: 1, end: 2, char: "得", reading: "dei3" }],
  },
  {
   text: "他得救后很感激。",
   readings: [{ start: 1, end: 2, char: "得", reading: "de2" }],
  },
  {
   text: "这件衣服很得体。",
   readings: [{ start: 5, end: 6, char: "得", reading: "de2" }],
  },
  {
   text: "消息是他刚刚得知的。",
   readings: [{ start: 6, end: 7, char: "得", reading: "de2" }],
  },
  {
   text: "他决定了结此事。",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   text: "我看了报告。",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "她已经走了。",
   readings: [{ start: 4, end: 5, char: "了", reading: "le5" }],
  },
  {
   text: "我了解这件事。",
   readings: [{ start: 1, end: 2, char: "了", reading: "liao3" }],
  },
  {
   text: "他的话了无新意。",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   text: "她穿着红色的演出服。",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhe5" }],
  },
  {
   text: "她的穿着很得体。",
   readings: [{ start: 3, end: 4, char: "着", reading: "zhuo2" }],
  },
  {
   text: "他终于找着资料了。",
   readings: [{ start: 4, end: 5, char: "着", reading: "zhao2" }],
  },
  {
   text: "他着手解决这个问题。",
   readings: [{ start: 1, end: 2, char: "着", reading: "zhuo2" }],
  },
  {
   text: "着急的时候更要冷静。",
   readings: [{ start: 0, end: 1, char: "着", reading: "zhao2" }],
  },
  {
   text: "同行们都在交流经验。",
   readings: [{ start: 1, end: 2, char: "行", reading: "hang2" }],
  },
  {
   text: "他仍然还钱。",
   readings: [{ start: 3, end: 4, char: "还", reading: "huan2" }],
  },
  {
   text: "这条裙子长十厘米。",
   readings: [{ start: 4, end: 5, char: "长", reading: "chang2" }],
  },
  {
   text: "他只要五元。",
   readings: [{ start: 1, end: 2, char: "只", reading: "zhi3" }],
  },
  {
   text: "他倒了一杯水。",
   readings: [{ start: 1, end: 2, char: "倒", reading: "dao4" }],
  },
  {
   text: "他信仰宗教。",
   readings: [{ start: 4, end: 5, char: "教", reading: "jiao4" }],
  },
  {
   text: "房东教我们做菜。",
   readings: [{ start: 2, end: 3, char: "教", reading: "jiao1" }],
  },
  {
   text: "他的银行卡在包里。",
   readings: [{ start: 4, end: 5, char: "卡", reading: "ka3" }],
  },
  {
   text: "他冲着妈妈挥手。",
   readings: [{ start: 1, end: 2, char: "冲", reading: "chong4" }],
  },
  {
   text: "他正冲着冷水澡。",
   readings: [{ start: 2, end: 3, char: "冲", reading: "chong1" }],
  },
  {
   text: "他们正在斗酒。",
   readings: [{ start: 4, end: 5, char: "斗", reading: "dou4" }],
  },
  {
   text: "他喝了一斗酒。",
   readings: [{ start: 4, end: 5, char: "斗", reading: "dou3" }],
  },
  {
   text: "他午睡了一觉。",
   readings: [{ start: 5, end: 6, char: "觉", reading: "jiao4" }],
  },
  {
   text: "我觉得这个办法不错。",
   readings: [{ start: 1, end: 2, char: "觉", reading: "jue2" }],
  },
  {
   text: "他为大家服务。",
   readings: [{ start: 1, end: 2, char: "为", reading: "wei4" }],
  },
  {
   text: "他成为大家的榜样。",
   readings: [{ start: 2, end: 3, char: "为", reading: "wei2" }],
  },
  {
   text:
    "差不多先生的相貌和你我都差不多。他有一双眼睛，但看得很不清楚；他有两只耳朵，但听得不很分明；有鼻子和嘴，但他对于气味和口味都不很讲究；他的脑袋也不小，但他的记性却不很好。",
   readings: [{ start: 79, end: 80, char: "性", reading: "xing5" }],
  },
  {
   text: "她打扮成这个样子，_______________。 (几乎) → 几乎认不出她来了",
   readings: [{ start: 2, end: 3, char: "扮", reading: "ban5" }],
  },
  {
   text: "这个主意不错，就这么定了。可是，最近美术馆有什么好展览吗？还有，音乐会的票怎么办？",
   readings: [{ start: 3, end: 4, char: "意", reading: "yi5" }],
  },
  {
   text: "① 没有经验，工作起来难免（不）出差错。\n② 因为不了解本地的风俗习惯，难免（不）闹笑话。",
   readings: [{ start: 43, end: 44, char: "话", reading: "hua5" }],
  },
  {
   text: "景一回家就赶忙 ____ 厨房 ____ 饭菜。 → 景一回家就赶忙 下到 厨房 张罗 饭菜。",
   readings: [{ start: 42, end: 43, char: "罗", reading: "luo5" }],
  },
  {
   text:
    "每天我们都要跟各种各样的人打交道，怎么自我介绍，怎么认识别人？希望你能让别人喜欢你，能交到更多的朋友！",
   readings: [{ start: 15, end: 16, char: "道", reading: "dao5" }],
  },
  {
   text:
    "别着急，我们在曲阜只玩儿一个白天，然后坐当晚9点的G158次火车，晚上11点多就到北京了，一点儿也不耽误上课。",
   readings: [{ start: 51, end: 52, char: "误", reading: "wu5" }],
  },
  {
   text:
    '李白是唐代伟大的诗人，被人们称为"诗仙"。他非常喜欢喝酒，喝醉了酒才能写出好诗。据说，李白喝醉了酒，诗就写得特别好。有一次，唐玄宗让李白写诗，李白正在喝酒，已经喝醉了。唐玄宗说："你喝醉了，能写诗吗？"李白说："皇上，我喝醉了才能写好诗。"于是他拿起笔来，一下子就写出了三首好诗。人们都说："李白斗酒诗百篇。" 李白喜欢喝一种酒，这种酒是用四川的名酒加上一些药材制成的，喝了以后可以提神。这种酒被称为"太白酒"。因为李白又叫"李太白"，所以这种酒就以他的名字命名了。 太白酒产于四川眉山。这种酒是用高粱、大米、糯米、小麦、玉米等五种粮食酿造的，所以也叫"五粮液"。五粮液是四川的名酒，味道香醇，喝了以后让人回味无穷。 现在，太白酒不仅是四川的名酒，也是中国名酒之一。许多到四川旅游的中外游客，都要买几瓶太白酒带回去，或者自己喝，或者送给亲朋好友。有人说："到了四川不喝太白酒，就等于没有到过四川。"',
   readings: [{ start: 250, end: 251, char: "粱", reading: "liang5" }],
  },
  {
   text:
    "从此，徐民成了失业大军中的一员。如果仅从经济上考虑，30岁的他和有正常收入的父母住在一起，生活上是没有问题的。但徐民要的是独立，是自己养活自己，是要为这个社会做些什么。他决心依靠自己的力量，去寻找新生活。他认真地翻阅着报刊上的招聘广告，认真地写着自己的经历，向一个个既不相识又无关系的陌生人介绍自己，推荐自己。但他没有成功，发出的信，仿佛石头扔进了大海。",
   readings: [{ start: 68, end: 69, char: "活", reading: "huo5" }],
  },
  {
   text:
    "杨贵妃由于 ____ 了 ____ 的胭脂，连汗水都 ____ 红了。 → 杨贵妃由于 涂 了 厚厚 的胭脂，连汗水都 染 红了。",
   readings: [{ start: 20, end: 21, char: "脂", reading: "zhi5" }],
  },
  {
   text:
    '在老家，过年最重要的活动之一就是走亲戚。亲戚亲戚，只有走动才能显示出"亲"来。大年初一一过，我就开始带着媳妇走东家串西家地去拜年。一天下来累得说话的劲儿都没有了。我媳妇对这些倒没抱怨。她最怕的是，有人亲亲热热地和她聊家常，而她却不知道怎么称呼对方。晚上回来对着图找，怎么找也找不到。于是，我便指着图中的一个人说，这是我二舅的丈母娘的姐姐的外甥，我们该叫他"舅舅"。哇！我媳妇惊叹道，这样连下去，所有的中国人都会是亲戚呢。',
   readings: [{ start: 170, end: 171, char: "甥", reading: "sheng5" }],
  },
  {
   text:
    "走进大自然，我们可以学到很多知识。比如，我们可以认识各种植物和动物，了解它们的生长习性。我们还可以学习野外生存技能，比如搭帐篷、生火做饭等。",
   readings: [{ start: 62, end: 63, char: "篷", reading: "peng5" }],
  },
  {
   text:
    '这时，售货员走过来，拿起一件咖啡色的大衣向她推荐："小姐，您试试这件，这是今年最新的样子。"果然，女友穿上后，看起来又洋气又苗条。',
   readings: [{ start: 63, end: 64, char: "条", reading: "tiao5" }],
  },
  {
   text:
    'Đoạn văn gợi ý: 丁力是一个喜欢帮助别人的学生，常常在帮助别人的时候，就是有点马虎。由于"马虎"，好事没做成，反而给别人带来麻烦.',
   readings: [{ start: 47, end: 48, char: "虎", reading: "hu5" }],
  },
  {
   text: "后天就要回国了，_______________。 (收拾) → 我得收拾一下行李。",
   readings: [{ start: 27, end: 28, char: "拾", reading: "shi5" }],
  },
  {
   text:
    "你们不能这么软弱。同学之间要与人为善，可是也不能受欺负。明天我去找你们的老师，要他惩罚王小明。",
   readings: [{ start: 26, end: 27, char: "负", reading: "fu5" }],
  },
  {
   text:
    "我觉得广州是夜生活非常活跃的城市，一般来说，广州的夜晚就是吃和玩儿，花钱和赚钱。不过还有一种特别的，就是上夜课。我有个朋友，她不是去学电脑，就是去学会计，再不就是学化妆，学插花儿。这也是一种打发时间的方式吧。",
   readings: [{ start: 96, end: 97, char: "发", reading: "fa5" }],
  },
  {
   text:
    "我比较在乎自己在别人眼里的形象，所以穿衣服很讲究。比如什么场合穿什么衣服，什么样的上衣跟什么样的裤子、裙子搭配，事先都要研究一番。[6]可是因为我的眼光太高，收入太低，商店里的衣服对我来说一般只有两类：不是看不上，就是买不起，所以常常逛大半天商店什么也买不到。",
   readings: [{ start: 4, end: 5, char: "乎", reading: "hu5" }],
  },
  {
   text: "为了提高技术水平，研发部 ______ 了很大的功夫。 A. 去  B. 下  C. 上  D. 拿 → B. 下",
   readings: [{ start: 25, end: 26, char: "夫", reading: "fu5" }],
  },
  {
   text:
    "皮肤白净之人适合穿深蓝、铁灰、大红、深红等色彩较深的服装，这样搭配会使人显得更加娇美；而肤色黑黄之人如果选择色彩较浅的暖色，如米黄、乳白、浅灰、豆沙等颜色，则使人显得更有精神。",
   readings: [{ start: 3, end: 4, char: "净", reading: "jing5" }],
  },
  {
   text:
    '我女儿17岁上大学，今年暑假以后该上二年级了。暑假的第二天，她就和同学们到百货大楼打工去了。原来，我和妻子都希望她能利用假期好好复习复习功课。可女儿说："我要凭自己的本事挣钱交学费。"我们觉得她说的也有道理，让她试着锻炼锻炼吧。',
   readings: [{ start: 84, end: 85, char: "事", reading: "shi5" }],
  },
  {
   text:
    '有个财主，非常吝啬，平时不管家里的事。有一天，他要去外地办事，临走时对家里人说："我这次出门，你们不要乱花钱。能省的就要省，要注意节约。"',
   readings: [{ start: 3, end: 4, char: "主", reading: "zhu5" }],
  },
  {
   text:
    "内容：为一个朋友订做服装，向裁缝描述对服装的款式、尺寸等的要求。\n角色：顾客、裁缝\n词语：款式　尺寸　身高　腰围　胸围　料子　做工……",
   readings: [{ start: 15, end: 16, char: "缝", reading: "feng5" }],
  },
  {
   text: "男的怎么了？ A. 生病了  B. 打算买房  C. 打错电话了  D. 打算住院",
   readings: [{ start: 19, end: 20, char: "算", reading: "suan5" }],
  },
  {
   text:
    "“一番”，动量词，表示花费比较大的力气和工夫做一次，例如“思考一番、讨论一番、找了一番”等等。",
   readings: [{ start: 21, end: 22, char: "夫", reading: "fu5" }],
  },
  {
   text: "2. 根据录音内容复述这个小故事。 → (Học sinh tự thực hiện)",
   readings: [{ start: 15, end: 16, char: "事", reading: "shi5" }],
  },
  {
   text:
    "其实爱吃炸酱面的不光是北京人。有一次我跟一位朋友去一家商店办事，正赶上这家商店开饭，吃炸酱面。黄灿灿的一大碗炸酱摆在桌上，上面还漂着一层油，刚炸好的，看起来就有食欲。店里的外地伙计们说，老板的母亲做的炸酱面最好吃了。过了一会儿，面端了上来，伙计们一人盛了一大碗，加上酱后，端着碗走开，自己找自己的地方，大口大口地吃了起来。",
   readings: [{ start: 89, end: 90, char: "计", reading: "ji5" }],
  },
  {
   text: "来客想了一下，从口袋里摸出一盘磁带放进收录机里。不一会儿，里面便传出老妻吃力的声音：",
   readings: [{ start: 9, end: 10, char: "袋", reading: "dai5" }],
  },
  {
   text:
    "① 他生病了还来上班。\n② 很多事情，男人能做到，女人也能做到。\n③ 没有你的帮助，我也能完成这个工作。\n④ 有钱的时候他很高兴，没钱的时候他也很快活。",
   readings: [{ start: 74, end: 75, char: "活", reading: "huo5" }],
  },
  {
   text: "这么厉害呀！看样子真得学会讨价还价，否则要吃亏的。那么在任何商店都可以讨价还价吗？",
   readings: [{ start: 3, end: 4, char: "害", reading: "hai5" }],
  },
  {
   text:
    "6. 五粮液是用几种粮食酿造的？\nA. 三种\nB. 四种\nC. 五种\nD. 六种 → C. 五种 ✓\n👉 Đáp án: C",
   readings: [{ start: 11, end: 12, char: "食", reading: "shi5" }],
  },
  {
   text:
    "王鹏这几个月来总是在想一件事：富余的钱怎么办？王鹏工作十几年了，现在小日子过得挺舒服，有房有车，家用电器该有的都有了。他们两口子工资都不低，经常还有一些外快。每个月除去日常生活的开销，还剩下不少。要在以前，没的说，存银行去！可现在，越来越多的投资机会，使人们有了多种选择的可能：储蓄、股票、债券、保险等。所以，王鹏开始重新考虑：富余的钱到底怎么处置才最合适。",
   readings: [{ start: 63, end: 64, char: "子", reading: "zi5" }],
  },
  {
   text:
    "这种可调的款式只有这种料子的。这儿有一种可以用洗衣机洗的，但只有三种型号，不知道合适不合适。你可以让你的狗试一试。",
   readings: [{ start: 12, end: 13, char: "子", reading: "zi5" }],
  },
  {
   text:
    'BP机一叫，他腾地就坐起来，手忙脚乱地穿衣服，嘴里念叨着："可能有事，单位呼我。"说着，提上鞋就要回电话。',
   readings: [{ start: 26, end: 27, char: "叨", reading: "dao5" }],
  },
  {
   text:
    '下午四点多，丈夫下班回家了。一家人穿戴整齐，欢天喜地地出了门。在婆家，老少三代十几口人围坐在一张大圆桌旁，一边看中央电视台的"春节联欢晚会"，一边热热闹闹地吃团圆饭过年。',
   readings: [{ start: 33, end: 34, char: "家", reading: "jia5" }],
  },
  {
   text: "姐姐买首饰，_______________。 (是为了) → 是为了参加朋友的婚礼",
   readings: [{ start: 4, end: 5, char: "饰", reading: "shi5" }],
  },
  {
   text: '小李，你听说没有？老张的太太可厉害了，老张特别怕她。大家都说老张得了"气管炎"。',
   readings: [{ start: 13, end: 14, char: "太", reading: "tai5" }],
  },
  {
   text: "① 周末他往往回父母家。\n② 女孩子往往喜欢一起逛商店。\n③ 猫往往喜欢晚上活动。",
   readings: [{ start: 37, end: 38, char: "上", reading: "shang5" }],
  },
  {
   text:
    '男人大声说："我不是不讲理，我是觉得委屈。白天在公司受气，晚上回家还要受你的气。我受够了！"',
   readings: [{ start: 19, end: 20, char: "屈", reading: "qu5" }],
  },
  {
   text: "(1) 生意不好的原因，不是 酒店的位置不好，也 不是酒的质量有问题，更 不是服务态度不好。",
   readings: [{ start: 19, end: 20, char: "置", reading: "zhi5" }],
  },
  {
   text:
    "(3) 在机场，称行李的重量时，你会看到：行李 ______ 不收运费。 → 在机场，称行李的重量时，你会看到：行李30公斤以内不收运费。 (Tại sân bay, khi cân hành lý, bạn sẽ thấy: hành lý trong vòng 30 kg không thu phí vận chuyển.)",
   readings: [{ start: 22, end: 23, char: "李", reading: "li5" }],
  },
  {
   text:
    '"才疏学浅，恐难胜任，不堪从命。"白话文的意思是：学问不深，恐怕很难担任这工作，不能服从安排。',
   readings: [{ start: 26, end: 27, char: "问", reading: "wen5" }],
  },
  {
   text:
    "流星有大有小。大的流星像月亮一样亮，小的流星就像一颗星星。流星在天空中出现的时间很短，一般只有几秒钟，有的还不到一秒钟。所以，要看到流星，必须有好的运气。",
   readings: [{ start: 13, end: 14, char: "亮", reading: "liang5" }],
  },
  {
   text: "他想着手里的照片",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhe5" }],
  },
  {
   text: "他想着手套",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhe5" }],
  },
  {
   text: "他买了无籽西瓜。",
   readings: [{ start: 2, end: 3, char: "了", reading: "le5" }],
  },
  {
   text: "他想了却心愿。",
   readings: [{ start: 2, end: 3, char: "了", reading: "liao3" }],
  },
  {
   text: "他决定了结案件。",
   readings: [{ start: 3, end: 4, char: "了", reading: "liao3" }],
  },
  {
   text: "他看着棋盘认真思考。",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhe5" }],
  },
  {
   text: "他拿着棋子。",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhe5" }],
  },
  {
   text: "我正好找着了钥匙。",
   readings: [{ start: 4, end: 5, char: "着", reading: "zhao2" }],
  },
  {
   text: "老师说不懂汉语的人不能报名。",
   readings: [{ start: 3, end: 4, char: "不", reading: "bu4" }],
  },
  {
   text: "他说不来的人可以看录像。",
   readings: [{ start: 2, end: 3, char: "不", reading: "bu4" }],
  },
  {
   text: "我们走走廊去教室，不穿过操场。",
   readings: [{ start: 3, end: 4, char: "走", reading: "zou3" }],
  },
  {
   text: "请读读物上标明的注意事项。",
   readings: [{ start: 2, end: 3, char: "读", reading: "du2" }],
  },
  {
   text: "他冲着咖啡机说了一句话。",
   readings: [{ start: 1, end: 2, char: "冲", reading: "chong4" }],
  },
  {
   text: "他冲着咖啡师喊了一声。",
   readings: [{ start: 1, end: 2, char: "冲", reading: "chong4" }],
  },
  {
   text: "我想着手里的照片。",
   readings: [{ start: 2, end: 3, char: "着", reading: "zhe5" }],
  },
  {
   text: "他一边冲着咖啡一边说话。",
   readings: [{ start: 3, end: 4, char: "冲", reading: "chong1" }],
  },
  {
   text: "大家说说笑笑地走进来。",
   readings: [{ start: 3, end: 4, char: "说", reading: "shuo1" }],
  },
  {
   text: "你先读读这本书。",
   readings: [{ start: 3, end: 4, char: "读", reading: "du5" }],
  },
  {
   text: "他读读写写，一刻不停。",
   readings: [{ start: 2, end: 3, char: "读", reading: "du2" }],
  },
  {
   text: "这幅画明明白白地表达了主题。",
   readings: [{ start: 4, end: 5, char: "明", reading: "ming2" }],
  },
  {
   text:
    "志强，不要再给叔叔寄什么了。虽然叔叔并不富裕，也要靠打工来完成学业。每学期寄出30元，对叔叔这样的穷学生来说，并不算轻松。但叔叔不觉得是负担，叔叔已经得到了最好的报答，得到了无价之宝，那就是从你那幼小的心灵深处感受到的人间真情，明白了自己身上的责任。",
   readings: [{ start: 86, end: 87, char: "了", reading: "le5" }],
  },
  {
   text:
    "(1) 遭受了无数次打击之后，他变得越来越坚强了. Sau khi chịu đựng vô số lần đả kích, anh ấy càng ngày càng trở nên kiên cường.",
   readings: [{ start: 6, end: 7, char: "了", reading: "le5" }],
  },
  {
   text: "无数 / 克服 / 困难 / 了 / 他 / 才 / 成功 / 获得 → 他克服了无数困难才获得成功。",
   readings: [{ start: 40, end: 41, char: "了", reading: "le5" }],
  },
  {
   text:
    "一天早晨，他照常打开收音机，起床穿衣服。收音机里正在广播广告节目。当他吃力地扣上皮带的最后一个自己扎的扣眼时，一则广告吸引了他。广告说，各大药店正在出售一种减肥妙药。小刘听了无比兴奋，于是吃完早饭便毫不犹豫地骑上自行车专门去买广播里说的那种减肥药。",
   readings: [{ start: 86, end: 87, char: "了", reading: "le5" }],
  },
  {
   text:
    "焦波是中国著名的摄影家，他的摄影作品以记录中国农村生活而闻名。他的代表作《俺爹俺娘》感动了无数中国人。",
   readings: [{ start: 44, end: 45, char: "了", reading: "le5" }],
  },
  {
   text:
    "可是出事故的时候毕竟少。我看，要想解决交通阻塞，还得控制车辆增加的速度。中国经济发展这么快，问题会越来越严重的。应该早点儿想办法，等问题到了无法解决的地步时就晚了。[2]",
   readings: [{ start: 69, end: 70, char: "了", reading: "le5" }],
  },
  {
   text:
    "这段话的主要内容是什么？ A. 王先生想购买一辆车。  B. 办理分期无息贷款购车很简单。  C. 分期无息贷款购车成为一种生活方式。  D. 不少银行都推出了无息贷款购车业务。",
   readings: [{ start: 79, end: 80, char: "了", reading: "le5" }],
  },
  {
   text:
    "一天，她丈夫出去了。晚上，胖嫂一个人哄着孩子睡觉。忽然有人敲门。原来她妈妈病了，让她快些回去。胖嫂急得不得了，马上抱起孩子就走。那天晚上没有月亮；胖嫂走着走着就进了西瓜地。她被绊了一交，孩子也被摔到了地上。她连忙爬起来，抱起孩子就走。到了娘家才发现，她手里抱的并不是孩子，而是一个西瓜。她急忙点上灯，到瓜地里找孩子，可是找了半天只找到了一个枕头。她急得又从原路找回家去，进屋一看，发现孩子在床上睡得正香呢。",
   readings: [{ start: 5, end: 6, char: "夫", reading: "fu5" }],
  },
  {
   text:
    '下午四点多，丈夫下班回家了。一家人穿戴整齐，欢天喜地地出了门。在婆家，老少三代十几口人围坐在一张大圆桌旁，一边看中央电视台的"春节联欢晚会"，一边热热闹闹地吃团圆饭过年。',
   readings: [{ start: 7, end: 8, char: "夫", reading: "fu5" }],
  },
  {
   text:
    "内容：为一个朋友订做服装，向裁缝描述对服装的款式、尺寸等的要求。\n角色：顾客、裁缝\n词语：款式　尺寸　身高　腰围　胸围　料子　做工……",
   readings: [{ start: 40, end: 41, char: "缝", reading: "feng5" }],
  },
  {
   text: '爱问问题的孩子叫"问题子女"。 → Sai (là trẻ có vấn đề, không phải trẻ hay hỏi) ❌',
   readings: [{ start: 2, end: 3, char: "问", reading: "wen4" }],
  },
  {
   text: "(1) 他总是借口有病不来上课. Anh ấy luôn lấy cớ bị bệnh để không lên lớp.",
   readings: [{ start: 11, end: 12, char: "不", reading: "bu4" }],
  },
  {
   text:
    "4. 隐隐\nA. 看起来很神秘\nB. 藏得很深\nC. 看不见\nD. 看起来不清楚 → D. 看起来不清楚 ✓\n👉 Đáp án: D",
   readings: [{ start: 37, end: 38, char: "不", reading: "bu4" }],
  },
  {
   text:
    "4. 隐隐\nA. 看起来很神秘\nB. 藏得很深\nC. 看不见\nD. 看起来不清楚 → D. 看起来不清楚 ✓\n👉 Đáp án: D",
   readings: [{ start: 49, end: 50, char: "不", reading: "bu4" }],
  },
  {
   text: "4 我不想不懂装懂",
   readings: [{ start: 5, end: 6, char: "不", reading: "bu4" }],
  },
  {
   text: "可是我不想不懂装懂。",
   readings: [{ start: 5, end: 6, char: "不", reading: "bu4" }],
  },
  {
   text:
    '6. 现在的社会风气是\nA. 未婚小伙子学习做家务\nB. 大城市的女青年想找理想的丈夫\nC. "家庭妇男"越来越多\nD. 未婚小伙子努力想得到姑娘的喜爱 → C. "家庭妇男"越来越多 ✓\n👉 Đáp án: C',
   readings: [{ start: 29, end: 30, char: "大", reading: "da4" }],
  },
  {
   text: "这儿子弹很便宜",
   readings: [
    { start: 2, end: 3, char: "子", reading: "zi3" },
    { start: 3, end: 4, char: "弹", reading: "dan4" },
   ],
  },
  {
   text: "一 了 百 了",
   readings: [
    { start: 2, end: 3, char: "了", reading: "liao3" },
    { start: 6, end: 7, char: "了", reading: "liao3" },
   ],
  },
 ])(
  "preserves audited lexical boundaries at their original offsets in $text",
  ({ text, readings }) => {
   const result = analyzeContextualPronunciation({ text });
   expect(result.normalizedText).toBe(text);
   for (const { start, end, char, reading } of readings) {
    const glyph = result.glyphs.find((item) => item.start === start);
    expect(text.slice(start, end)).toBe(char);
    expect(glyph?.text).toBe(char);
    expect(glyph?.end).toBe(end);
    expect(glyph?.lexicalReadingKey).toBe(reading);
    expect(glyph?.spokenReadingKey).toBe(reading);
   }
  },
 );

 it.each([
  { text: "他明了事情的经过，等办完手续就走了", readings: ["liao3", "le5"] },
  { text: "知了叫了起来，夏天到了", readings: ["liao3", "le5", "le5"] },
  { text: "这笔账还未了，他就走了", readings: ["liao3", "le5"] },
  { text: "这件事办不了，另一件事却已经办完 了", readings: ["liao3", "le5"] },
  { text: "他高兴得不得了，过了一会儿就睡着了", readings: ["liao3", "le5", "le5"] },
  { text: "他决定了结此事，事情却还没完没了", readings: ["liao3", "liao3"] },
  { text: "他宣布了结果，还没有了结其他事情", readings: ["le5", "liao3"] },
  { text: "他做错了事，便想不了了之", readings: ["le5", "liao3", "liao3"] },
  { text: "他失去了机会，却没能了却心愿", readings: ["le5", "liao3"] },
  { text: "我记不得了，但那个字还写得了", readings: ["le5", "liao3"] },
  { text: "他受不了了，可我受不了这声音", readings: ["liao3", "le5", "liao3"] },
  { text: "末了，我们又到周末了", readings: ["liao3", "le5"] },
 ])(
  "keeps lexical 了 distinct from formatted and sentence-final particles in $text",
  ({ text, readings }) => {
   const result = analyzeContextualPronunciation({ text });
   const glyphs = result.glyphs.filter((glyph) => glyph.text === "了");
   expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
   expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
   expect(result.normalizedText).toBe(text);
  },
 );

 it("preserves UTF-16 offsets when whitespace-separated particles neighbor lexical 了", () => {
  const text = "🙂他写 了 一封信，知了叫了起来。";
  const result = analyzeContextualPronunciation({ text });
  expect(result.normalizedText).toBe(text);
  expect(
   result.glyphs
    .filter((glyph) => glyph.text === "了")
    .map((glyph) => ({
     start: glyph.start,
     end: glyph.end,
     reading: glyph.spokenReadingKey,
    })),
  ).toEqual([
   { start: 5, end: 6, reading: "le5" },
   { start: 12, end: 13, reading: "liao3" },
   { start: 14, end: 15, reading: "le5" },
  ]);
  expect(formatContextualPinyinRange(result, 5, 6)).toBe("le");
  expect(formatContextualPinyinRange(result, 12, 13)).toBe("liǎo");
 });

 it.each([
  "她温柔地说",
  "他冷静地回答",
  "她勇敢地站起来",
  "他愉快地工作",
  "他突然地笑了",
  "她迅速地离开",
  "他坚定地拒绝",
  "他十分认真地回答",
  "他认真地拒绝",
  "她心平气和地解释",
  "他聚精会神地听",
  "他大大方方地介绍自己",
  "她慢慢地转过身",
  "她静静地坐着",
  "她静静地离开",
  "她静静地站在那里",
  "她静静地看着",
  "他随便地问",
  "他实事求是地说",
  "他理所当然地接受",
  "他不由自主地笑",
  "他不知所措地站着",
  "他一动不动地躺着",
  "他有条不紊地工作",
  "他专心致志地学习",
  "他顺利地到达",
  "他像孩子般地笑",
  "他一般地说",
  "他同样地回答",
  "她总是不自觉地伸手",
  "他兴致勃勃地谈",
  "他津津有味地吃",
  "他彬彬有礼地问",
  "她忧心忡忡地说",
  "他得意洋洋地说",
  "他无忧无虑地生活",
  "他半信半疑地问",
  "她善意地提醒",
  "他下意识地后退",
  "他绝望地叫",
  "他慢吞吞地说",
  "他懒洋洋地躺",
  "他笑眯眯地说",
 ])("covers the audited adverbial 地 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "地");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["de5"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["de5"]);
 });

 it.each([
  "他坐得稳",
  "他站得笔直",
  "她笑得合不拢嘴",
  "他哭得死去活来",
  "他跑得飞快",
  "她长得漂亮",
  "她长得秀气",
  "他看得清清楚楚",
  "她记得很清楚",
  "他吃得肚子疼",
  "他气得浑身发抖",
  "他忙得脚不沾地",
  "他走得汗流浃背",
  "她学得很快",
  "他做得非常好",
  "他快得惊人",
  "他饿得发晕",
  "他变得越来越好",
  "他跑得比我快",
  "他高兴得直跳",
  "她怕得发抖",
  "她想得入神",
 ])("covers the audited complement 得 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "得");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["de5"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["de5"]);
 });

 it.each([
  "你得赶快去",
  "他得认真考虑",
  "我们得努力",
  "张三得回家",
  "大家得小心",
  "时间得安排好",
  "你得小心点",
  "她得好好学习",
  "这件事得认真处理",
  "你总得把话说完",
 ])("covers the audited modal 得 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "得");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["dei3"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["dei3"]);
 });

 it.each([
  "他写了一首诗",
  "她“嗯”了几声",
  "她“嗯”了两下",
  "她“嗯”了三声",
  "她“哎”了好几声",
  "她“嗯”了很久",
  "他看完《红楼梦》了",
  "她说（完）了",
  "她想明白了",
  "她已经十岁了",
  "“好”了以后再说",
  "他说“哎呀”了两次",
  "他“嗯”了20声",
  "她笑了笑",
  "他叹了口气",
 ])("covers the audited aspect/change 了 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "了");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["le5"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["le5"]);
 });

 it.each([
  "她的穿着十分朴素",
  "观察她的穿着",
  "她在看她的穿着",
  "她的穿着让人眼前一亮",
  "她的穿着有些奇怪",
  "我的穿着打扮很简单",
  "她们的穿着都很朴素",
  "她的穿着虽然普通",
  "他的衣着很整洁",
 ])("covers the audited noun 着 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "着");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["zhuo2"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["zhuo2"]);
 });

 it.each([
  "他有着丰富经验",
  "她沿着河走",
  "他乘着夜色出发",
  "她顺着声音走",
  "门开着",
  "他念着朋友",
  "他念着大学",
  "桌上放着书",
 ])("covers the audited durative 着 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "着");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["zhe5"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["zhe5"]);
 });

 it.each([
  "他点着了灯",
  "他把火点着了",
  "她没找着钥匙",
  "我找着你了",
  "我怎么也猜不着",
  "我一猜就猜着了",
  "谁也够不着",
  "她冻着了",
  "他碰着了桌角",
  "小孩撞着了门",
  "他睡不着觉",
  "我见不着他",
  "我听不着声音",
  "我买不着票",
  "我摸不着头脑",
  "犯不着",
  "用不着",
 ])("covers the audited result/potential 着 grammar in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === "着");
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["zhao2"]);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["zhao2"]);
 });

 it.each([
  { text: "她温柔地说，门外的土地很湿", char: "地", readings: ["de5", "di4"] },
  { text: "他大大方方地走过广场，再看看地上的脚印", char: "地", readings: ["de5", "di4"] },
  { text: "他开心地在当地生活", char: "地", readings: ["de5", "di4"] },
  { text: "他怕得大病，却怕得浑身发抖", char: "得", readings: ["de2", "de5"] },
  { text: "他想得高分，却想得入神", char: "得", readings: ["de2", "de5"] },
  { text: "老师说得很清楚，学生得认真听", char: "得", readings: ["de5", "dei3"] },
  { text: "他得救以后高兴得直跳", char: "得", readings: ["de2", "de5"] },
  { text: "了解清楚以后，他“嗯”了三声", char: "了", readings: ["liao3", "le5"] },
  { text: "他了结了这件事，可另一件事还办不了", char: "了", readings: ["liao3", "le5", "liao3"] },
  { text: "他受不了，所以“哎”了好几声", char: "了", readings: ["liao3", "le5"] },
  {
   text: "为了了却心愿，他读完《了不起的盖茨比》了",
   char: "了",
   readings: ["le5", "liao3", "liao3", "le5"],
  },
  { text: "她找着找着，终于找着钥匙了", char: "着", readings: ["zhe5", "zhe5", "zhao2"] },
  { text: "他猜着猜着，猜着答案了", char: "着", readings: ["zhe5", "zhe5", "zhao2"] },
  {
   text: "她看着穿着红衣服的同学，又看了看自己的穿着",
   char: "着",
   readings: ["zhe5", "zhe5", "zhuo2"],
  },
  { text: "她的穿着很普通，可她穿着很好看的衣服", char: "着", readings: ["zhuo2", "zhe5"] },
  {
   text: "她喜欢的穿着打了补丁的衣服的人有朴素的穿着",
   char: "着",
   readings: ["zhe5", "zhuo2"],
  },
  {
   text: "他说着不着边际的话，大家却摸不着头脑",
   char: "着",
   readings: ["zhe5", "zhuo2", "zhao2"],
  },
  { text: "他烧着水，灯芯烧着了", char: "着", readings: ["zhe5", "zhao2"] },
 ])("keeps grammatical readings separate across clauses in $text", ({ text, char, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === char);
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
  expect(result.normalizedText).toBe(text);
 });

 it.each([
  { text: "小心地滑", char: "地", readings: ["di4"] },
  { text: "小心地雷", char: "地", readings: ["di4"] },
  { text: "他怀疑地名写错了", char: "地", readings: ["di4"] },
  { text: "突然地板塌了", char: "地", readings: ["di4"] },
  { text: "他小心地走过湿地", char: "地", readings: ["de5", "di4"] },
  { text: "他重重地在地图上画了一笔", char: "地", readings: ["de5", "di4"] },
  { text: "显得从容", char: "得", readings: ["de5"] },
  { text: "回答得从容", char: "得", readings: ["de5"] },
  { text: "窜得飞快", char: "得", readings: ["de5"] },
  { text: "买得满意", char: "得", readings: ["de5"] },
  { text: "我们不得不停下来", char: "得", readings: ["de2"] },
  { text: "我写得手都酸了", char: "得", readings: ["de5"] },
  { text: "他说得十分清楚", char: "得", readings: ["de5"] },
  { text: "她过得幸福", char: "得", readings: ["de5"] },
  { text: "我找着找我借钱的人了", char: "着", readings: ["zhao2"] },
  { text: "他猜着猜谜者的心思了", char: "着", readings: ["zhao2"] },
  { text: "他寻着灯光走", char: "着", readings: ["zhe5"] },
  { text: "人们寻着声音找去", char: "着", readings: ["zhe5"] },
  { text: "我的穿着十分干净的衣服的同事", char: "着", readings: ["zhe5"] },
  { text: "他的穿着是他自己决定的", char: "着", readings: ["zhuo2"] },
  { text: "她穿着打扮很讲究", char: "着", readings: ["zhuo2"] },
  { text: "我找着找着就累了", char: "着", readings: ["zhe5", "zhe5"] },
  { text: "他沿着街道找着了", char: "着", readings: ["zhe5", "zhao2"] },
  { text: "她扎着辫子", char: "着", readings: ["zhe5"] },
  { text: "她梳着长发", char: "着", readings: ["zhe5"] },
  {
   text: "小心地滑，但他仍小心地走过湿地",
   char: "地",
   readings: ["di4", "de5", "di4"],
  },
  { text: "小心地雷，他小心地绕过那片土地", char: "地", readings: ["di4", "de5", "di4"] },
  { text: "突然地板塌了，他怀疑地基出了问题", char: "地", readings: ["di4", "di4"] },
 ])("preserves newly audited grammar boundaries in $text", ({ text, char, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === char);
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
 });

 it.each([
  { text: "打的", char: "的", readings: ["di1"] },
  { text: "面的", char: "的", readings: ["di1"] },
  { text: "她叫了一辆“面的”，打的回家", char: "的", readings: ["di1", "di1"] },
  { text: "“打的”很方便，“面的”停在路边", char: "的", readings: ["di1", "di1"] },
  { text: "她打的电话没人接，前面的车却动了", char: "的", readings: ["de5", "de5"] },
  { text: "她打的字很清楚，面的味道也很好", char: "的", readings: ["de5", "de5"] },
  { text: "链子卡在大套里，磁卡在桌上，房卡在包里", char: "卡", readings: ["qia3", "ka3", "ka3"] },
  { text: "两辆车同行，行业同行却在讨论生意", char: "行", readings: ["xing2", "hang2", "hang2"] },
  { text: "同行是冤家，但两辆车仍然同行", char: "行", readings: ["hang2", "xing2"] },
  { text: "她冲着陈静喊，另一人正冲着咖啡", char: "冲", readings: ["chong4", "chong1"] },
  { text: "他冲进银行，随后冲着经理喊", char: "冲", readings: ["chong1", "chong4"] },
  { text: "李白斗酒诗百篇，他们却在斗酒", char: "斗", readings: ["dou3", "dou4"] },
  {
   text: "他还完书再走，但我还完全不知道他还不了钱",
   char: "还",
   readings: ["huan2", "hai2", "huan2"],
  },
  { text: "她还不了钱，却还完全不着急", char: "还", readings: ["huan2", "hai2"] },
  {
   text: "她教孩子们写字，也重视教育和宗教知识",
   char: "教",
   readings: ["jiao1", "jiao4", "jiao4"],
  },
  { text: "学校的教育很好，她每天教孩子们写字", char: "教", readings: ["jiao4", "jiao1"] },
  { text: "这是他打的，我打的回家", char: "的", readings: ["de5", "di1"] },
  { text: "这豆浆是刚打的，趁热喝", char: "的", readings: ["de5"] },
  { text: "这种豆浆是我经常打的", char: "的", readings: ["de5"] },
  { text: "他被当面打的", char: "的", readings: ["de5"] },
  {
   text: "信用卡在桌上，银行卡在包里，电话卡在柜子里，手机卡在抽屉里",
   char: "卡",
   readings: ["ka3", "ka3", "ka3", "ka3"],
  },
  { text: "这张卡在桌上，他的卡在包里", char: "卡", readings: ["ka3", "ka3"] },
  {
   text: "会员卡在柜台上，网卡在电脑里，公交卡在包里",
   char: "卡",
   readings: ["ka3", "ka3", "ka3"],
  },
  { text: "刷卡在很多商店都很方便", char: "卡", readings: ["ka3"] },
  { text: "卡片卡在卡槽里", char: "卡", readings: ["ka3", "qia3", "ka3"] },
  {
   text: "链子卡在大套里，鱼刺卡在喉咙里，车轮卡在泥里",
   char: "卡",
   readings: ["qia3", "qia3", "qia3"],
  },
  { text: "他们结伴同行，同行业的人却互相竞争", char: "行", readings: ["xing2", "hang2"] },
  { text: "他们一路同行，医生们和同行交流经验", char: "行", readings: ["xing2", "hang2"] },
  { text: "他一边冲着咖啡一边说话", char: "冲", readings: ["chong1"] },
  { text: "他一边冲着一杯咖啡一边说话", char: "冲", readings: ["chong1"] },
  { text: "他一边冲着咖啡一边冲着我说话", char: "冲", readings: ["chong1", "chong4"] },
  { text: "他一边冲着凉水澡一边说笑", char: "冲", readings: ["chong1"] },
  { text: "她一边冲着奶粉一边问我几点", char: "冲", readings: ["chong1"] },
  { text: "他冲着我说话，随后回家冲着凉水澡", char: "冲", readings: ["chong4", "chong1"] },
  { text: "小孩冲着妈妈挥手", char: "冲", readings: ["chong4"] },
  { text: "他买了一斗酒，别人正在斗酒比输赢", char: "斗", readings: ["dou3", "dou4"] },
  { text: "他欠图书馆很多书，现在还得了书吗", char: "还", readings: ["huan2"] },
  { text: "他欠图书馆很多书，现在还得了书吗", char: "得", readings: ["de5"] },
  { text: "他欠图书馆很多书，现在还得了书吗", char: "了", readings: ["liao3"] },
  { text: "他不但得了绘画奖，还得了书法比赛的冠军", char: "还", readings: ["hai2"] },
  { text: "他不但得了绘画奖，还得了书法比赛的冠军", char: "得", readings: ["de2", "de2"] },
  { text: "他不但得了绘画奖，还得了书法比赛的冠军", char: "了", readings: ["le5", "le5"] },
  { text: "我想请教你一个问题，请你教我", char: "教", readings: ["jiao4", "jiao1"] },
  { text: "我向你讨教你是怎么做的", char: "教", readings: ["jiao4"] },
  { text: "请指教我该怎么做", char: "教", readings: ["jiao4"] },
  { text: "他来求教我如何解题", char: "教", readings: ["jiao4"] },
  { text: "你要多管教孩子", char: "教", readings: ["jiao4"] },
  { text: "佛教我们很熟悉", char: "教", readings: ["jiao4"] },
  { text: "儒教他们不理解", char: "教", readings: ["jiao4"] },
  { text: "道教我很喜欢", char: "教", readings: ["jiao4"] },
  { text: "他信仰佛教我们都知道", char: "教", readings: ["jiao4"] },
  { text: "他教我们写字", char: "教", readings: ["jiao1"] },
 ])("distinguishes lexical polyphones across clauses in $text", ({ text, char, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  const glyphs = result.glyphs.filter((glyph) => glyph.text === char);
  expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
  expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
  expect(result.normalizedText).toBe(text);
 });

 it.each([
  { text: "嗯", sourcePinyin: "ńg", reading: "ng2", display: "ńg" },
  { text: "嗯", sourcePinyin: "ňg", reading: "ng3", display: "ňg" },
  { text: "嗯", sourcePinyin: "ǹg", reading: "ng4", display: "ǹg" },
  { text: "嗯", sourcePinyin: "ng2", reading: "ng2", display: "ńg" },
  { text: "嗯", sourcePinyin: "ng3", reading: "ng3", display: "ňg" },
  { text: "嗯", sourcePinyin: "ng4", reading: "ng4", display: "ǹg" },
  { text: "呣", sourcePinyin: "ḿ", reading: "m2", display: "ḿ" },
  { text: "呣", sourcePinyin: "m̀", reading: "m4", display: "m̀" },
  { text: "呣", sourcePinyin: "m2", reading: "m2", display: "ḿ" },
  { text: "呣", sourcePinyin: "m4", reading: "m4", display: "m̀" },
 ])(
  "preserves syllabic nasal source tone $sourcePinyin for $text",
  ({ text, sourcePinyin, reading, display }) => {
   const result = analyzeContextualPronunciation({ text, sourcePinyin });
   expect(result.sourcePinyinStatus).toBe("aligned");
   expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([reading]);
   expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual([reading]);
   expect(result.glyphs.map((glyph) => glyph.evidence)).toEqual([["source-pinyin"]]);
   expect(formatContextualSpokenPinyin(result)).toBe(display);
  },
 );

 it.each([
  {
   text: "你好𰻞",
   readings: ["ni3", "hao3", null],
   positions: [
    [0, 1],
    [1, 2],
    [2, 4],
   ],
   display: "nǐ hǎo𰻞",
   unresolved: "𰻞",
  },
  {
   text: "𠮷野家",
   readings: [null, "ye3", "jia1"],
   positions: [
    [0, 2],
    [2, 3],
    [3, 4],
   ],
   display: "𠮷yě jiā",
   unresolved: "𠮷",
  },
  {
   text: "你𰻞好",
   readings: ["ni3", null, "hao3"],
   positions: [
    [0, 1],
    [1, 3],
    [3, 4],
   ],
   display: "nǐ𰻞hǎo",
   unresolved: "𰻞",
  },
 ])(
  "keeps supported readings and offsets around an unsupported Hanzi in $text",
  ({ text, readings, positions, display, unresolved }) => {
   const result = analyzeContextualPronunciation({ text });
   expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
   expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
   expect(result.glyphs.map((glyph) => [glyph.start, glyph.end])).toEqual(positions);
   expect(result.unresolved.map((item) => item.text)).toEqual([unresolved]);
   expect(result.glyphs.find((glyph) => glyph.text === unresolved)?.evidence).toEqual(["fallback"]);
   expect(formatContextualSpokenPinyin(result)).toBe(display);
   expect(result.normalizedText).toBe(text);
  },
 );

 it("rejects incomplete source pinyin without dropping the supported neighboring readings", () => {
  const result = analyzeContextualPronunciation({ text: "你好𰻞", sourcePinyin: "nǐ hǎo" });
  expect(result.sourcePinyinStatus).toBe("rejected");
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["ni3", "hao3", null]);
  expect(result.glyphs.map((glyph) => glyph.evidence)).toEqual([
   ["context-library"],
   ["context-library"],
   ["fallback"],
  ]);
  expect(result.unresolved.map((item) => item.text)).toEqual(["𰻞"]);
 });

 it("preserves an exact dictionary reading inside the supported portion of a passage", () => {
  const result = analyzeContextualPronunciation({ text: "你好𰻞" }, [
   { id: "supported-reading", text: "好", pinyin: "hào", priority: 100 },
  ]);
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["ni3", "hao4", null]);
  expect(result.glyphs[1]?.evidence).toEqual(["dictionary-exact"]);
  expect(result.unresolved.map((item) => item.text)).toEqual(["𰻞"]);
 });

 it("does not align a dictionary phrase across an unsupported Hanzi", () => {
  const result = analyzeContextualPronunciation({ text: "你好𰻞" }, [
   { id: "unsupported-reading", text: "你好𰻞", pinyin: "nǐ hào biáng", priority: 100 },
  ]);
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["ni3", "hao3", null]);
  expect(result.glyphs.map((glyph) => glyph.evidence)).toEqual([
   ["context-library"],
   ["context-library"],
   ["fallback"],
  ]);
 });

 it("allows a manual reading only for the unsupported Hanzi without shifting its neighbors", () => {
  const text = "你好𰻞";
  const result = analyzeContextualPronunciation({
   text,
   overrides: [
    {
     id: "unsupported-hanzi-reading",
     text: "𰻞",
     readings: ["biang2"],
     scope: "sentence-instance",
     sentenceText: text,
     start: 2,
     end: 4,
     updatedAt: "2026-10-21T00:00:00.000Z",
    },
   ],
  });
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["ni3", "hao3", "biang2"]);
  expect(result.glyphs.map((glyph) => glyph.evidence)).toEqual([
   ["context-library"],
   ["context-library"],
   ["manual-override"],
  ]);
  expect(result.unresolved).toEqual([]);
  expect(formatContextualSpokenPinyin(result)).toBe("nǐ hǎo biáng");
 });

 it("reads the quoted speech event and spells 掠 correctly in the actual Reader paragraph", () => {
  const text = '身后传来一串自行车铃声，陈静"哎"了一声，骑车的小伙子已经一掠而过。';
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "了")?.spokenReadingKey).toBe("le5");
  expect(result.glyphs.find((glyph) => glyph.text === "掠")?.spokenReadingKey).toBe("lve4");
  expect(result.glyphs.find((glyph) => glyph.text === "掠")?.spokenPinyin).toBe("lüè");
  expect(result.normalizedText).toBe(text);
 });

 it("reads the nonreduplicated modifier in the actual 无可奈何 paragraph", () => {
  const text =
   '"再遇到人，一定开口。"陈静想着，抬眼望了望胡同里昏黄的路灯。夜深了，到处是一片片黑黝黝的怪影。"唉！这倒霉的自行车！"她推着车子，无可奈何地说。';
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey).toBe("de5");
  expect(
   result.glyphs.filter((glyph) => glyph.text === "着").map((glyph) => glyph.spokenReadingKey),
  ).toEqual(["zhe5", "zhe5"]);
  expect(result.normalizedText).toBe(text);
 });

 it.each([
  { text: "看得很不清楚，听得不很分明", char: "得", readings: ["de5", "de5"] },
  { text: "她长得一般", char: "得", readings: ["de5"] },
  { text: "路灯亮得耀眼", char: "得", readings: ["de5"] },
  { text: "屋里塞得满满", char: "得", readings: ["de5"] },
  {
   text: "打扫得干干净净，放得整整齐齐，洗得这么干净",
   char: "得",
   readings: ["de5", "de5", "de5"],
  },
  { text: "上下车都得挨训，得要点勇气", char: "得", readings: ["dei3", "dei3"] },
  { text: "“面的”得躲它", char: "得", readings: ["dei3"] },
  {
   text: "他得到了奖品，获得成功，取得了成果，得了急病",
   char: "得",
   readings: ["de2", "de2", "de2", "de2"],
  },
  { text: "我得去上课，记得要带书", char: "得", readings: ["dei3", "de5"] },
  { text: "办得了这事", char: "得", readings: ["de5"] },
  { text: "办得了这事，受不了", char: "了", readings: ["liao3", "liao3"] },
  { text: "了解了情况，了结了这件事", char: "了", readings: ["liao3", "le5", "liao3", "le5"] },
  { text: '今年70了吧？开始"禁止吸烟"了！', char: "了", readings: ["le5", "le5"] },
  { text: "为了健康，睡着了，没完没了", char: "了", readings: ["le5", "le5", "liao3"] },
  {
   text: "他白瞪着眼，闭着眼睛散步，想着想着笑了",
   char: "着",
   readings: ["zhe5", "zhe5", "zhe5", "zhe5"],
  },
  { text: "每年都吸引着大量的游客", char: "着", readings: ["zhe5"] },
  { text: "找不着路，睡不着，睡着了", char: "着", readings: ["zhao2", "zhao2", "zhao2"] },
  {
   text: "着眼于未来，为消费者的健康着想，衣着打扮",
   char: "着",
   readings: ["zhuo2", "zhuo2", "zhuo2"],
  },
  { text: "她的穿着很好，她穿着衣服", char: "着", readings: ["zhuo2", "zhe5"] },
  { text: "不着边际，不着痕迹，不着调", char: "着", readings: ["zhuo2", "zhuo2", "zhao2"] },
  { text: "心里燃烧着一团火，他烧着水，先饿着吧", char: "着", readings: ["zhe5", "zhe5", "zhe5"] },
  { text: "仍然寻找着卖报的人，她找着找着哭了", char: "着", readings: ["zhe5", "zhe5", "zhe5"] },
  { text: "我的穿着制服的同事来了", char: "着", readings: ["zhe5"] },
  { text: "他的穿着红衣服的同学来了", char: "着", readings: ["zhe5"] },
  {
   text: '请用"了解"造句，他真"了不起"，"了然于心"',
   char: "了",
   readings: ["liao3", "liao3", "liao3"],
  },
  { text: '说罢"知足"了此一生', char: "了", readings: ["liao3"] },
  { text: "怕得肝炎，怕得感冒", char: "得", readings: ["de2", "de2"] },
  { text: "气得要命，急得要发疯", char: "得", readings: ["de5", "de5"] },
  { text: "不过得等我先挣了钱再说，不过得注意", char: "得", readings: ["dei3", "dei3"] },
  {
   text: "他不想得罪人，想得救，想得逞，想得偿所愿，想得知真相",
   char: "得",
   readings: ["de2", "de2", "de2", "de2", "de2"],
  },
  { text: "他办得了不少事情，她吃得了不少东西", char: "了", readings: ["liao3", "liao3"] },
  {
   text: "我想得高分，她想得大奖，他想得好处，他怕得大病",
   char: "得",
   readings: ["de2", "de2", "de2", "de2"],
  },
  { text: "他说得了奖的人很多", char: "得", readings: ["de2"] },
  { text: "他说得了奖的人很多", char: "了", readings: ["le5"] },
  { text: "因为贫穷而不得不三次停学", char: "得", readings: ["de2"] },
  { text: "高兴得不得了", char: "得", readings: ["de5", "de2"] },
  { text: "老高得了胃癌，要是真得了奖", char: "得", readings: ["de2", "de2"] },
  { text: "她喜欢的穿着打了补丁的衣服的人", char: "着", readings: ["zhe5"] },
  { text: "我的穿着很好看的衣服的朋友来了", char: "着", readings: ["zhe5"] },
  { text: "她爱看不着边际的小说，他会做不着痕迹的处理", char: "着", readings: ["zhuo2", "zhuo2"] },
  { text: "憋得慌，联系得怎么样，吃得我直冒酸水", char: "得", readings: ["de5", "de5", "de5"] },
  { text: "你得承认，也得把婚礼办得像样点儿", char: "得", readings: ["dei3", "dei3", "de5"] },
  { text: "弄得乱七八糟，弄得我很不好意思", char: "得", readings: ["de5", "de5"] },
  { text: '写成"刘东"了呢', char: "了", readings: ["le5"] },
 ])("preserves grammatical and lexical contrasts in $text", ({ text, char, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  expect(
   result.glyphs.filter((glyph) => glyph.text === char).map((glyph) => glyph.spokenReadingKey),
  ).toEqual(readings);
 });

 it.each([
  "无可奈何地说",
  "像火一样地燃烧",
  "高高兴兴地放进柜子里",
  "从容地站起来",
  "开心地笑",
  "兴奋地说",
  "小心翼翼地走",
  "毫不犹豫地答应",
  "满怀希望地问",
  "沉着地说",
  "不停地喝水",
  "她踌躇地站住了",
  "格外地亮",
  "笑嘻嘻地赔不是",
  "急火火地把我叫起来",
  "感激地冲着那姑娘笑",
  "做贼似地逃走",
  "着急地问",
  "似睡非睡地躺",
  "似懂非懂地看",
 ])("recognizes modifier grammar without a phrase pronunciation entry: %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey).toBe("de5");
 });

 it.each([
  ["lv1", "lǖ"],
  ["lv2", "lǘ"],
  ["lv3", "lǚ"],
  ["lv4", "lǜ"],
  ["lv5", "lü"],
  ["lve1", "lüē"],
  ["lve2", "lüé"],
  ["lve3", "lüě"],
  ["lve4", "lüè"],
  ["lve5", "lüe"],
  ["nv1", "nǖ"],
  ["nv2", "nǘ"],
  ["nv3", "nǚ"],
  ["nv4", "nǜ"],
  ["nv5", "nü"],
  ["nve1", "nüē"],
  ["nve2", "nüé"],
  ["nve3", "nüě"],
  ["nve4", "nüè"],
  ["nve5", "nüe"],
  ["lu4", "lù"],
  ["ju4", "jù"],
 ])("spells canonical reading %s for learners", (key, display) => {
  expect(formatContextualReading(key)).toBe(display);
 });

 it.each(["lüè", "lve4", "lvè", "lüe4", "lu:e4"])(
  "preserves source alignment and canonical keys while displaying %s",
  (sourcePinyin) => {
   const result = analyzeContextualPronunciation({ text: "掠", sourcePinyin });
   expect(result.sourcePinyinStatus).toBe("aligned");
   expect(result.glyphs[0]?.lexicalReadingKey).toBe("lve4");
   expect(formatContextualSpokenPinyin(result)).toBe("lüè");
  },
 );

 it.each([
  ["钻空子", "钻", "zuan1"],
  ["挨训", "挨", "ai2"],
  ["炸酱面", "炸", "zha2"],
  ["豆腐切成方块", "切", "qie1"],
  ["盛入碗内", "盛", "cheng2"],
  ["心脏病", "脏", "zang4"],
  ["灯光倒映在水面上", "倒", "dao4"],
  ["藏蓝色", "藏", "zang4"],
  ["纳西古乐", "乐", "yue4"],
  ["亲切", "切", "qie4"],
  ["盛大", "盛", "sheng4"],
  ["脏衣服", "脏", "zang1"],
  ["摔倒", "倒", "dao3"],
  ["收藏", "藏", "cang2"],
  ["快乐", "乐", "le4"],
 ])("resolves evidenced lexical polyphones in %s", (text, char, reading) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === char)?.spokenReadingKey).toBe(reading);
 });

 it("accepts source neutral tones without discarding the rest of a reading paragraph", () => {
  const result = analyzeContextualPronunciation({
   text: "国王的乐队有三百个吹竽的人，优美的音乐让他听得入迷。",
   sourcePinyin:
    "guó wáng de yuè duì yǒu sān bǎi ge chuī yú de rén，yōu měi de yīn yuè ràng tā tīng de rù mí。",
  });
  expect(result.sourcePinyinStatus).toBe("aligned");
  expect(result.glyphs.find((glyph) => glyph.text === "个")?.spokenReadingKey).toBe("ge5");
  expect(result.glyphs.find((glyph) => glyph.text === "得")?.spokenReadingKey).toBe("de5");
  expect(result.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))).toBe(true);
 });

 it.each([
  ["优美的音乐让他听得入迷。", "de5"],
  ["而且吹得不比他们中的任何一位差。", "de5"],
  ["既然你的盾坚固得什么矛都刺不进去。", "de5"],
  ["想得通", "de5"],
  ["看得开", "de5"],
  ["他得到了奖品。", "de2"],
  ["我得去上课。", "dei3"],
 ])("resolves 得 in its phrase context: %s", (text, reading) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "得")?.spokenReadingKey).toBe(reading);
 });

 it("reads potential complements in the actual 差不多先生 paragraph", () => {
  const text =
   "他死后，大家都称赞差不多先生样样事情看得开，想得通；大家都说他一生不肯认真，不肯算账，不肯计较，真是一位有德行的人。于是大家给他取了个死后的法号，叫他圆通大师。";
  const result = analyzeContextualPronunciation({ text });
  const complements = result.glyphs.filter((glyph) => glyph.text === "得");
  expect(complements.map((glyph) => glyph.spokenReadingKey)).toEqual(["de5", "de5"]);
  expect(complements.map((glyph) => glyph.evidence)).toEqual([
   ["dictionary-exact"],
   ["dictionary-exact"],
  ]);
  const phraseStart = text.indexOf("看得开");
  expect(formatContextualPinyinRange(result, phraseStart, phraseStart + 3)).toBe("kàn de kāi");
  const thinkStart = text.indexOf("想得通");
  expect(formatContextualPinyinRange(result, thinkStart, thinkStart + 3)).toBe("xiǎng de tōng");
  expect(result.glyphs.find((glyph) => glyph.text === "德")?.spokenReadingKey).toBe("de2");
 });

 it("reads 地 as a neutral particle in the actual 静静地走过 paragraph", () => {
  const text =
   "第二天课间，我把那封信还给了她。直到下课，她也没有抬起头。从此，每当见到我，她总是低着头，静静地走过。";
  const result = analyzeContextualPronunciation({ text });
  const particle = result.glyphs.find((glyph) => glyph.text === "地");
  expect(particle?.lexicalReadingKey).toBe("de5");
  expect(particle?.spokenReadingKey).toBe("de5");
  expect(particle?.evidence).toEqual(["context-library"]);
  const phraseStart = text.indexOf("静静地走过");
  expect(formatContextualPinyinRange(result, phraseStart, phraseStart + 5)).toBe(
   "jìng jìng de zǒu guò",
  );
 });

 it("reads 地 as a neutral particle in the actual 含笑地看着你 paragraph", () => {
  const text =
   "后来，我虽然也接触过一些女孩，但始终没有一个合我心意的。工作三年后，我考上了研究生。就在上研究生的第二年，我遇到了一个化学系的女孩儿。这一次我的感情彻底失去了控制。那是个苏州女孩，有着一双明亮的大眼睛，一口白白的牙齿；她的衣服虽不算是时髦，可总是很得体。和你讲话时，她总是含笑地看着你，显得很美。";
  const result = analyzeContextualPronunciation({ text });
  const particle = result.glyphs.find((glyph) => glyph.text === "地");
  expect(particle?.start).toBe(text.indexOf("地"));
  expect(particle?.lexicalReadingKey).toBe("de5");
  expect(particle?.spokenReadingKey).toBe("de5");
  expect(particle?.evidence).toEqual(["dictionary-exact"]);
  const phrase = "含笑地看着你";
  const phraseStart = text.indexOf(phrase);
  expect(formatContextualPinyinRange(result, phraseStart, phraseStart + phrase.length)).toBe(
   "hán xiào de kàn zhe nǐ",
  );
  const noun = analyzeContextualPronunciation({ text: "含笑的地方" });
  expect(noun.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey).toBe("di4");
 });

 it.each([
  "静静地走过",
  "怯怯地问",
  "工工整整地写",
  "急急忙忙地跑去",
  "蹦蹦跳跳地走",
  "一笔一笔地算",
  "缓缓地下去",
  "高高兴兴地上台",
  "好好地工作",
  "一步一步地上台",
 ])("infers adverbial 地 in unlisted reduplicated modifiers: %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey).toBe("de5");
 });

 it.each([
  "地",
  "天地",
  "大地",
  "当地",
  "地方",
  "土地",
  "目的地",
  "地球",
  "地址",
  "我的地很大",
  "一块块地用了",
  "看看地图",
  "看看地上",
  "看看地下室",
  "听听地道",
  "瞧瞧地下室",
  "摸摸地上",
  "擦擦地上",
  "挖挖地看看",
  "锄锄地看看",
  "打扫打扫地下室",
  "收拾收拾地下室",
  "整理整理地上的灰",
  "不仅使土地变得贫瘠",
  "可以使土地变得肥沃",
  "到了目的地去吃饭",
  "他们挖挖地看看",
  "我再挖挖地看看",
  "父亲锄锄地看看",
  "他们瞧瞧地下室",
  "他小心看看地上有什么",
  "慢慢看看地上有什么",
  "慢慢挖挖地看看",
 ])("keeps the noun reading of 地 in %s", (text) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey).toBe("di4");
 });

 it("keeps exact dictionary evidence when the adverbial reading already agrees", () => {
  const result = analyzeContextualPronunciation({ text: "慢慢地走" });
  const particle = result.glyphs.find((glyph) => glyph.text === "地");
  expect(particle?.evidence).toEqual(["dictionary-exact"]);
  expect(particle?.confidence).toBe(0.95);
 });

 it("preserves explicit readings ahead of the adverbial 地 rule", () => {
  const text = "静静地走";
  const source = analyzeContextualPronunciation({ text, sourcePinyin: "jìng jìng dì zǒu" });
  const manual = analyzeContextualPronunciation({
   text,
   overrides: [
    {
     id: "particle-override",
     text: "地",
     readings: ["di4"],
     scope: "sentence-instance",
     sentenceText: text,
     start: 2,
     end: 3,
     updatedAt: "2026-10-20T00:00:00.000Z",
    },
   ],
  });
  const dictionary = analyzeContextualPronunciation({ text }, [
   { id: "explicit-phrase", text: "静静地", pinyin: "jìng jìng dì", priority: 100 },
  ]);
  expect(
   [source, manual, dictionary].map(
    (result) => result.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey,
   ),
  ).toEqual(["di4", "di4", "di4"]);
 });

 it.each([
  {
   text: "看得很清楚",
   sourcePinyin: "kàn dé hěn qīng chǔ",
   char: "得",
   reading: "de2",
   displayPinyin: "dé",
  },
  {
   text: '"哎"了一声',
   sourcePinyin: "āi liǎo yī shēng",
   char: "了",
   reading: "liao3",
   displayPinyin: "liǎo",
  },
  {
   text: "找不着路",
   sourcePinyin: "zhǎo bù zhe lù",
   char: "着",
   reading: "zhe5",
   displayPinyin: "zhe",
  },
 ])(
  "keeps explicit owners ahead of grammar for $text",
  ({ text, sourcePinyin, char, reading, displayPinyin }) => {
   const source = analyzeContextualPronunciation({ text, sourcePinyin });
   const start = text.indexOf(char);
   const manual = analyzeContextualPronunciation({
    text,
    overrides: [
     {
      id: "explicit-particle",
      text: char,
      readings: [reading],
      scope: "sentence-instance",
      sentenceText: text,
      start,
      end: start + char.length,
      updatedAt: "2026-10-21T00:00:00.000Z",
     },
    ],
   });
   const dictionary = analyzeContextualPronunciation({ text }, [
    { id: "explicit-particle-phrase", text: char, pinyin: displayPinyin, priority: 100 },
   ]);
   expect(source.sourcePinyinStatus).toBe("aligned");
   expect(
    [source, manual, dictionary].map(
     (analysis) => analysis.glyphs.find((glyph) => glyph.text === char)?.spokenReadingKey,
    ),
   ).toEqual([reading, reading, reading]);
  },
 );

 it.each([
  {
   text: "重重地撞",
   char: "地",
   reading: "di4",
   displayPinyin: "dì",
   sourcePinyin: "zhòng zhòng de zhuàng",
   sourceReading: "de5",
  },
  {
   text: "她懒得说",
   char: "得",
   reading: "de2",
   displayPinyin: "dé",
   sourcePinyin: "tā lǎn de shuō",
   sourceReading: "de5",
  },
  {
   text: "他倒映在水中",
   char: "倒",
   reading: "dao3",
   displayPinyin: "dǎo",
   sourcePinyin: "tā dào yìng zài shuǐ zhōng",
   sourceReading: "dao4",
  },
 ])(
  "keeps supplied single-character readings ahead of internal phrases in $text",
  ({ text, char, reading, displayPinyin, sourcePinyin, sourceReading }) => {
   const dictionary = [
    { id: "supplied-single-character", text: char, pinyin: displayPinyin, priority: 100 },
   ];
   const supplied = analyzeContextualPronunciation({ text }, dictionary);
   const source = analyzeContextualPronunciation({ text, sourcePinyin }, dictionary);
   const start = text.indexOf(char);
   const manual = analyzeContextualPronunciation(
    {
     text,
     sourcePinyin,
     overrides: [
      {
       id: "explicit-single-character",
       text: char,
       readings: [reading],
       scope: "sentence-instance",
       sentenceText: text,
       start,
       end: start + char.length,
       updatedAt: "2026-10-23T00:00:00.000Z",
      },
     ],
    },
    dictionary,
   );
   expect(source.sourcePinyinStatus).toBe("aligned");
   expect(
    [supplied, source, manual].map(
     (analysis) => analysis.glyphs.find((glyph) => glyph.text === char)?.spokenReadingKey,
    ),
   ).toEqual([reading, sourceReading, reading]);
   expect(
    [supplied, source, manual].map(
     (analysis) => analysis.glyphs.find((glyph) => glyph.text === char)?.evidence,
    ),
   ).toEqual([["dictionary-exact"], ["source-pinyin"], ["manual-override"]]);
  },
 );

 it("keeps grammar context within the original grapheme boundaries", () => {
  const result = analyzeContextualPronunciation({ text: "🙂他静静地走过" });
  const particle = result.glyphs.find((glyph) => glyph.text === "地");
  expect(particle?.start).toBe(5);
  expect(particle?.end).toBe(6);
  expect(particle?.spokenReadingKey).toBe("de5");

  for (const text of ["静静，地上全是雪", "静静 地上全是雪"]) {
   const separated = analyzeContextualPronunciation({ text });
   expect(separated.glyphs.find((glyph) => glyph.text === "地")?.spokenReadingKey).toBe("di4");
  }
 });

 it.each([
  { text: "一天", char: "一", readings: ["yi4"] },
  { text: "一年", char: "一", readings: ["yi4"] },
  { text: "一口", char: "一", readings: ["yi4"] },
  { text: "一件", char: "一", readings: ["yi2"] },
  { text: "一辆", char: "一", readings: ["yi2"] },
  { text: "一块", char: "一", readings: ["yi2"] },
  { text: "一", char: "一", readings: ["yi1"] },
  { text: "十一", char: "一", readings: ["yi1"] },
  { text: "第一", char: "一", readings: ["yi1"] },
  { text: "统一", char: "一", readings: ["yi1"] },
  { text: "唯一", char: "一", readings: ["yi1"] },
  { text: "一二三", char: "一", readings: ["yi1"] },
  { text: "二十一", char: "一", readings: ["yi1"] },
  { text: "看一看", char: "一", readings: ["yi5"] },
  { text: "想一想", char: "一", readings: ["yi5"] },
  { text: "学一学", char: "一", readings: ["yi5"] },
  { text: "说一说", char: "一", readings: ["yi5"] },
  { text: "听一听", char: "一", readings: ["yi5"] },
  { text: "爸爸", char: "爸", readings: ["ba4", "ba5"] },
  { text: "妈妈", char: "妈", readings: ["ma1", "ma5"] },
  { text: "姐姐", char: "姐", readings: ["jie3", "jie5"] },
  { text: "哥哥", char: "哥", readings: ["ge1", "ge5"] },
  { text: "妹妹", char: "妹", readings: ["mei4", "mei5"] },
  { text: "弟弟", char: "弟", readings: ["di4", "di5"] },
  { text: "孩子", char: "子", readings: ["zi5"] },
  { text: "桌子", char: "子", readings: ["zi5"] },
  { text: "椅子", char: "子", readings: ["zi5"] },
  { text: "鼻子", char: "子", readings: ["zi5"] },
  { text: "影子", char: "子", readings: ["zi5"] },
  { text: "裙子", char: "子", readings: ["zi5"] },
  { text: "镜子", char: "子", readings: ["zi5"] },
  { text: "石头", char: "头", readings: ["tou5"] },
  { text: "木头", char: "头", readings: ["tou5"] },
  { text: "我们", char: "们", readings: ["men5"] },
  { text: "你们", char: "们", readings: ["men5"] },
  { text: "他们", char: "们", readings: ["men5"] },
  { text: "原子", char: "子", readings: ["zi3"] },
  { text: "孔子", char: "子", readings: ["zi3"] },
  { text: "君子", char: "子", readings: ["zi3"] },
  { text: "子女", char: "子", readings: ["zi3"] },
  { text: "研究研究", char: "究", readings: ["jiu1", "jiu1"] },
  { text: "你的吗", char: "吗", readings: ["ma5"] },
  { text: "吗啡", char: "吗", readings: ["ma3"] },
  { text: "你说呢", char: "呢", readings: ["ne5"] },
  { text: "呢喃", char: "呢", readings: ["ni2"] },
  { text: "走着", char: "着", readings: ["zhe5"] },
  { text: "他走了", char: "了", readings: ["le5"] },
  { text: "去吧", char: "吧", readings: ["ba5"] },
  { text: "好啊", char: "啊", readings: ["a5"] },
  { text: "女", char: "女", readings: ["nv3"] },
  { text: "吕", char: "吕", readings: ["lv3"] },
  { text: "绿", char: "绿", readings: ["lv4"] },
  { text: "略", char: "略", readings: ["lve4"] },
  { text: "虐", char: "虐", readings: ["nve4"] },
  { text: "居", char: "居", readings: ["ju1"] },
  { text: "区", char: "区", readings: ["qu1"] },
  { text: "虚", char: "虚", readings: ["xu1"] },
  { text: "雨", char: "雨", readings: ["yu3"] },
  { text: "月", char: "月", readings: ["yue4"] },
  { text: "云", char: "云", readings: ["yun2"] },
  { text: "牛", char: "牛", readings: ["niu2"] },
  { text: "流", char: "流", readings: ["liu2"] },
  { text: "归", char: "归", readings: ["gui1"] },
  { text: "水", char: "水", readings: ["shui3"] },
  { text: "论", char: "论", readings: ["lun4"] },
  { text: "村", char: "村", readings: ["cun1"] },
  { text: "一个个", char: "一", readings: ["yi2"] },
  { text: "一天天", char: "一", readings: ["yi4"] },
  { text: "一件件", char: "一", readings: ["yi2"] },
  { text: "数一数", char: "一", readings: ["yi5"] },
  { text: "问一问", char: "一", readings: ["yi5"] },
  { text: "试一试", char: "一", readings: ["yi5"] },
  { text: "尝一尝", char: "一", readings: ["yi5"] },
  { text: "看一眼", char: "一", readings: ["yi4"] },
  { text: "看一看书", char: "一", readings: ["yi5"] },
  { text: "慢慢走", char: "慢", readings: ["man4", "man4"] },
  { text: "清清楚楚", char: "清", readings: ["qing1", "qing1"] },
  { text: "高高兴兴", char: "兴", readings: ["xing4", "xing4"] },
  { text: "家家户户", char: "家", readings: ["jia1", "jia1"] },
  { text: "他记得很清楚", char: "楚", readings: ["chu5"] },
  { text: "黑白分明", char: "白", readings: ["bai2"] },
  { text: "我明白你的意思", char: "白", readings: ["bai5"] },
  { text: "一一", char: "一", readings: ["yi1", "yi1"] },
  { text: "一个一个", char: "一", readings: ["yi2", "yi2"] },
  { text: "一件一件", char: "一", readings: ["yi2", "yi2"] },
  { text: "一年一年", char: "一", readings: ["yi4", "yi4"] },
  { text: "一步一步", char: "一", readings: ["yi2", "yi2"] },
  { text: "一行一行", char: "一", readings: ["yi4", "yi4"] },
  { text: "一只一只", char: "一", readings: ["yi4", "yi4"] },
  { text: "一本一本", char: "一", readings: ["yi4", "yi4"] },
  { text: "不说", char: "不", readings: ["bu4"] },
  { text: "不行", char: "不", readings: ["bu4"] },
  { text: "不好", char: "不", readings: ["bu4"] },
  { text: "不对", char: "不", readings: ["bu2"] },
  { text: "不是", char: "不", readings: ["bu2"] },
  { text: "不去", char: "不", readings: ["bu2"] },
  { text: "不", char: "不", readings: ["bu4"] },
  { text: "偏不", char: "不", readings: ["bu4"] },
  { text: "行不行", char: "不", readings: ["bu5"] },
  { text: "好不好", char: "不", readings: ["bu5"] },
  { text: "去不去", char: "不", readings: ["bu5"] },
  { text: "是不是", char: "不", readings: ["bu5"] },
  { text: "说不说", char: "不", readings: ["bu5"] },
  { text: "去不了", char: "不", readings: ["bu5"] },
  { text: "拿不动", char: "不", readings: ["bu5"] },
  { text: "看不见", char: "不", readings: ["bu5"] },
  { text: "听不懂", char: "不", readings: ["bu5"] },
  { text: "吃不下", char: "不", readings: ["bu5"] },
  { text: "说不清", char: "不", readings: ["bu5"] },
  { text: "记不住", char: "不", readings: ["bu5"] },
  { text: "写不出", char: "不", readings: ["bu5"] },
  { text: "走不进", char: "不", readings: ["bu5"] },
  { text: "回不来", char: "不", readings: ["bu5"] },
  { text: "做不完", char: "不", readings: ["bu5"] },
  { text: "办不了", char: "不", readings: ["bu5"] },
  { text: "他说不行", char: "不", readings: ["bu4"] },
  { text: "他怕不够钱", char: "不", readings: ["bu2"] },
  { text: "他不喜欢", char: "不", readings: ["bu4"] },
  { text: "他觉得不好", char: "不", readings: ["bu4"] },
  { text: "这是什么东西", char: "西", readings: ["xi5"] },
  { text: "东西方向", char: "西", readings: ["xi1"] },
  { text: "东西南北", char: "西", readings: ["xi1"] },
  { text: "我从东走到西", char: "西", readings: ["xi1"] },
  { text: "这个地方很漂亮", char: "方", readings: ["fang5"] },
  { text: "地方政府", char: "方", readings: ["fang1"] },
  { text: "她的丈夫很勤劳", char: "夫", readings: ["fu5"] },
  { text: "看看", char: "看", readings: ["kan4", "kan5"] },
  { text: "走走", char: "走", readings: ["zou3", "zou5"] },
  { text: "大家请看看这张地图", char: "看", readings: ["kan4", "kan5"] },
  { text: "下楼走走再回来", char: "走", readings: ["zou3", "zou5"] },
  { text: "大家想想办法", char: "想", readings: ["xiang3", "xiang5"] },
  { text: "你试试这件衣服", char: "试", readings: ["shi4", "shi5"] },
  { text: "她笑笑没说话", char: "笑", readings: ["xiao4", "xiao5"] },
  { text: "听听这个消息", char: "听", readings: ["ting1", "ting5"] },
  { text: "学学这首歌", char: "学", readings: ["xue2", "xue5"] },
  { text: "问问老师", char: "问", readings: ["wen4", "wen5"] },
  { text: "出去玩玩", char: "玩", readings: ["wan2", "wan5"] },
  { text: "尝尝这道菜", char: "尝", readings: ["chang2", "chang5"] },
  { text: "读读这篇文章", char: "读", readings: ["du2", "du5"] },
  { text: "来家里坐坐", char: "坐", readings: ["zuo4", "zuo5"] },
  { text: "我看过这本书", char: "过", readings: ["guo5"] },
  { text: "经过", char: "过", readings: ["guo4"] },
  { text: "她听过这首歌", char: "过", readings: ["guo5"] },
  { text: "他吃过晚饭", char: "过", readings: ["guo5"] },
  { text: "我已经读过了", char: "过", readings: ["guo5"] },
  { text: "他从桥上走过", char: "过", readings: ["guo4"] },
  { text: "我经过这里", char: "过", readings: ["guo4"] },
  { text: "过春节", char: "过", readings: ["guo4"] },
  { text: "过错", char: "过", readings: ["guo4"] },
  { text: "说说笑笑", char: "说", readings: ["shuo1", "shuo1"] },
  { text: "说说笑笑", char: "笑", readings: ["xiao4", "xiao4"] },
  { text: "帮不了", char: "不", readings: ["bu5"] },
  { text: "拆不开", char: "不", readings: ["bu5"] },
  { text: "帮不同的人办事", char: "不", readings: ["bu4"] },
  { text: "拆不合格的零件", char: "不", readings: ["bu4"] },
  { text: "等不了", char: "不", readings: ["bu5"] },
  { text: "付不起", char: "不", readings: ["bu5"] },
  { text: "飞不过去", char: "不", readings: ["bu5"] },
  { text: "塞不下", char: "不", readings: ["bu5"] },
  { text: "掏不着", char: "不", readings: ["bu5"] },
  { text: "闲不住", char: "不", readings: ["bu5"] },
  { text: "停不住", char: "不", readings: ["bu5"] },
  { text: "生不完气", char: "不", readings: ["bu5"] },
  { text: "受不了", char: "不", readings: ["bu5"] },
  { text: "花不了", char: "不", readings: ["bu5"] },
  { text: "避不开", char: "不", readings: ["bu5"] },
  { text: "干不了", char: "不", readings: ["bu5"] },
  { text: "离不开", char: "不", readings: ["bu5"] },
  { text: "关不上", char: "不", readings: ["bu5"] },
  { text: "忙不过来", char: "不", readings: ["bu5"] },
  { text: "联系不上", char: "不", readings: ["bu5"] },
  { text: "进行不下去", char: "不", readings: ["bu5"] },
  { text: "克服不了", char: "不", readings: ["bu5"] },
  { text: "改变不了", char: "不", readings: ["bu5"] },
  { text: "举行不了", char: "不", readings: ["bu5"] },
  { text: "享受不了", char: "不", readings: ["bu5"] },
  { text: "接受不了", char: "不", readings: ["bu5"] },
  { text: "应对不了", char: "不", readings: ["bu5"] },
  { text: "高兴不起来", char: "不", readings: ["bu5"] },
  { text: "请联系不来上课的学生。", char: "不", readings: ["bu4"] },
  { text: "我很高兴不懂汉语的学生也能参加。", char: "不", readings: ["bu4"] },
  { text: "请改变不来上课就退学的规定。", char: "不", readings: ["bu4"] },
  { text: "必须克服不了解规则带来的困难。", char: "不", readings: ["bu4"] },
 ])("covers the reviewed pronunciation matrix in $text", ({ text, char, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  expect(
   result.glyphs.filter((glyph) => glyph.text === char).map((glyph) => glyph.spokenReadingKey),
  ).toEqual(readings);
  expect(result.normalizedText).toBe(text);
 });

 it.each([
  { text: "一个一个", readings: ["yi2", "yi2"] },
  { text: "一件一件", readings: ["yi2", "yi2"] },
  { text: "一步一步", readings: ["yi2", "yi2"] },
  { text: "一年一年", readings: ["yi4", "yi4"] },
  { text: "一本一本", readings: ["yi4", "yi4"] },
 ])(
  "keeps citation 一 separate from spoken classifier recurrence in $text",
  ({ text, readings }) => {
   const result = analyzeContextualPronunciation({ text });
   const glyphs = result.glyphs.filter((glyph) => glyph.text === "一");
   expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["yi1", "yi1"]);
   expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
  },
 );

 it.each([
  { text: "你好", readings: ["ni3", "hao3"] },
  { text: "展览馆", readings: ["zhan3", "lan3", "guan3"] },
 ])("preserves citation readings for excluded third-tone chains in $text", ({ text, readings }) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
  expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
 });

 it.each([
  {
   text: "一个一个",
   char: "一",
   dictionaryPinyin: "yī",
   sourcePinyin: "yī gè yī gè",
   manualReading: "yi2",
   providedReadings: ["yi1", "yi1"],
   sourceReadings: ["yi1", "yi1"],
   manualReadings: ["yi2", "yi2"],
  },
  {
   text: "看一看",
   char: "一",
   dictionaryPinyin: "yī",
   sourcePinyin: "kàn yi kàn",
   manualReading: "yi2",
   providedReadings: ["yi1"],
   sourceReadings: ["yi5"],
   manualReadings: ["yi2"],
  },
  {
   text: "拿不动",
   char: "不",
   dictionaryPinyin: "bù",
   sourcePinyin: "ná bu dòng",
   manualReading: "bu2",
   providedReadings: ["bu4"],
   sourceReadings: ["bu5"],
   manualReadings: ["bu2"],
  },
  {
   text: "看看",
   char: "看",
   dictionaryPinyin: "kàn",
   sourcePinyin: "kàn kan",
   manualReading: "kan4",
   providedReadings: ["kan4", "kan4"],
   sourceReadings: ["kan4", "kan5"],
   manualReadings: ["kan4", "kan4"],
  },
 ])(
  "keeps explicit pronunciation owners ahead of new spoken rules in $text",
  ({
   text,
   char,
   dictionaryPinyin,
   sourcePinyin,
   manualReading,
   providedReadings,
   sourceReadings,
   manualReadings,
  }) => {
   const dictionary = [
    { id: "explicit-spoken-rule-reading", text: char, pinyin: dictionaryPinyin, priority: 100 },
   ];
   const provided = analyzeContextualPronunciation({ text }, dictionary);
   const source = analyzeContextualPronunciation({ text, sourcePinyin }, dictionary);
   const manual = analyzeContextualPronunciation(
    {
     text,
     sourcePinyin,
     overrides: [
      {
       id: "explicit-spoken-rule-override",
       text: char,
       readings: [manualReading],
       scope: "character-global",
       sentenceText: null,
       start: null,
       end: null,
       updatedAt: "2026-10-23T00:00:00.000Z",
      },
     ],
    },
    dictionary,
   );
   const providedGlyphs = provided.glyphs.filter((glyph) => glyph.text === char);
   const sourceGlyphs = source.glyphs.filter((glyph) => glyph.text === char);
   const manualGlyphs = manual.glyphs.filter((glyph) => glyph.text === char);
   expect(source.sourcePinyinStatus).toBe("aligned");
   expect(providedGlyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(providedReadings);
   expect(sourceGlyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(sourceReadings);
   expect(manualGlyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(manualReadings);
   expect(providedGlyphs.every((glyph) => glyph.evidence.includes("dictionary-exact"))).toBe(true);
   expect(sourceGlyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))).toBe(true);
   expect(manualGlyphs.every((glyph) => glyph.evidence.includes("manual-override"))).toBe(true);
  },
 );

 it.each([
  {
   text: "记性",
   sourcePinyin: "ji4 xing4",
   neutralSourcePinyin: "ji4 xing5",
   readings: ["ji4", "xing4"],
  },
  {
   text: "打扮",
   sourcePinyin: "da3 ban4",
   neutralSourcePinyin: "da3 ban5",
   readings: ["da3", "ban4"],
  },
  {
   text: "主意",
   sourcePinyin: "zhu3 yi4",
   neutralSourcePinyin: "zhu3 yi5",
   readings: ["zhu3", "yi4"],
  },
  {
   text: "笑话",
   sourcePinyin: "xiao4 hua4",
   neutralSourcePinyin: "xiao4 hua5",
   readings: ["xiao4", "hua4"],
  },
  {
   text: "张罗",
   sourcePinyin: "zhang1 luo2",
   neutralSourcePinyin: "zhang1 luo5",
   readings: ["zhang1", "luo2"],
  },
  {
   text: "打交道",
   sourcePinyin: "da3 jiao1 dao4",
   neutralSourcePinyin: "da3 jiao1 dao5",
   readings: ["da3", "jiao1", "dao4"],
  },
  {
   text: "耽误",
   sourcePinyin: "dan1 wu4",
   neutralSourcePinyin: "dan1 wu5",
   readings: ["dan1", "wu4"],
  },
  {
   text: "高粱",
   sourcePinyin: "gao1 liang2",
   neutralSourcePinyin: "gao1 liang5",
   readings: ["gao1", "liang2"],
  },
  {
   text: "养活",
   sourcePinyin: "yang3 huo2",
   neutralSourcePinyin: "yang3 huo5",
   readings: ["yang3", "huo2"],
  },
  {
   text: "胭脂",
   sourcePinyin: "yan1 zhi1",
   neutralSourcePinyin: "yan1 zhi5",
   readings: ["yan1", "zhi1"],
  },
  {
   text: "外甥",
   sourcePinyin: "wai4 sheng1",
   neutralSourcePinyin: "wai4 sheng5",
   readings: ["wai4", "sheng1"],
  },
  {
   text: "帐篷",
   sourcePinyin: "zhang4 peng2",
   neutralSourcePinyin: "zhang4 peng5",
   readings: ["zhang4", "peng2"],
  },
  {
   text: "苗条",
   sourcePinyin: "miao2 tiao2",
   neutralSourcePinyin: "miao2 tiao5",
   readings: ["miao2", "tiao2"],
  },
  {
   text: "马虎",
   sourcePinyin: "ma3 hu3",
   neutralSourcePinyin: "ma3 hu5",
   readings: ["ma3", "hu3"],
  },
  {
   text: "收拾",
   sourcePinyin: "shou1 shi2",
   neutralSourcePinyin: "shou1 shi5",
   readings: ["shou1", "shi2"],
  },
  {
   text: "欺负",
   sourcePinyin: "qi1 fu4",
   neutralSourcePinyin: "qi1 fu5",
   readings: ["qi1", "fu4"],
  },
  {
   text: "打发",
   sourcePinyin: "da3 fa1",
   neutralSourcePinyin: "da3 fa5",
   readings: ["da3", "fa1"],
  },
  {
   text: "在乎",
   sourcePinyin: "zai4 hu1",
   neutralSourcePinyin: "zai4 hu5",
   readings: ["zai4", "hu1"],
  },
  {
   text: "功夫",
   sourcePinyin: "gong1 fu1",
   neutralSourcePinyin: "gong1 fu5",
   readings: ["gong1", "fu1"],
  },
  {
   text: "白净",
   sourcePinyin: "bai2 jing4",
   neutralSourcePinyin: "bai2 jing5",
   readings: ["bai2", "jing4"],
  },
  {
   text: "本事",
   sourcePinyin: "ben3 shi4",
   neutralSourcePinyin: "ben3 shi5",
   readings: ["ben3", "shi4"],
  },
  {
   text: "财主",
   sourcePinyin: "cai2 zhu3",
   neutralSourcePinyin: "cai2 zhu5",
   readings: ["cai2", "zhu3"],
  },
  {
   text: "裁缝",
   sourcePinyin: "cai2 feng4",
   neutralSourcePinyin: "cai2 feng5",
   readings: ["cai2", "feng4"],
  },
  {
   text: "打算",
   sourcePinyin: "da3 suan4",
   neutralSourcePinyin: "da3 suan5",
   readings: ["da3", "suan4"],
  },
  {
   text: "工夫",
   sourcePinyin: "gong1 fu1",
   neutralSourcePinyin: "gong1 fu5",
   readings: ["gong1", "fu1"],
  },
  {
   text: "故事",
   sourcePinyin: "gu4 shi4",
   neutralSourcePinyin: "gu4 shi5",
   readings: ["gu4", "shi4"],
  },
  {
   text: "伙计",
   sourcePinyin: "huo3 ji4",
   neutralSourcePinyin: "huo3 ji5",
   readings: ["huo3", "ji4"],
  },
  {
   text: "口袋",
   sourcePinyin: "kou3 dai4",
   neutralSourcePinyin: "kou3 dai5",
   readings: ["kou3", "dai4"],
  },
  {
   text: "快活",
   sourcePinyin: "kuai4 huo2",
   neutralSourcePinyin: "kuai4 huo5",
   readings: ["kuai4", "huo2"],
  },
  {
   text: "厉害",
   sourcePinyin: "li4 hai4",
   neutralSourcePinyin: "li4 hai5",
   readings: ["li4", "hai4"],
  },
  {
   text: "粮食",
   sourcePinyin: "liang2 shi2",
   neutralSourcePinyin: "liang2 shi5",
   readings: ["liang2", "shi2"],
  },
  {
   text: "两口子",
   sourcePinyin: "liang3 kou3 zi3",
   neutralSourcePinyin: "liang3 kou3 zi5",
   readings: ["liang3", "kou3", "zi3"],
  },
  {
   text: "料子",
   sourcePinyin: "liao4 zi3",
   neutralSourcePinyin: "liao4 zi5",
   readings: ["liao4", "zi3"],
  },
  {
   text: "念叨",
   sourcePinyin: "nian4 dao1",
   neutralSourcePinyin: "nian4 dao5",
   readings: ["nian4", "dao1"],
  },
  {
   text: "婆家",
   sourcePinyin: "po2 jia1",
   neutralSourcePinyin: "po2 jia5",
   readings: ["po2", "jia1"],
  },
  {
   text: "首饰",
   sourcePinyin: "shou3 shi4",
   neutralSourcePinyin: "shou3 shi5",
   readings: ["shou3", "shi4"],
  },
  {
   text: "太太",
   sourcePinyin: "tai4 tai4",
   neutralSourcePinyin: "tai4 tai5",
   readings: ["tai4", "tai4"],
  },
  {
   text: "晚上",
   sourcePinyin: "wan3 shang4",
   neutralSourcePinyin: "wan3 shang5",
   readings: ["wan3", "shang4"],
  },
  {
   text: "委屈",
   sourcePinyin: "wei3 qu1",
   neutralSourcePinyin: "wei3 qu5",
   readings: ["wei3", "qu1"],
  },
  {
   text: "位置",
   sourcePinyin: "wei4 zhi4",
   neutralSourcePinyin: "wei4 zhi5",
   readings: ["wei4", "zhi4"],
  },
  {
   text: "行李",
   sourcePinyin: "xing2 li3",
   neutralSourcePinyin: "xing2 li5",
   readings: ["xing2", "li3"],
  },
  {
   text: "学问",
   sourcePinyin: "xue2 wen4",
   neutralSourcePinyin: "xue2 wen5",
   readings: ["xue2", "wen4"],
  },
  {
   text: "月亮",
   sourcePinyin: "yue4 liang4",
   neutralSourcePinyin: "yue4 liang5",
   readings: ["yue4", "liang4"],
  },
 ])(
  "preserves source and manual owners for newly reviewed neutral word $text",
  ({ text, sourcePinyin, neutralSourcePinyin, readings }) => {
   const source = analyzeContextualPronunciation({ text, sourcePinyin });
   const manual = analyzeContextualPronunciation({
    text,
    sourcePinyin: neutralSourcePinyin,
    overrides: [
     {
      id: "neutral-word-explicit-override",
      text,
      readings,
      scope: "phrase",
      sentenceText: null,
      start: null,
      end: null,
      updatedAt: "2026-10-23T00:00:00.000Z",
     },
    ],
   });
   expect(source.sourcePinyinStatus).toBe("aligned");
   expect(manual.sourcePinyinStatus).toBe("aligned");
   expect(source.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
   expect(source.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
   expect(manual.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
   expect(manual.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
   expect(source.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))).toBe(true);
   expect(manual.glyphs.every((glyph) => glyph.evidence.includes("manual-override"))).toBe(true);
  },
 );

 it("preserves citation 不 separately from its spoken tone in the actual 至多不过 paragraph", () => {
  const text =
   "(1) 这种药不能连续吃，至多不过一个星期. Thuốc này không thể uống liên tục, nhiều nhất không quá một tuần.";
  const result = analyzeContextualPronunciation({ text });
  const glyph = result.glyphs.find((item) => item.start === 15);
  expect(result.normalizedText).toBe(text);
  expect(glyph?.text).toBe("不");
  expect(glyph?.end).toBe(16);
  expect(glyph?.lexicalReadingKey).toBe("bu4");
  expect(glyph?.spokenReadingKey).toBe("bu2");
  expect(formatContextualPinyinRange(result, 15, 16)).toBe("bú");
 });

 it("keeps lexical and tone-sandhi readings aligned to Hanzi graphemes", () => {
  const result = analyzeContextualPronunciation({ text: "一不" });
  expect(result.glyphs).toHaveLength(2);
  expect(result.glyphs[0]?.lexicalReadingKey).toBe("yi1");
  expect(result.glyphs[0]?.spokenReadingKey).toBe("yi2");
  expect(result.glyphs[1]?.lexicalReadingKey).toBe("bu4");
  expect(result.glyphs[1]?.spokenReadingKey).toBe("bu4");
 });

 it.each([
  {
   text: "哪儿",
   lexical: ["na3", "er2"],
   spoken: ["na3", "er2"],
   pinyin: ["nǎ", "r"],
   display: "nǎr",
   wordDisplay: "nǎr",
  },
  {
   text: "这儿",
   lexical: ["zhe4", "er2"],
   spoken: ["zhe4", "er2"],
   pinyin: ["zhè", "r"],
   display: "zhèr",
   wordDisplay: "zhèr",
  },
  {
   text: "玩儿",
   lexical: ["wan2", "er2"],
   spoken: ["wan2", "er2"],
   pinyin: ["wán", "r"],
   display: "wánr",
   wordDisplay: "wánr",
  },
  {
   text: "花儿",
   lexical: ["hua1", "er2"],
   spoken: ["hua1", "er2"],
   pinyin: ["huā", "r"],
   display: "huār",
   wordDisplay: "huār",
  },
  {
   text: "一会儿",
   lexical: ["yi1", "hui4", "er5"],
   spoken: ["yi2", "hui4", "er5"],
   pinyin: ["yí", "huì", "r"],
   display: "yí huìr",
   wordDisplay: "yí huìr",
  },
  {
   text: "一点儿",
   lexical: ["yi1", "dian3", "er2"],
   spoken: ["yi4", "dian3", "er2"],
   pinyin: ["yì", "diǎn", "r"],
   display: "yì diǎnr",
   wordDisplay: "yì diǎnr",
  },
  {
   text: "女儿",
   lexical: ["nv3", "er2"],
   spoken: ["nv3", "er2"],
   pinyin: ["nǚ", "ér"],
   display: "nǚ ér",
   wordDisplay: "nǚ'ér",
  },
  {
   text: "儿子",
   lexical: ["er2", "zi5"],
   spoken: ["er2", "zi5"],
   pinyin: ["ér", "zi"],
   display: "ér zi",
   wordDisplay: "érzi",
  },
  {
   text: "幼儿",
   lexical: ["you4", "er2"],
   spoken: ["you4", "er2"],
   pinyin: ["yòu", "ér"],
   display: "yòu ér",
   wordDisplay: "yòu'ér",
  },
  {
   text: "儿童",
   lexical: ["er2", "tong2"],
   spoken: ["er2", "tong2"],
   pinyin: ["ér", "tóng"],
   display: "ér tóng",
   wordDisplay: "értóng",
  },
 ])(
  "distinguishes suffix spelling and independent 儿 while preserving canonical keys in $text",
  ({ text, lexical, spoken, pinyin, display, wordDisplay }) => {
   const result = analyzeContextualPronunciation({ text });
   expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(lexical);
   expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(spoken);
   expect(result.glyphs.map((glyph) => glyph.spokenPinyin)).toEqual(pinyin);
   expect(formatContextualSpokenPinyin(result)).toBe(display);
   expect(formatContextualReadingPinyin(result)).toBe(wordDisplay);
   expect(formatContextualPinyinRange(result, 0, text.length)).toBe(display);
   expect(result.normalizedText).toBe(text);
  },
 );

 it.each([
  {
   text: "我花儿子的钱买书",
   start: 2,
   forbiddenUnit: "花儿",
   wordDisplay: "huā érzi",
   rangeDisplay: "huā ér",
  },
  {
   text: "这儿子是我亲生的",
   start: 1,
   forbiddenUnit: "这儿",
   wordDisplay: "zhè érzi",
   rangeDisplay: "zhè ér",
  },
 ])(
  "keeps 儿子 independent across a potential suffix boundary in $text",
  ({ text, start, forbiddenUnit, wordDisplay, rangeDisplay }) => {
   const result = analyzeContextualPronunciation({ text });
   const glyph = result.glyphs.find((item) => item.start === start);
   const unitTexts = getContextualReadingUnits(result).map((unit) => unit.text);
   expect(glyph?.text).toBe("儿");
   expect(glyph?.end).toBe(start + 1);
   expect(glyph?.lexicalReadingKey).toBe("er2");
   expect(glyph?.spokenReadingKey).toBe("er2");
   expect(glyph?.spokenPinyin).toBe("ér");
   expect(unitTexts).not.toContain(forbiddenUnit);
   expect(unitTexts).toContain("儿子");
   expect(formatContextualReadingPinyin(result)).toContain(wordDisplay);
   expect(formatContextualPinyinRange(result, start - 1, start + 1)).toBe(rangeDisplay);
   expect(result.normalizedText).toBe(text);
  },
 );

 it.each([
  { text: "一下儿", spokenDisplay: "yí xiàr", wordDisplay: "yíxiàr", key: "er2" },
  { text: "一块儿", spokenDisplay: "yí kuàir", wordDisplay: "yíkuàir", key: "er2" },
  { text: "个儿", spokenDisplay: "gèr", wordDisplay: "gèr", key: "er2" },
  { text: "串儿", spokenDisplay: "chuànr", wordDisplay: "chuànr", key: "er2" },
  { text: "事儿", spokenDisplay: "shìr", wordDisplay: "shìr", key: "er2" },
  { text: "人缘儿", spokenDisplay: "rén yuánr", wordDisplay: "rényuánr", key: "er2" },
  { text: "份儿", spokenDisplay: "fènr", wordDisplay: "fènr", key: "er2" },
  { text: "伴儿", spokenDisplay: "bànr", wordDisplay: "bànr", key: "er2" },
  { text: "冰棍儿", spokenDisplay: "bīng gùnr", wordDisplay: "bīnggùnr", key: "er2" },
  { text: "准儿", spokenDisplay: "zhǔnr", wordDisplay: "zhǔnr", key: "er2" },
  { text: "劲儿", spokenDisplay: "jìnr", wordDisplay: "jìnr", key: "er2" },
  { text: "味儿", spokenDisplay: "wèir", wordDisplay: "wèir", key: "er2" },
  { text: "哥儿", spokenDisplay: "gēr", wordDisplay: "gēr", key: "er2" },
  { text: "声儿", spokenDisplay: "shēngr", wordDisplay: "shēngr", key: "er2" },
  { text: "大伙儿", spokenDisplay: "dà huǒr", wordDisplay: "dàhuǒr", key: "er2" },
  { text: "好好儿", spokenDisplay: "hǎo hāor", wordDisplay: "hǎohāor", key: "er5" },
  { text: "宝贝儿", spokenDisplay: "bǎo bèir", wordDisplay: "bǎobèir", key: "er2" },
  { text: "小肚儿", spokenDisplay: "xiǎo dùr", wordDisplay: "xiǎodùr", key: "er2" },
  { text: "心眼儿", spokenDisplay: "xīn yǎnr", wordDisplay: "xīnyǎnr", key: "er2" },
  { text: "摊儿", spokenDisplay: "tānr", wordDisplay: "tānr", key: "er2" },
  { text: "数数儿", spokenDisplay: "shǔ shùr", wordDisplay: "shǔshùr", key: "er2" },
  { text: "明儿", spokenDisplay: "míngr", wordDisplay: "míngr", key: "er2" },
  { text: "样儿", spokenDisplay: "yàngr", wordDisplay: "yàngr", key: "er2" },
  { text: "根儿", spokenDisplay: "gēnr", wordDisplay: "gēnr", key: "er2" },
  { text: "歌儿", spokenDisplay: "gēr", wordDisplay: "gēr", key: "er2" },
  { text: "活儿", spokenDisplay: "huór", wordDisplay: "huór", key: "er2" },
  { text: "海边儿", spokenDisplay: "hǎi biānr", wordDisplay: "hǎibiānr", key: "er2" },
  { text: "牌儿", spokenDisplay: "páir", wordDisplay: "páir", key: "er2" },
  { text: "玩意儿", spokenDisplay: "wán yìr", wordDisplay: "wányìr", key: "er2" },
  { text: "画儿", spokenDisplay: "huàr", wordDisplay: "huàr", key: "er2" },
  { text: "盒儿", spokenDisplay: "hér", wordDisplay: "hér", key: "er2" },
  { text: "码儿", spokenDisplay: "mǎr", wordDisplay: "mǎr", key: "er2" },
  { text: "空儿", spokenDisplay: "kòngr", wordDisplay: "kòngr", key: "er5" },
  { text: "纳闷儿", spokenDisplay: "nà mènr", wordDisplay: "nàmènr", key: "er2" },
  { text: "老头儿", spokenDisplay: "lǎo tóur", wordDisplay: "lǎotóur", key: "er5" },
  { text: "聊天儿", spokenDisplay: "liáo tiānr", wordDisplay: "liáotiānr", key: "er2" },
  { text: "脑儿", spokenDisplay: "nǎor", wordDisplay: "nǎor", key: "er2" },
  { text: "脸蛋儿", spokenDisplay: "liǎn dànr", wordDisplay: "liǎndànr", key: "er2" },
  { text: "腿儿", spokenDisplay: "tuǐr", wordDisplay: "tuǐr", key: "er2" },
  { text: "菜馆儿", spokenDisplay: "cài guǎnr", wordDisplay: "càiguǎnr", key: "er2" },
  { text: "跟儿", spokenDisplay: "gēnr", wordDisplay: "gēnr", key: "er2" },
  { text: "路边儿", spokenDisplay: "lù biānr", wordDisplay: "lùbiānr", key: "er2" },
  { text: "错儿", spokenDisplay: "cuòr", wordDisplay: "cuòr", key: "er2" },
  { text: "鹿尾儿", spokenDisplay: "lù wěir", wordDisplay: "lùwěir", key: "er2" },
  { text: "气儿", spokenDisplay: "qìr", wordDisplay: "qìr", key: "er2" },
  { text: "头儿", spokenDisplay: "tóur", wordDisplay: "tóur", key: "er5" },
  { text: "走调儿", spokenDisplay: "zǒu diàor", wordDisplay: "zǒudiàor", key: "er2" },
 ])(
  "spells every reviewed corpus rhotic suffix in $text",
  ({ text, spokenDisplay, wordDisplay, key }) => {
   const result = analyzeContextualPronunciation({ text });
   const suffix = result.glyphs.find((glyph) => glyph.start === text.length - 1);
   expect(suffix?.text).toBe("儿");
   expect(suffix?.end).toBe(text.length);
   expect(suffix?.lexicalReadingKey).toBe(key);
   expect(suffix?.spokenReadingKey).toBe(key);
   expect(suffix?.spokenPinyin).toBe("r");
   expect(formatContextualSpokenPinyin(result)).toBe(spokenDisplay);
   expect(formatContextualReadingPinyin(result)).toBe(wordDisplay);
   expect(formatContextualPinyinRange(result, 0, text.length)).toBe(spokenDisplay);
  },
 );

 it("keeps the verb and noun readings separate in 数数儿", () => {
  const result = analyzeContextualPronunciation({ text: "数数儿" });
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["shu3", "shu4", "er2"]);
  expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["shu3", "shu4", "er2"]);
  expect(formatContextualReadingPinyin(result)).toBe("shǔshùr");
 });

 it("preserves the existing dictionary tones while spelling the suffix in 好好儿", () => {
  const result = analyzeContextualPronunciation({ text: "好好儿" });
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["hao3", "hao1", "er5"]);
  expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["hao3", "hao1", "er5"]);
  expect(formatContextualReadingPinyin(result)).toBe("hǎohāor");
 });

 it.each([
  {
   text:
    '去年春天，张文、李大勇、赵正从报纸上看到了中国青少年基金会向全社会发出的号召："中国每年有百万儿童失学，他们期待着你的帮助……"他们三人没有商量，没有约定，拿起笔分别向基金会提出资助贫困地区失学儿童的申请。很快，他们得到了回音。按照基金会提供的地址和姓名，他们把钱寄给了青海、甘肃三个陌生的小朋友。如今，他们已资助这三个失学儿童两个学期了。',
   starts: [47, 97, 162],
  },
  {
   text:
    '其实，这三个东北的大学生也并不富裕。张文是农民的儿子。上小学时就曾交不起学费而着急、难过。到了中学二年级，他又因为生病住院花去很多钱。是全校同学为他捐钱，他才能够继续读书的。他说："没有同学们的爱心，我就念不了书，也成不了大学生。如今，还有那么多孩子没有书读，我要像大家帮助我一样地去帮助那些失学儿童。因为我对想上学而上不了学的感受实在太深了。"',
   starts: [24, 148],
  },
  {
   text:
    "李大勇、赵正和张文一样，家里也都不富裕，资助孩子们的钱是从自己的生活费中节省下来的。他们的共同心愿是：真希望有一天，没有一个儿童因为贫困而失学！",
   starts: [62],
  },
  {
   text: "女儿暑假打工",
   starts: [1],
  },
  {
   text:
    '我女儿17岁上大学，今年暑假以后该上二年级了。暑假的第二天，她就和同学们到百货大楼打工去了。原来，我和妻子都希望她能利用假期好好复习复习功课。可女儿说："我要凭自己的本事挣钱交学费。"我们觉得她说的也有道理，让她试着锻炼锻炼吧。',
   starts: [2, 73],
  },
  {
   text:
    '第一天下班回来，女儿激动得不得了，觉得自己长大了，能挣钱了，计算着一个暑假下来能挣多少钱，还计划着用多少钱给我们买礼物，剩下的钱交学费。第二天晚上回来，给我们讲各种顾客买东西时的不同心理，觉得又新鲜又有意思。第三天晚上回来，女儿什么话也没有了。问她怎么了，她只说头疼，腰疼，哪儿都疼。临睡觉的时候，女儿小声对妈妈说："妈，我现在才知道爸和您挣钱真不容易。"十天过去了，女儿的话又多起来。',
   starts: [9, 113, 150, 185],
  },
  {
   text:
    '开学了，女儿结束了打工。她把挣的钱交给妈妈之后，好半天才说出一句话："将来一定要当老板！"我和妻子都呆住了。',
   starts: [5],
  },
  {
   text: "老王为什么精神负担那么重？ (出事) → 因为他儿子最近出事了。",
   starts: [24],
  },
  {
   text:
    "(1) 三个大学生看完信以后笑了。是因为： A. 三个失学儿童回信了。 B. 三个失学儿童做了一个上学的梦。 C. 失学儿童请大学生帮助他们实现上学的梦想。 D. 三个失学儿童又重新回到了课堂。 → Đáp án: D",
   starts: [29, 43, 60, 86],
  },
  {
   text:
    "(2) 基金会提供给三个大学生失学儿童的住址、姓名。是因为： A. 基金会号召社会救助失学儿童。 B. 三个大学生自己提出申请资助失学儿童。 C. 三个大学生已经资助过失学儿童。 D. 三个大学生从报纸上看到了中国青少年基金会的号召。 → Đáp án: B",
   starts: [17, 45, 67, 86],
  },
  {
   text:
    "(2) 三个大学生自己也并不富裕，为什么还要资助失学儿童？ → Vì cả ba đều hiểu rõ cảm giác muốn đi học mà không thể đi học. Họ muốn giống như mọi người đã giúp đỡ mình, dùng tấm lòng của mình giúp đỡ những trẻ em thất học khác.",
   starts: [26],
  },
  {
   text:
    '2. 听录音填空： (Câu hoàn chỉnh trong tài liệu nguồn; không có vị trí trống) → (1) 我女儿17岁上大学，今年暑假以后 该 上二年级 了。\n(2) 原来，我和妻子 都 希望她能 利用 假期好好复习复习功课。 可 女儿说："我要 凭 自己的本事挣钱交学费。" 我们觉得她说的 也 有道理， 让 她试 着 锻炼锻炼吧。\n(3) 第一天下班回来，女儿激动得 不得了，觉得自己长 大 了， 能 挣钱了。\n(4) 临 睡觉的时候，女儿小声 对 妈妈说："妈，我现在 才 知道爸 和 您挣钱真不容易。"\n(5) 十天过去了，女儿的话又多 了。开学了，女儿结束 了 打工。她 把 挣的钱交 给 妈妈之后，好半天才说 出 一句话："将来一定 要 当老板！" 我和妻子都呆 了。',
   starts: [79, 141, 205, 245, 291, 304],
  },
  {
   text: "胖嫂结婚一年，就生了一个胖儿子，日子过得很开心。",
   starts: [13],
  },
  {
   text:
    "2. 听录音填空： (Câu hoàn chỉnh trong tài liệu nguồn; không có vị trí trống) → (1) 胖嫂结婚一年，就生了一个胖儿子，日子过得 很开心。\n(2) 晚上，胖嫂一个人 哄着 孩子睡觉。忽然有人敲门。\n(3) 胖嫂急得 不得了，马上抱起孩子就走。\n(4) 胖嫂走 着 走 着 就进了西瓜地。她 被 绊了一交，孩子也被摔 到 了地上。\n(5) 她连忙爬 起来，抱 起 孩子 就 走。\n(6) 到了娘家才发现她手里抱的并 不是 孩子，而 是 一个西瓜。\n(7) 进屋一看，发现孩子在床上睡得 正香呢。",
   starts: [90],
  },
  {
   text: "(3) 老汉冲儿子瞪了一眼，扭头就走了. Ông già trợn mắt với con trai, quay đầu bỏ đi.",
   starts: [7],
  },
  {
   text:
    '噢。我儿子的一个好朋友在国外留学。昨天夜里他给那个朋友打了个国际长途。"每逢佳节倍思亲"嘛，也让好朋友高兴高兴。',
   starts: [3],
  },
  {
   text:
    "(2) 法制观念的教育，应从儿时做起. Giáo dục quan niệm pháp chế, nên bắt đầu từ lúc còn nhỏ.",
   starts: [14],
  },
  {
   text:
    '一天午饭后，大家正热烈讨论"面的"拒载的问题时，办公室张主任进来了。小李问："主任，您要碰上出租车拒载怎么办？"张主任笑笑说："告诉你们一个好办法，你们若碰上拒载，马上从口袋里掏出笔和纸，假装记他的车牌号。司机准以为你要投诉，他会马上很客气地请你上车。这办法我用过多次，每次都很灵。这是我那开\'面的\'的儿子告诉我的。"',
   starts: [151],
  },
  {
   text:
    '一天晚饭后，张主任和儿子聊天儿。儿子突然问道："我告诉您的好办法，您是不是跟您单位的人说了？"张主任不明白地问："怎么了？"儿子说："今天下午我路过您单位时，从公司院里出来个人叫车。我一听又是九公里多。我刚说不往那边去，他马上伸手掏钢笔。我一看，心想，想用这办法治我呀，你还差点儿。我没等他摸着钢笔，一踩油门跟他拜拜了。"',
   starts: [10, 16, 62],
  },
  {
   text:
    "我一大早就起来了，收拾屋子，做早点，把要换的干净衣服找出来……都十点多了。他还在床上睡着呢。儿子又闹着要去公园。",
   starts: [46],
  },
  {
   text: "你让儿子去叫他了？",
   starts: [2],
  },
  {
   text: "醒了还不好办，你和儿子一起拉他起床。",
   starts: [9],
  },
  {
   text:
    "不管儿子怎么拉他，他嘴里答应着，可身子就是不动。我想这个星期天又完了，正不知该怎么办呢，一眼发现了他放在枕头旁边的BP机。",
   starts: [2],
  },
  {
   text:
    '对。我悄悄溜进客厅，拿起电话，声音压得很低："请急呼3129。速来单位。"然后就像什么事儿也没发生一样，对着镜子梳起头来，从镜子里我能看见他和儿子。',
   starts: [71],
  },
  {
   text: "那你儿子肯定又要噘大嘴了吧？",
   starts: [2],
  },
  {
   text:
    '儿子哭着脸说，今天又没戏了。看到他俩都如此认真，我忍不住笑了，赶快说："是我呼的，叫你起床。"',
   starts: [0],
  },
  {
   text: '他大喊："上当啦！儿子，你妈骗人该打是不是？"',
   starts: [9],
  },
  {
   text: "儿子肯定向着你，要不，他能去公园吗？",
   starts: [0],
  },
  {
   text:
    '儿子高兴得拍着小手，左边看看爸，右边看看妈，拉着长声喊："我不知道！"冬梅，你说这法子好吗？',
   starts: [0],
  },
  {
   text: "(2) 张主任的儿子是怎样对待乘客的？ → Thấy hành khách muốn tố cáo thì anh ta bỏ chạy.",
   starts: [8],
  },
  {
   text: "(1) 父亲亲自开车去接女儿. Bố tự lái xe đi đón con gái.",
   starts: [13],
  },
  {
   text:
    "婷婷还画了一只老母鸡。老母鸡下了一个蛋。那蛋比老母鸡还大。婷婷就拿那幅画去参加西班牙的一个国际儿童画展。结果，婷婷得了一等奖。",
   starts: [47],
  },
  {
   text:
    "(5) 老太太连哭带骂，闹着闹着儿子回来了. Bà cụ vừa khóc vừa chửi, làm ầm mãi làm ầm mãi con trai về.",
   starts: [16],
  },
  {
   text:
    "(7) 儿子吵着闹着一定要买那件T恤衫. Con trai làm ầm ĩ mãi nhất định phải mua cái áo thun đó.",
   starts: [4],
  },
  {
   text:
    "(4) 父亲不让儿子吸烟是为了孩子的身体健康. Cha không cho con hút thuốc là vì sức khỏe của con.",
   starts: [8],
  },
  {
   text: "(1) 姑姑只有一个女儿，正上初中. Cô chỉ có một cô con gái, đang học cấp hai.",
   starts: [11],
  },
  {
   text:
    "(6) 王师傅的女儿在拼命学英语，她打算去海外做生意. Con gái thợ Vương đang học tiếng Anh hết sức, cô ấy dự định ra nước ngoài làm ăn.",
   starts: [9],
  },
  {
   text: "(4) 丈夫气坏了，狠狠打了儿子两巴掌. Người chồng tức quá, đánh con trai hai cái tát.",
   starts: [14],
  },
  {
   text:
    "徐民5岁时，得了小儿麻痹症，腿脚一直不方便。作为残疾人，他比一般人更早更多地尝到了找工作的酸甜苦辣。过去，他在长江手表零件厂工作。这是一家街道办的小厂，专为上海某手表大厂生产加工零件。随着市场经济的发展，长江手表零件厂和大厂合并了。",
   starts: [9],
  },
  {
   text:
    '(1) "六一"儿童节那天，孩子们唱啊跳啊，尽情地享受着节日的快乐. Ngày Quốc tế Thiếu nhi 1/6, bọn trẻ hát nhảy, thoải mái hưởng niềm vui ngày lễ.',
   starts: [8],
  },
  {
   text:
    "(9) 想到很快就要和妻子、儿女们团聚了，他高兴得一夜没睡好. Nghĩ đến sắp được đoàn tụ với vợ và các con, anh ấy vui đến nỗi không ngủ ngon cả đêm.",
   starts: [14],
  },
  {
   text:
    "(3) 王庆发带着小儿子特地从青岛来到村里. Vương Khánh Phát đưa con trai út đặc biệt từ Thanh Đảo đến làng.",
   starts: [10],
  },
  {
   text:
    "我们谈到了他女儿的工作。他说他女儿学的是企业管理，很想到一家中外合资企业工作。他听说我有一个同学在那家合资企业当人事部经理，希望我能帮忙介绍一下。我这人一向热情，朋友托办的事，不管办成办不成，我总是满口答应。可是，这次我却犹豫了。",
   starts: [7, 16],
  },
  {
   text:
    '看到老朋友期待的目光，我不忍心直接拒绝他。想了很久，我才慢慢地说："老同学，不是我不帮忙，实在是这个忙不能帮。你女儿如果有真才实学，相信她凭自己的本领也一定能找到满意的工作。"',
   starts: [57],
  },
  {
   text: "(5) 你女儿如果有真才实学，相信她凭自己的本领也一定能找到满意的工作。",
   starts: [6],
  },
  {
   text: "女儿的肖像权",
   starts: [1],
  },
  {
   text:
    "林老师在中学教美术。他有一个13岁的女儿，正在上初中。女儿从小就喜欢画画儿，而且画得很不错。林老师为女儿感到骄傲。",
   starts: [19, 28, 51],
  },
  {
   text:
    '一天，女儿放学回家，气呼呼地对林老师说："爸爸，我今天生气了。美术老师把我的画拿去参展，也不告诉我一声。她侵犯了我的肖像权！"',
   starts: [4],
  },
  {
   text:
    '女儿说："肖像权就是每个人的照片、画像不能随便让别人使用。老师没有经过我的同意，就把我的画拿去展出，这不就是侵犯了我的肖像权吗？"',
   starts: [1],
  },
  {
   text: "女儿听后，不好意思地笑了。",
   starts: [1],
  },
  {
   text:
    "(2) 老师为什么没有侵犯女儿的肖像权？ → Vì thầy mang tranh đi triển lãm để nâng cao trình độ vẽ (mục đích chính đáng), và con gái vẽ phong cảnh chứ không vẽ chân dung.",
   starts: [14],
  },
  {
   text: "(3) 女儿听后有什么反应？ → Ngại ngùng cười, hiểu ra.",
   starts: [5],
  },
  {
   text:
    "平时她的丈夫工作很忙，买菜、做饭、洗衣服、照顾孩子等家务大部分是她做。每天早上给一家人准备好简单的早饭，然后送孩子去幼儿园，送完孩子自己才去上班。晚上下了班，先把孩子接回家，然后马上进厨房做晚饭。有时丈夫会在一旁帮助她。吃晚饭是一家人最愉快的时候。她和丈夫聊家常，谈论各自单位里的新闻。孩子也在一旁凑热闹，比比画画地给爸爸妈妈讲幼儿园里发生的事情：那个叫丽丽的小朋友哭鼻子了，冬冬又打架了……孩子天真的话语和认真的神态，常常逗得夫妻俩哈哈大笑。",
   starts: [59, 165],
  },
  {
   text:
    "2. 大年三十这一天孩子没有做什么?\nA. 穿新衣服\nB. 跑来跑去\nC. 去幼儿园\nD. 去爷爷家 → C. 去幼儿园 ✓\n👉 Đáp án: C (大年三十不用去幼儿园)",
   starts: [40, 58, 85],
  },
  {
   text:
    "3. 每天早上她不用做什么?\nA. 洗衣服\nB. 做早饭\nC. 送孩子上幼儿园\nD. 上班 → A. 洗衣服 ✓\n👉 Đáp án: A (洗衣服不是每天早上做的)",
   starts: [37],
  },
  {
   text:
    "5. 孩子每天上幼儿园是\nA. 妈妈送爸爸接\nB. 爸爸送妈妈接\nC. 妈妈送妈妈接\nD. 爸爸送爸爸接 → A. 妈妈送爸爸接 ✓\n👉 Đáp án: A (妈妈送，晚上妈妈接，但爸爸有时帮忙)",
   starts: [9],
  },
  {
   text: "他们的孩子名字叫冬冬。 → Sai (冬冬是幼儿园同学) ❌",
   starts: [23],
  },
  {
   text: "夫妻俩哈哈大笑是因为幼儿园很有意思。 → Sai (是因为孩子天真的话语和神态) ❌",
   starts: [11],
  },
  {
   text: "2. 她每天都要做什么事？ → 做早饭、送孩子上幼儿园、上班、下班接孩子、做晚饭、做家务。",
   starts: [25],
  },
  {
   text: "3. 平时孩子白天在哪儿？ → 在幼儿园。",
   starts: [18],
  },
  {
   text:
    "现在，不少家庭都请了小保姆。小保姆为主人分担了大量的家务：照顾孩子、洗衣做饭、打扫卫生……为双职工家庭解决了不少生活上的困难，很受城市家庭的欢迎。但是随着保姆进入家庭，烦恼也出现了。在城市，大部分家庭住房比较拥挤，小保姆的到来使居住空间更加狭小，生活上带来许多不便。多数小保姆来自农村，对城市生活方式不熟悉，所以事事都离不开主人的操心。还有，小保姆的年龄普遍偏低，生活经历少，做事常常缺少耐心，很难做好照顾幼儿、老人或病人的工作。因此，人们迫切需要钟点工。",
   starts: [204],
  },
  {
   text: "人们需要钟点工只是为了照顾幼儿、老人和病人。 → Sai (是为了避免小保姆带来的麻烦) ❌",
   starts: [14],
  },
  {
   text:
    "1. 随着小保姆进入家庭，出现了哪些烦恼? → (1) 住房拥挤，居住空间更加狭小\n(2) 小保姆对城市生活方式不熟悉，事事需要主人操心\n(3) 年龄小，缺少耐心，难做好照顾幼儿、老人、病人的工作",
   starts: [88],
  },
  {
   text:
    '堂弟是独生子，婶婶极力主张办酒席。"我就一个儿子，说什么也得把婚礼办得像样点儿。要不然，别人会笑话咱的！"这是婶婶的理由。',
   starts: [22],
  },
  {
   text:
    "4. 婶婶极力主张办酒席，是因为\nA. 她只有一个儿子\nB. 担心别人笑话\nC. 只有办了酒席婚礼才能举行\nD. 这样可以多收一些礼物 → B. 担心别人笑话 ✓\n👉 Đáp án: B",
   starts: [25],
  },
  {
   text:
    "他们是在林虹毕业的第二年结婚的。一年后，他们的儿子——萨沙出生了。这时俄罗斯的经济情况不太好，他们这个跨国家庭的生活日益艰难。于是林虹便和丈夫带着不满一岁的萨沙回到了北京。",
   starts: [23],
  },
  {
   text:
    "可以说，一个家庭对人的意义远远超过了男女相爱的层面。首先，家庭能够把世世代代连接起来，有限的人生由于家庭的存在而使人感觉永远，家庭增加了生命的精神意义，使生命显得更加重要和严肃；其次，人在家庭养育子女的过程中，看着小生命一步步从婴儿、幼儿、学龄、青少年、青年到成年，内心时时激起对生命的惊叹、喜悦和迷惑，有一种送给自己另一个生命的感觉；再次，在家庭中，人更能感觉到自身的能力，觉得自己对孩子是重要的，必须保护他、照顾他、指导他，感觉自己是父亲、是母亲、是比孩子强的人；最后，在家庭中，每一个人都会有清楚的人生目标，如何让新的生命成长得更好，如何为新的生命创造更好的未来，如何支持孩子实现他自己……做了父母，养育幼小生命长大，人就有了充实感、能力感和坚定的生活目标。",
   starts: [115, 118],
  },
  {
   text:
    "看着小生命 ____ 从 ____ 到 ____，内心 ____ 激起对生命的 ____ 和 ____。 → 看着小生命 一步步 从 婴儿 到 成年，内心 时时 激起对生命的 惊叹、喜悦 和 迷惑。",
   starts: [68],
  },
  {
   text:
    "中国有一个传统，就是养儿防老。年轻的时候多养一些孩子，年龄大了，不能再工作了，就由孩子们照顾自己的生活。所以，中国老人一般都和儿子住在一起，由儿子、儿媳来照顾。如果没有儿子，就和女儿住在一起。但是，随着社会的发展，越来越多的年轻人离开家乡去外地工作。有的虽然和父母住在一个城市，却因为工作太忙无法照顾父母。当然也有少数儿女不愿意照顾自己的父母。这样的老人是怎样生活的呢？",
   starts: [11, 63, 71, 74, 84, 90, 159],
  },
  {
   text:
    "2. 儿媳\nA. 儿子的妻子\nB. 父亲的妻子\nC. 女儿的孩子\nD. 丈夫的妹妹 → A. 儿子的妻子 ✓\n👉 Đáp án: A",
   starts: [3, 9, 28, 47],
  },
  {
   text:
    "1. 中国的传统是老人\nA. 和儿子一起住\nB. 和女儿一起住\nC. 住在敬老院\nD. 单独生活 → A. 和儿子一起住 ✓\n👉 Đáp án: A",
   starts: [16, 27, 55],
  },
  {
   text:
    "4. 下面哪一种情况不是老人无人照顾的原因？\nA. 儿女离开了家乡\nB. 儿女工作太忙\nC. 不喜欢和儿女住在一起\nD. 儿女不喜欢照顾父母 → C. 不喜欢和儿女住在一起 ✓\n👉 Đáp án: C (bài không đề cập)",
   starts: [26, 37, 51, 61, 80],
  },
  {
   text: "中国的老人常常 ____ 儿子、儿媳 ____ 照顾。 → 中国的老人常常 由 儿子、儿媳 来 照顾。",
   starts: [13, 16, 40, 43],
  },
  {
   text:
    "旗袍一般都是手工裁剪缝制的。做一件好旗袍不但要有高超的技术，还需要花费很长的时间，所以现在做旗袍的裁缝已经很少了，像曹师傅这样能做一手好旗袍的裁缝更是难以找到。两位老人常常担心这门技术会失传。不过，让老两口感到安慰的是，在他们的五个孩子中，最小的女儿喜欢上了做旗袍。老人说，看来我们的技术就传给她了。",
   starts: [124],
  },
  {
   text:
    '3. "旗袍师傅"是指\nA. 曹师傅\nB. 李师傅\nC. 曹师傅和李师傅\nD. 曹师傅、李师傅和他们的女儿 → C. 曹师傅和李师傅 ✓\n👉 Đáp án: C',
   starts: [52],
  },
  {
   text:
    '8. "曹师傅的小女儿喜欢上了做旗袍"，意思是\nA. 小女儿喜欢上来做旗袍\nB. 小女儿喜欢去做旗袍\nC. 小女儿开始喜欢做旗袍了\nD. 小女儿以前喜欢做旗袍 → C. 小女儿开始喜欢做旗袍了 ✓\n👉 Đáp án: C',
   starts: [10, 29, 43, 56, 71, 87],
  },
  {
   text: "旗袍师傅的技术马上要失传了。 → Sai (女儿喜欢上做旗袍了) ❌",
   starts: [23],
  },
  {
   text: "旗袍师傅有五个女儿。 → Sai (是五个孩子，不确定都是女儿) ❌",
   starts: [8, 30],
  },
  {
   text: "看到小女儿喜欢做旗袍，旗袍师傅很高兴。 → Đúng ✓",
   starts: [4],
  },
  {
   text:
    "让 ____ 感到安慰的是，小女儿喜欢 ____ 做旗袍。 → 让 老两口 感到安慰的是，小女儿喜欢 上 做旗袍。",
   starts: [16, 47],
  },
  {
   text: "于是，大臣把国王的小儿子领到了他的面前。小儿子哼哼唧唧地说：",
   starts: [10, 21],
  },
  {
   text: "国王一看见他的宝贝儿子，马上露出了笑容。他手忙脚乱地从宝座上站起来，把水端给孩子。",
   starts: [9],
  },
  {
   text: '"爸爸，我想喝牛奶！"小儿子又哭着说。',
   starts: [12],
  },
  {
   text: "国王马上命人去取牛奶。牛奶送来了，国王亲自把它倒好，端到儿子面前。",
   starts: [28],
  },
  {
   text: '"爸爸，给牛奶里掺些水。"小儿子含含糊糊地说。',
   starts: [14],
  },
  {
   text: '"什么？"国王不明白儿子要干什么。',
   starts: [10],
  },
  {
   text: '"我要嘛！我要嘛！"儿子开始撒娇。',
   starts: [10],
  },
  {
   text:
    '国王没有办法，只好给牛奶里倒了一些水。这时小儿子调皮地笑起来："爸爸，把水从牛奶里分出来！"',
   starts: [22],
  },
  {
   text:
    '小儿子便开始大哭特哭。一直坐在一旁的大臣微笑地看着国王，国王连连摇头，叹服道："确实，小儿子比我厉害。难怪人们都说，小孩子就是皇帝。"',
   starts: [1, 44],
  },
  {
   text:
    "3. 国王火冒三丈是因为\nA. 儿子开始撒娇\nB. 儿子调皮地笑起来\nC. 他不能把水从牛奶里分出来\nD. 儿子提出了过分的要求 → C. 他不能把水从牛奶里分出来 ✓\n👉 Đáp án: C",
   starts: [16, 26, 54],
  },
  {
   text:
    "4. 国王的儿子大哭特哭是因为\nA. 他想分别喝牛奶和水\nB. 国王火冒三丈\nC. 国王没有满足他的要求\nD. 国王批评了他 → C. 国王没有满足他的要求 ✓\n👉 Đáp án: C",
   starts: [6],
  },
  {
   text:
    "6. 国王连连摇头是因为\nA. 一点儿也不相信大臣的话\nB. 他的威力在儿子面前没有用\nC. 对他的儿子一点儿也不满意\nD. 不知道怎样把水从牛奶里分出来 → B. 他的威力在儿子面前没有用 ✓\n👉 Đáp án: B",
   starts: [36, 50, 88],
  },
  {
   text:
    "7. 下面哪一句话正确？国王\nA. 很喜欢含含糊糊的儿子\nB. 很怕哼哼唧唧的儿子\nC. 从来不对儿子生气\nD. 在儿子面前失去了威力 → D. 在儿子面前失去了威力 ✓\n👉 Đáp án: D",
   starts: [26, 39, 49, 58, 74],
  },
  {
   text: "国王的儿子撒娇是因为他非常爱国王。 → Sai (vì muốn đòi hỏi) ❌",
   starts: [3],
  },
  {
   text: "国王的儿子喜欢喝牛奶里的水。 → Sai (không phải thích mà là đòi hỏi) ❌",
   starts: [3],
  },
  {
   text: "国王的儿子大哭特哭，国王对他没办法。 → Đúng ✓",
   starts: [3],
  },
  {
   text: '小儿子 ____ 地说："爸爸，我要喝水。" → 小儿子 哼哼唧唧 地说："爸爸，我要喝水。"',
   starts: [1, 26],
  },
  {
   text:
    '小儿子 ____ 地说："爸爸，给牛奶里 ____ 些水。" → 小儿子 含含糊糊 地说："爸爸，给牛奶里 掺 些水。"',
   starts: [1, 34],
  },
  {
   text:
    "我有一个幸福快乐的家。我在工厂上班，妻是营业员，我们的性格都很开朗。唯一的宝贝女儿天真活泼，非常惹人喜爱。平时，我们的家总是歌声、笑声不断。但是，自从女儿上了高三，家里的歌声、笑声就越来越少了。",
   starts: [40, 76],
  },
  {
   text:
    "女儿每日埋头复习功课。常常是我们一觉醒来，她房间的灯还亮着。妻整天想尽办法为女儿补充营养，鸡呀、鱼呀换着花样地做，还买了一大堆营养品。我的任务呢，是为女儿寻找最新、最好的高考复习资料。",
   starts: [1, 39, 76],
  },
  {
   text:
    "随着高考的临近，我家饭桌上的话题只有学习和考试了。女儿的脾气也越来越大了，有时一句话没说好，就会引发一场争吵。唉，孩子的压力也够大的了。",
   starts: [26],
  },
  {
   text:
    "我和妻子都没有上过大学，所以我们最大的愿望就是让孩子接受高等教育。从女儿一出生，我们就开始为她积蓄教育基金。可是，愿望归愿望，高考这个独木桥真是不好过啊！望着女儿疲倦的样子，我们心里也很难过。",
   starts: [35, 80],
  },
  {
   text:
    '考试的日子终于到了。我特意请了两天假。这天天不亮我就起来了。考场离家很远，我和女儿得早点儿去。女儿进了考场。我和所有的家长一样，在考场外紧张不安地等待。十一点四十分，第一场考试结束了。我看见一个男孩子冲着迎上来的父母就是一句："看样子明年还得再来。"我的心紧张得几乎不跳了。女儿终于出来了，她的脸上带着笑容，我的心这才像一块石头落了地。',
   starts: [40, 48, 138],
  },
  {
   text:
    "3. 我的任务是\nA. 做好吃的饭菜\nB. 买营养品\nC. 和女儿一起复习功课\nD. 寻找最新、最好的高考复习资料 → D. 寻找最新、最好的高考复习资料 ✓\n👉 Đáp án: D",
   starts: [32],
  },
  {
   text:
    '4. "常常是我们一觉醒来，她房间的灯还亮着。"意思是\nA. 女儿睡觉喜欢开着灯\nB. 女儿房间的灯坏了\nC. 女儿复习功课，很晚才睡\nD. 我和妻子喜欢早早睡觉 → C. 女儿复习功课，很晚才睡 ✓\n👉 Đáp án: C',
   starts: [32, 45, 57, 88],
  },
  {
   text:
    '5. "女儿的脾气也越来越大"，意思是：女儿\nA. 学习的兴趣越来越大\nB. 越来越努力\nC. 越来越喜欢生气\nD. 学习的力量越来越大 → C. 越来越喜欢生气 ✓\n👉 Đáp án: C',
   starts: [5, 21],
  },
  {
   text:
    "7. 我和妻子的最大愿望是\nA. 女儿天真活泼\nB. 家庭幸福\nC. 让孩子接受高等教育\nD. 有很多钱 → C. 让孩子接受高等教育 ✓\n👉 Đáp án: C",
   starts: [18],
  },
  {
   text:
    "我的家庭很幸福，因为自从女儿上高三以后，我们家总是歌声、笑声不断。 → Sai (từ khi lên lớp 12 thì ít hơn) ❌",
   starts: [13],
  },
  {
   text: "我们家今年的气氛和往年不一样，因为女儿要参加高考。 → Đúng ✓",
   starts: [18],
  },
  {
   text: "我的女儿学习很努力。 → Đúng ✓",
   starts: [3],
  },
  {
   text: "我和妻子想让女儿受高等教育是因为我们为她存了很多钱。 → Sai ❌",
   starts: [7],
  },
  {
   text: "从女儿脸上的表情看，她考得不错。 → Đúng ✓",
   starts: [2],
  },
  {
   text: "唯一的宝贝女儿 ____ 非常 ____。 → 唯一的宝贝女儿 天真活泼 非常 惹人喜爱。",
   starts: [6, 30],
  },
  {
   text:
    "妻为了给女儿 ____ 鸡呀、鱼呀 ____ 地做。 → 妻为了给女儿 补充营养 鸡呀、鱼呀 换着花样 地做。",
   starts: [5, 34],
  },
  {
   text: "看到女儿的笑容，我的心这才 ____。 → 看到女儿的笑容，我的心这才 像一块石头落了地。",
   starts: [3, 25],
  },
  {
   text:
    "3. 上高三以后，女儿有什么变化? → Học hành vất vả, thức khuya, tính khí nóng nảy, dễ cáu gắt.",
   starts: [10],
  },
  {
   text:
    "在中国，妇女穿裙子的习惯兴起于汉代，到了隋唐已经很流行了。这时候的裙子大多用六幅布拼制而成，布料的总宽度大约等于今天的三米。隋唐时代的裙子不但很宽，而且也很长，从胸部一直拖到地上。唐代的年轻妇女最喜欢的是石榴裙。所谓石榴裙，实际上是一种非常鲜艳的红裙。唐代最有名的是百鸟裙。传说唐代有一名叫尚方的纺织匠，用一百多种不同的鸟的羽毛，为唐中宗的女儿安乐公主织成了一条百鸟毛花裙。这条裙子非常神奇，它正看是一色，倒看是一色，白天看是一色，灯下看又是一色。更绝的是，百鸟的样子也可以从裙中隐隐地看到。",
   starts: [171],
  },
  {
   text:
    "另外，不同年龄段的人，作息节律也不一样。婴儿每天要睡十几个小时，老年人睡得比较少，一般睡五六个小时就够了。",
   starts: [21],
  },
  {
   text:
    "哭是人类的一种本能。人从一生下来就会哭。婴儿哭，是为了告诉大人自己饿了、渴了、不舒服了。长大了以后，人们哭的原因就更多了：伤心了哭，高兴了也哭；受委屈了哭，被感动了也哭。",
   starts: [21],
  },
  {
   text:
    "1. 婴儿哭是为了什么？\nA. 告诉大人自己饿了、渴了、不舒服了\nB. 引起大人注意\nC. 表达高兴\nD. 为了好玩 → A. 告诉大人自己饿了、渴了、不舒服了 ✓\n👉 Đáp án: A",
   starts: [4],
  },
  {
   text:
    "哪些人容易受到电子雾的影响呢？首先是经常使用手机的人。手机的电磁辐射比较强，尤其是在信号不好的时候，辐射会更大。其次是长时间用电脑工作的人。电脑屏幕的辐射虽然比手机小，但长期近距离接触，也会对身体造成伤害。还有孕妇、儿童和老人，他们的身体比较敏感，更容易受到电子雾的影响。",
   starts: [108],
  },
  {
   text: "孕妇和儿童更容易受到电子雾的影响。 → Đúng ✓",
   starts: [3],
  },
  {
   text: "价格：成人——RMB 698元　儿童——RMB 355元",
   starts: [16],
  },
  {
   text: "价格：成人——RMB 950元　儿童——RMB 670元",
   starts: [16],
  },
  {
   text:
    "“按理说”，按照一般的情况和道理应该……，但实际上并未这样。例如：\n① 按理说，春节应该和家里人一起过，可是我工作太忙回不去。\n② 按理说，这么大年纪了应该好好享受生活了，可是为了儿女他还在拼命地工作。",
   starts: [90],
  },
  {
   text:
    "“毕竟”，强调不管怎么样，某一客观事实不会改变。例如：\n① 这儿的圣诞节也有很多活动，也很热闹，可毕竟不是在自己的国家，还是有点儿想家。\n② 他再聪明也毕竟是个孩子。\n③ 他们以前看法不一样，常常吵架，可他们毕竟是父亲和儿子的关系，很快就原谅对方了。",
   starts: [110],
  },
  {
   text:
    "② 他们虽然已经分手了，可是因为相爱过，彼此还是很关心。\n③ 儿子恨了爸爸很多年，但最后还是原谅了他。\n④ 他再聪明也只是个孩子，不能胜任这个工作。\n⑤ 他虽然在中国住了很多年，汉语也相当流利，但因为是外国人，还是有很多情况不了解。",
   starts: [31],
  },
  {
   text:
    "① 我不喜欢吃这个菜，所以饿着也不吃。\n② 他不喜欢自己的儿女，打算把遗产留给外人也不给他们。\n③ 为了供孩子上大学，这位母亲一个人干了两份工作，非常辛苦。\n④ 他不喜欢那条路，每次去学校都绕远路。\n⑤ 为了方便大家，我自己辛苦一点儿没关系。",
   starts: [29],
  },
  {
   text:
    "不过，不同文化的人结合面临的困难总是比较多。也许相爱容易，但是婚姻就没那么简单了。就拿我朋友来说，他的父母就比较保守，当初不太愿意他和法国女友结婚，为这事他们吵得不可开交。他的父母甚至说宁可不要这个儿子，也不愿意他们结婚。",
   starts: [99],
  },
  {
   text: "他们要合作生产什么东西？ A. 电动玩具  B. 儿童文具  C. 儿童拉杆书包  D. 电子产品",
   starts: [25, 34],
  },
  {
   text: "男的和女的是什么关系？ A. 父亲和女儿  B. 老师和学生  C. 经理和助理  D. 员工和客户",
   starts: [19],
  },
  {
   text:
    '开业那天早晨，下起了小雨，小李很不安。妈妈却说："老人们都说，下雨意味着招财进宝，别人还求之不得呢。"一句话说得儿子开心起来。 (Sáng ngày khai trương, trời đổ mưa nhỏ, Tiểu Lý rất lo lắng. Mẹ lại nói: "Người già đều nói, mưa có nghĩa là hút tài lộc vào nhà, người khác còn cầu còn không được." Một câu nói khiến con trai vui vẻ trở lại.)',
   starts: [56],
  },
  {
   text:
    "她出差在外，______ 她的女儿。 A. 不放下心  B. 放心不下  C. 不下放心  D. 放下不心 → B. 放心不下",
   starts: [16],
  },
  {
   text:
    "麦当劳良好的服务是什么？ A. 标准地露八颗牙齿的微笑  B. 排队不会超过两分钟  C. 为儿童顾客举办生日聚会  D. 以上三项都正确",
   starts: [47],
  },
  {
   text:
    '1. "养儿防老"是什么意思? → Là khi còn trẻ sinh nhiều con, đến khi về già không làm việc được nữa thì do con cái chăm sóc.',
   starts: [5],
  },
 ])("keeps independent lexical 儿 at all reviewed corpus offsets in $text", ({ text, starts }) => {
  const result = analyzeContextualPronunciation({ text });
  for (const start of starts) {
   const glyph = result.glyphs.find((item) => item.start === start);
   expect(glyph?.text).toBe("儿");
   expect(glyph?.end).toBe(start + 1);
   expect(glyph?.lexicalReadingKey).toBe("er2");
   expect(glyph?.spokenReadingKey).toBe("er2");
   expect(glyph?.spokenPinyin).toBe("ér");
  }
 });

 it.each([
  { text: "这儿女孩子很多", readings: ["er2"], spellings: ["r"], wordPrefix: "zhèr " },
  { text: "这儿子弹很便宜", readings: ["er2"], spellings: ["r"], wordPrefix: "zhèr zǐdàn " },
  {
   text: "大伙儿女儿都结婚了",
   readings: ["er2", "er2"],
   spellings: ["r", "ér"],
   wordPrefix: "dàhuǒr ",
  },
  { text: "玩儿儿童玩具", readings: ["er2", "er2"], spellings: ["r", "ér"], wordPrefix: "wánr " },
 ])(
  "recognizes a reviewed rhotic word before a separate lexical 儿 word in $text",
  ({ text, readings, spellings, wordPrefix }) => {
   const result = analyzeContextualPronunciation({ text });
   const glyphs = result.glyphs.filter((glyph) => glyph.text === "儿");
   expect(glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(readings);
   expect(glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(readings);
   expect(glyphs.map((glyph) => glyph.spokenPinyin)).toEqual(spellings);
   expect(formatContextualReadingPinyin(result).startsWith(wordPrefix)).toBe(true);
  },
 );

 it("preserves UTF-16 offsets for 这儿 before a separate 女孩子 word", () => {
  const result = analyzeContextualPronunciation({ text: "🙂这儿女孩子很多" });
  const glyph = result.glyphs.find((item) => item.start === 3);
  expect(glyph?.text).toBe("儿");
  expect(glyph?.end).toBe(4);
  expect(glyph?.lexicalReadingKey).toBe("er2");
  expect(glyph?.spokenReadingKey).toBe("er2");
  expect(glyph?.spokenPinyin).toBe("r");
  expect(formatContextualPinyinRange(result, 2, 4)).toBe("zhèr");
  expect(formatContextualReadingPinyin(result).startsWith("🙂zhèr ")).toBe(true);
 });

 it("keeps original UTF-16 offsets around rhotic and independent 儿", () => {
  const result = analyzeContextualPronunciation({ text: "🙂哪儿，女儿。" });
  expect(
   result.glyphs.map((glyph) => ({
    text: glyph.text,
    start: glyph.start,
    end: glyph.end,
    lexical: glyph.lexicalReadingKey,
    spoken: glyph.spokenReadingKey,
    pinyin: glyph.spokenPinyin,
   })),
  ).toEqual([
   { text: "哪", start: 2, end: 3, lexical: "na3", spoken: "na3", pinyin: "nǎ" },
   { text: "儿", start: 3, end: 4, lexical: "er2", spoken: "er2", pinyin: "r" },
   { text: "女", start: 5, end: 6, lexical: "nv3", spoken: "nv3", pinyin: "nǚ" },
   { text: "儿", start: 6, end: 7, lexical: "er2", spoken: "er2", pinyin: "ér" },
  ]);
  expect(formatContextualSpokenPinyin(result)).toBe("🙂nǎr，nǚ ér。");
  expect(formatContextualReadingPinyin(result)).toBe("🙂nǎr，nǚ'ér。");
  expect(formatContextualPinyinRange(result, 2, 4)).toBe("nǎr");
  expect(formatContextualPinyinRange(result, 3, 4)).toBe("r");
  expect(formatContextualPinyinRange(result, 5, 7)).toBe("nǚ ér");
  expect(formatContextualPinyinRange(result, 6, 7)).toBe("ér");
 });

 it.each([
  { sourcePinyin: "nǎr", pinyin: ["nǎ", "r"], display: "nǎr", wordDisplay: "nǎr" },
  { sourcePinyin: "na3r", pinyin: ["nǎ", "r"], display: "nǎr", wordDisplay: "nǎr" },
  { sourcePinyin: "nǎ ér", pinyin: ["nǎ", "ér"], display: "nǎ ér", wordDisplay: "nǎ'ér" },
  { sourcePinyin: "na3er2", pinyin: ["nǎ", "ér"], display: "nǎ ér", wordDisplay: "nǎ'ér" },
 ])(
  "preserves explicit source suffix spelling $sourcePinyin",
  ({ sourcePinyin, pinyin, display, wordDisplay }) => {
   const result = analyzeContextualPronunciation({ text: "哪儿", sourcePinyin });
   expect(result.sourcePinyinStatus).toBe("aligned");
   expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["na3", "er2"]);
   expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["na3", "er2"]);
   expect(result.glyphs.map((glyph) => glyph.spokenPinyin)).toEqual(pinyin);
   expect(result.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))).toBe(true);
   expect(formatContextualSpokenPinyin(result)).toBe(display);
   expect(formatContextualReadingPinyin(result)).toBe(wordDisplay);
   expect(formatContextualPinyinRange(result, 0, 2)).toBe(display);
  },
 );

 it.each([
  { pinyin: "nǎr", display: "nǎr", wordDisplay: "nǎr", syllables: ["nǎ", "r"] },
  { pinyin: "nǎ ér", display: "nǎ ér", wordDisplay: "nǎ'ér", syllables: ["nǎ", "ér"] },
 ])(
  "preserves provided dictionary suffix spelling $pinyin",
  ({ pinyin, display, wordDisplay, syllables }) => {
   const result = analyzeContextualPronunciation({ text: "哪儿" }, [
    { id: "provided-suffix-spelling", text: "哪儿", pinyin, priority: 100 },
   ]);
   expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["na3", "er2"]);
   expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["na3", "er2"]);
   expect(result.glyphs.map((glyph) => glyph.spokenPinyin)).toEqual(syllables);
   expect(result.glyphs.every((glyph) => glyph.evidence.includes("dictionary-exact"))).toBe(true);
   expect(formatContextualSpokenPinyin(result)).toBe(display);
   expect(formatContextualReadingPinyin(result)).toBe(wordDisplay);
  },
 );

 it("keeps source and manual suffix readings ahead of provided rhotic spelling", () => {
  const dictionary = [{ id: "provided-rhotic", text: "哪儿", pinyin: "nǎr", priority: 100 }];
  const source = analyzeContextualPronunciation(
   { text: "哪儿", sourcePinyin: "nǎ ér" },
   dictionary,
  );
  const manual = analyzeContextualPronunciation(
   {
    text: "哪儿",
    sourcePinyin: "nǎr",
    overrides: [
     {
      id: "independent-er-override",
      text: "儿",
      readings: ["er2"],
      scope: "sentence-instance",
      sentenceText: "哪儿",
      start: 1,
      end: 2,
      updatedAt: "2026-10-23T00:00:00.000Z",
     },
    ],
   },
   dictionary,
  );
  expect(source.sourcePinyinStatus).toBe("aligned");
  expect(manual.sourcePinyinStatus).toBe("aligned");
  expect(source.glyphs[1]?.lexicalReadingKey).toBe("er2");
  expect(source.glyphs[1]?.spokenReadingKey).toBe("er2");
  expect(source.glyphs[1]?.spokenPinyin).toBe("ér");
  expect(source.glyphs[1]?.evidence).toEqual(["source-pinyin"]);
  expect(manual.glyphs[1]?.lexicalReadingKey).toBe("er2");
  expect(manual.glyphs[1]?.spokenReadingKey).toBe("er2");
  expect(manual.glyphs[1]?.spokenPinyin).toBe("ér");
  expect(manual.glyphs[1]?.evidence).toEqual(["manual-override"]);
  expect(formatContextualReadingPinyin(source)).toBe("nǎ'ér");
  expect(formatContextualReadingPinyin(manual)).toBe("nǎ'ér");
 });

 it("preserves supplied 儿子 and explicit source ér across the automatic suffix boundary", () => {
  const text = "这儿子弹很便宜";
  const dictionary = [
   { id: "provided-independent-child", text: "儿子", pinyin: "ér zi", priority: 100 },
  ];
  const supplied = analyzeContextualPronunciation({ text }, dictionary);
  const source = analyzeContextualPronunciation(
   { text, sourcePinyin: "zhè ér zǐ dàn hěn pián yi" },
   dictionary,
  );
  expect(supplied.glyphs[1]?.lexicalReadingKey).toBe("er2");
  expect(supplied.glyphs[1]?.spokenReadingKey).toBe("er2");
  expect(supplied.glyphs[1]?.spokenPinyin).toBe("ér");
  expect(supplied.glyphs[1]?.evidence).toEqual(["dictionary-exact"]);
  expect(supplied.glyphs[2]?.spokenReadingKey).toBe("zi5");
  expect(supplied.glyphs[2]?.evidence).toEqual(["dictionary-exact"]);
  expect(source.sourcePinyinStatus).toBe("aligned");
  expect(source.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "zhe4",
   "er2",
   "zi3",
   "dan4",
   "hen3",
   "pian2",
   "yi5",
  ]);
  expect(source.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual([
   "zhe4",
   "er2",
   "zi3",
   "dan4",
   "hen3",
   "pian2",
   "yi5",
  ]);
  expect(source.glyphs[1]?.spokenPinyin).toBe("ér");
  expect(source.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))).toBe(true);
 });

 it("rejects rhotic source spelling for the independent character 而", () => {
  const result = analyzeContextualPronunciation({ text: "而", sourcePinyin: "r" });
  expect(result.sourcePinyinStatus).toBe("rejected");
  expect(result.glyphs[0]?.lexicalReadingKey).toBe("er2");
  expect(result.glyphs[0]?.spokenReadingKey).toBe("er2");
  expect(result.glyphs[0]?.spokenPinyin).toBe("ér");
  expect(formatContextualReadingPinyin(result)).toBe("ér");
 });

 it("accepts exact source pinyin and reports rejected alignment", () => {
  const aligned = analyzeContextualPronunciation({ text: "中国", sourcePinyin: "Zhōng guó" });
  expect(aligned.sourcePinyinStatus).toBe("aligned");
  expect(aligned.glyphs.map((glyph) => glyph.evidence[0])).toEqual([
   "source-pinyin",
   "source-pinyin",
  ]);

  const rejected = analyzeContextualPronunciation({ text: "中国", sourcePinyin: "hǎo" });
  expect(rejected.sourcePinyinStatus).toBe("rejected");
  expect(rejected.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["zhong1", "guo2"]);
  expect(rejected.unresolved).toHaveLength(0);

  const concatenated = analyzeContextualPronunciation({
   text: "浙江省",
   sourcePinyin: "Zhèjiāng shěng",
  });
  expect(concatenated.sourcePinyinStatus).toBe("aligned");

  const erhua = analyzeContextualPronunciation({
   text: "哪儿，这儿。",
   sourcePinyin: "nǎ'er, zhèr.",
  });
  expect(erhua.sourcePinyinStatus).toBe("aligned");
  expect(erhua.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "na3",
   "er2",
   "zhe4",
   "er2",
  ]);
 });

 it("lets an explicit manual confirmation override the displayed pronunciation", () => {
  const result = analyzeContextualPronunciation({
   text: "行",
   overrides: [
    {
     id: "override-1",
     text: "行",
     readings: ["xing2"],
     scope: "character-global",
     sentenceText: null,
     start: null,
     end: null,
     updatedAt: "2026-08-14T00:00:00.000Z",
    },
   ],
  });
  expect(result.glyphs[0]?.lexicalReadingKey).toBe("xing2");
  expect(result.glyphs[0]?.spokenReadingKey).toBe("xing2");
  expect(result.glyphs[0]?.confidence).toBe(1);
  expect(result.glyphs[0]?.evidence).toEqual(["manual-override"]);
  expect(formatContextualSpokenPinyin(result)).toBe("xíng");
 });

 it("applies phrase overrides one Hanzi at a time", () => {
  const result = analyzeContextualPronunciation({
   text: "银行",
   overrides: [
    {
     id: "phrase-1",
     text: "银行",
     readings: ["yin2", "yin2"],
     scope: "phrase",
     sentenceText: null,
     start: null,
     end: null,
     updatedAt: "2026-08-14T00:00:00.000Z",
    },
   ],
  });
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["yin2", "yin2"]);
  expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["yin2", "yin2"]);
  expect(result.glyphs.every((glyph) => glyph.evidence[0] === "manual-override")).toBe(true);
 });

 it("does not present unresolved polyphonic output as certain", () => {
  const result = analyzeContextualPronunciation({ text: "行" });
  expect(result.glyphs[0]?.isPolyphonic).toBe(true);
  expect(result.glyphs[0]?.confidence).toBe(0.55);
 });

 it("uses an aligned lesson-vocabulary phrase before the contextual fallback", () => {
  const result = analyzeContextualPronunciation({ text: "银行行长。", sourcePinyin: null }, [
   { id: "bank", text: "银行", pinyin: "yín háng", priority: 2 },
   { id: "manager", text: "行长", pinyin: "háng zhǎng", priority: 1 },
  ]);
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "yin2",
   "hang2",
   "hang2",
   "zhang3",
  ]);
  expect(result.glyphs.slice(2, 4).map((glyph) => glyph.evidence)).toEqual([
   ["dictionary-exact"],
   ["dictionary-exact"],
  ]);

  const sourceWins = analyzeContextualPronunciation({ text: "行长", sourcePinyin: "xíng cháng" }, [
   { id: "manager", text: "行长", pinyin: "háng zhǎng", priority: 1 },
  ]);
  expect(sourceWins.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["xing2", "chang2"]);
  expect(sourceWins.glyphs.map((glyph) => glyph.evidence)).toEqual([
   ["source-pinyin"],
   ["source-pinyin"],
  ]);
 });

 it("preserves the curated polyphonic and tone-sandhi corpus readings", () => {
  const result = analyzeContextualPronunciation({
   text: "银行行长还没有还钱。",
   sourcePinyin: "yín háng háng zhǎng hái méi yǒu huán qián。",
  });
  expect(result.sourcePinyinStatus).toBe("aligned");
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "yin2",
   "hang2",
   "hang2",
   "zhang3",
   "hai2",
   "mei2",
   "you3",
   "huan2",
   "qian2",
  ]);
  expect(result.glyphs[1]?.alternatives).toContain("xing2");

  const classifier = analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" });
  expect(classifier.glyphs[0]?.lexicalReadingKey).toBe("yi1");
  expect(classifier.glyphs[0]?.spokenReadingKey).toBe("yi1");

  const autoDetected = analyzeContextualPronunciation({ text: "一个" });
  expect(autoDetected.glyphs[0]?.spokenReadingKey).toBe("yi2");
 });

 it("resolves 还款 phrases to huán even without source pinyin", () => {
  const sentence = analyzeContextualPronunciation({
   text: "谢谢。我想再了解一下还款方式。",
  });
  const huanGlyph = sentence.glyphs.find((glyph) => glyph.text === "还");
  const kuanGlyph = sentence.glyphs.find((glyph) => glyph.text === "款");
  expect(huanGlyph?.spokenPinyin).toBe("huán");
  expect(huanGlyph?.lexicalReadingKey).toBe("huan2");
  expect(kuanGlyph?.spokenPinyin).toBe("kuǎn");
 });

 it("distinguishes 还 (hái) vs 还 (huán) in complex sentences", () => {
  const sentence = analyzeContextualPronunciation({
   text: "银行职员还介绍了两种还款方式。",
  });
  const huanGlyphs = sentence.glyphs.filter((glyph) => glyph.text === "还");
  expect(huanGlyphs).toHaveLength(2);
  expect(huanGlyphs[0]?.spokenPinyin).toBe("hái");
  expect(huanGlyphs[1]?.spokenPinyin).toBe("huán");
 });

 it("formats contextual spoken pinyin without losing punctuation", () => {
  const analysis = analyzeContextualPronunciation({ text: "一个人。" });
  expect(formatContextualSpokenPinyin(analysis)).toBe("yí gè rén。");
 });

 it.each([
  ["他不太伤心。", ["他", "不", "太", "伤心", "。"], "tā bú tài shāngxīn。"],
  ["我不知道怎么回答。", ["我", "不", "知道", "怎么", "回答", "。"], "wǒ bù zhīdào zěnme huídá。"],
  ["一个人。", ["一", "个", "人", "。"], "yí gè rén。"],
  ["我得去上课。", ["我", "得", "去", "上课", "。"], "wǒ děi qù shàngkè。"],
  ["听得入迷", ["听", "得", "入迷"], "tīng de rùmí"],
  ["很好的朋友", ["很", "好", "的", "朋友"], "hěn hǎo de péngyou"],
  ["我明白", ["我", "明白"], "wǒ míngbai"],
 ])("groups reviewed reading units for %s", (text, units, pinyin) => {
  const analysis = analyzeContextualPronunciation({ text });
  expect(getContextualReadingUnits(analysis).map((unit) => unit.text)).toEqual(units);
  expect(formatContextualReadingPinyin(analysis)).toBe(pinyin);
 });

 it("keeps textbook compound words together when ICU splits their characters", () => {
  const analysis = analyzeContextualPronunciation({ text: "下班骑自行车回家，冰激凌" });
  const units = getContextualReadingUnits(analysis);
  const bicycle = units.find((unit) => unit.text === "自行车");
  const iceCream = units.find((unit) => unit.text === "冰激凌");

  expect(units.map((unit) => unit.text)).toEqual(["下班", "骑", "自行车", "回家", "，", "冰激凌"]);
  if (bicycle === undefined || iceCream === undefined) {
   throw new Error("Expected both textbook compound words to have reading units.");
  }
  expect(formatContextualReadingUnitPinyin(analysis, bicycle)).toBe("zìxíngchē");
  expect(formatContextualReadingUnitPinyin(analysis, iceCream)).not.toBeNull();
 });

 it("keeps source-selected readings while grouping auto pinyin", () => {
  const analysis = analyzeContextualPronunciation({
   text: "他不太伤心。",
   sourcePinyin: "tā bù tài shāng xīn。",
  });
  expect(analysis.sourcePinyinStatus).toBe("aligned");
  expect(formatContextualReadingPinyin(analysis)).toBe("tā bù tài shāngxīn。");
 });

 it("keeps pinyin separators in the annotation layer", () => {
  const analysis = analyzeContextualPronunciation({ text: "西安女儿。" });
  expect(getContextualReadingUnits(analysis).map((unit) => unit.text)).toEqual([
   "西安",
   "女儿",
   "。",
  ]);
  expect(formatContextualReadingPinyin(analysis)).toBe("xī'ān nǚ'ér。");
  expect(analysis.normalizedText).toBe("西安女儿。");
 });

 it("preserves non-Hanzi source text while grouping Hanzi units", () => {
  const analysis = analyzeContextualPronunciation({ text: "HSK 4，2026年。" });
  expect(formatContextualReadingPinyin(analysis)).toBe("HSK 4，2026nián。");
 });

 it("keeps pronunciation review tokens independent from reading units", () => {
  const analysis = analyzeContextualPronunciation({ text: "我得去上课。" });
  expect(analysis.tokens.map((token) => token.text)).toEqual(["我得去", "上", "课", "。"]);
  expect(getContextualReadingUnits(analysis).map((unit) => unit.text)).toEqual([
   "我",
   "得",
   "去",
   "上课",
   "。",
  ]);
 });

 it("formats the selected pinyin range for the Reader selection toolbar", () => {
  const analysis = analyzeContextualPronunciation({
   text: "浙江省绍",
   sourcePinyin: "Zhèjiāng shěng shào",
  });
  expect(formatContextualPinyinRange(analysis, 0, 4)).toBe("zhè jiāng shěng shào");
 });
});
