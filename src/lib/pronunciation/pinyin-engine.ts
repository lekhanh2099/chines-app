import { customPinyin, pinyin, polyphonic } from "pinyin-pro";

/**
 * Curated high-accuracy polyphone phrase dictionary for Mandarin Chinese.
 * Overrides default pinyin-pro lookups for high-frequency HSK 1-6 terms
 * where polyphonic characters (多音字) frequently misfire.
 */
export const POLYPHONIC_DICTIONARY: Readonly<Record<string, string>> = {
 // ── 得 (de / děi / dé) ──
 看得懂: "kàn de dǒng",
 看不懂: "kàn bu dǒng",
 看得见: "kàn de jiàn",
 看不见: "kàn bu jiàn",
 做得到: "zuò de dào",
 做不到: "zuò bu dào",
 听得懂: "tīng de dǒng",
 听不懂: "tīng bu dǒng",
 听得见: "tīng de jiàn",
 听不见: "tīng bu jiàn",
 买得到: "mǎi de dào",
 买不到: "mǎi bu dào",
 想得到: "xiǎng de dào",
 想不到: "xiǎng bu dào",
 找得到: "zhǎo de dào",
 找不到: "zhǎo bu dào",
 吃得到: "chī de dào",
 吃不到: "chī bu dào",
 拿得到: "ná de dào",
 拿不到: "ná bu dào",
 记得: "jì de",
 觉得: "jué de",
 懂得: "dǒng de",
 舍得: "shě de",
 免得: "miǎn de",
 省得: "shěng de",
 来得及: "lái de jí",
 来不及: "lái bu jí",
 跑得快: "pǎo de kuài",
 跑得慢: "pǎo de màn",
 走得快: "zǒu de kuài",
 走得慢: "zǒu de màn",
 长得帅: "zhǎng de shuài",
 长得漂亮: "zhǎng de piào liang",
 过得好: "guò de hǎo",
 过得不好: "guò de bù hǎo",
 我得去: "wǒ děi qù",
 你得去: "nǐ děi qù",
 他得去: "tā děi qù",
 得去: "děi qù",
 得走: "děi zǒu",
 得做: "děi zuò",
 得买: "děi mǎi",
 得花: "děi huā",
 得写: "děi xiě",
 得看: "děi kàn",
 得听: "děi tīng",
 得说: "děi shuō",
 得学: "děi xué",
 得等: "děi děng",
 得换: "děi huàn",
 得交: "děi jiāo",
 得拿: "děi ná",
 得带: "děi dài",
 得用: "děi yòng",
 得办: "děi bàn",
 得回: "děi huí",
 得穿: "děi chuān",
 得找: "děi zhǎo",
 得借: "děi jiè",
 还得: "hái děi",
 总得: "zǒng děi",
 就得: "jiù děi",
 可得: "kě děi",
 得到: "dé dào",
 得奖: "dé jiǎng",
 得病: "dé bìng",
 得分: "dé fēn",
 获得: "huò dé",
 取得: "qǔ dé",
 值得: "zhí dé",
 难得: "nán dé",
 心得: "xīn dé",

 // ── 地 (de / dì) ──
 慢慢地: "màn màn de",
 快快地: "kuài kuài de",
 高兴地: "gāo xìng de",
 认真地: "rèn zhēn de",
 偷偷地: "tōu tōu de",
 大声地: "dà shēng de",
 悄悄地: "qiāo qiāo de",
 努力地: "nǔ lì de",
 清楚地: "qīng chǔ de",
 飞快地: "fēi kuài de",
 满意地: "mǎn yì de",
 仔细地: "zǐ xì de",
 耐心地: "nài xīn de",
 热情地: "rè qíng de",
 主动地: "zhǔ dòng de",
 渐渐地: "jiàn jiàn de",
 默默地: "mò mò de",
 平静地: "píng jìng de",
 伤心地: "shāng xīn de",
 激动地: "jī dòng de",
 目的地: "mù dì dì",
 地方: "dì fang",
 地区: "dì qū",
 地图: "dì tú",
 地下: "dì xià",
 地球: "dì qiú",
 土地: "tǔ dì",
 地址: "dì zhǐ",
 地道: "dì dao",

 // ── 着 (zhe / zháo / zhuó) ──
 睡着: "shuì zháo",
 睡着了: "shuì zháo le",
 睡不着: "shuì bu zháo",
 睡得着: "shuì de zháo",
 着火: "zháo huǒ",
 着急: "zháo jí",
 着凉: "zháo liáng",
 着迷: "zháo mí",
 着慌: "zháo huāng",
 看着: "kàn zhe",
 听着: "tīng zhe",
 说着: "shuō zhe",
 走着: "zǒu zhe",
 坐着: "zuò zhe",
 站着: "zhàn zhe",
 躺着: "tǎng zhe",
 穿着: "chuān zhe",
 戴着: "dài zhe",
 拿着: "ná zhe",
 带着: "dài zhe",
 跟着: "gēn zhe",
 开着: "kāi zhe",
 关着: "guān zhe",
 等着: "děng zhe",
 着重: "zhuó zhòng",
 着手: "zhuó shǒu",
 着想: "zhuó xiǎng",
 着眼: "zhuó yǎn",
 执着: "zhí zhuó",
 沉着: "chén zhuó",

 // ── 还 (hái / huán) ──
 还款: "huán kuǎn",
 还款方式: "huán kuǎn fāng shì",
 还款金额: "huán kuǎn jīn é",
 还贷: "huán dài",
 还本: "huán běn",
 还本付息: "huán běn fù xī",
 还利息: "huán lì xī",
 还给: "huán gěi",
 还钱: "huán qián",
 还清: "huán qīng",
 还债: "huán zhài",
 还书: "huán shū",
 还手: "huán shǒu",
 还击: "huán jī",
 还口: "huán kǒu",
 还价: "huán jià",
 还礼: "huán lǐ",
 还愿: "huán yuàn",
 还原: "huán yuán",
 还乡: "huán xiāng",
 还俗: "huán sú",
 归还: "guī huán",
 偿还: "cháng huán",
 退还: "tuì huán",
 交还: "jiāo huán",
 送还: "sòng huán",
 返还: "fǎn huán",
 索还: "suǒ huán",
 生还: "shēng huán",
 奉还: "fèng huán",
 提前还贷: "tí qián huán dài",
 还本金: "huán běn jīn",
 按期还款: "àn qī huán kuǎn",
 逾期还款: "yú qī huán kuǎn",
 分期还款: "fēn qī huán kuǎn",
 无力还款: "wú lì huán kuǎn",
 后还款: "hòu huán kuǎn",
 还有: "hái yǒu",
 还是: "hái shì",
 还要: "hái yào",
 还可以: "hái kě yǐ",
 还好: "hái hǎo",
 还算: "hái suàn",

 // ── 倒 (dào / dǎo) ──
 倒车: "dào chē",
 倒水: "dào shuǐ",
 倒茶: "dào chá",
 倒酒: "dào jiǔ",
 倒垃圾: "dào lā jī",
 倒流: "dào liú",
 倒退: "dào tuì",
 倒立: "dào lì",
 倒数: "dào shǔ",
 反倒: "fǎn dào",
 摔倒: "shuāi dǎo",
 倒下: "dǎo xià",
 倒塌: "dǎo tā",
 推倒: "tuī dǎo",
 倒闭: "dǎo bì",
 倒霉: "dǎo méi",

 // ── 数 (shǔ / shù) ──
 数一数: "shǔ yi shǔ",
 数数: "shǔ shù",
 数不清: "shǔ bu qīng",
 数得着: "shǔ de zháo",
 数学: "shù xué",
 数字: "shù zì",
 数量: "shù liàng",
 数据: "shù jù",
 多数: "duō shù",
 少数: "shǎo shù",
 无数: "wú shù",

 // ── 发 (fā / fà) ──
 头发: "tóu fa",
 理发: "lǐ fà",
 理发店: "lǐ fà diàn",
 假发: "jiǎ fà",
 白发: "bái fà",
 短发: "duǎn fà",
 长发: "cháng fà",
 发生: "fā shēng",
 发现: "fā xiàn",
 发明: "fā míng",
 出发: "chū fā",
 发表: "fā biǎo",
 发挥: "fā huī",

 // ── 教 (jiāo / jiào) ──
 教书: "jiāo shū",
 教课: "jiāo kè",
 教学生: "jiāo xué sheng",
 教英语: "jiāo yīng yǔ",
 教中文: "jiāo zhōng wén",
 教室: "jiào shì",
 教育: "jiào yù",
 教师: "jiào shī",
 教授: "jiào shòu",
 教学: "jiào xué",
 家教: "jiā jiào",

 // ── 空 (kōng / kòng) ──
 有空: "yǒu kòng",
 没空: "méi kòng",
 抽空: "chōu kòng",
 空闲: "kòng xián",
 空白: "kòng bái",
 空隙: "kòng xì",
 空气: "kōng qì",
 空间: "kōng jiān",
 天空: "tiān kōng",
 航空: "háng kōng",
 空调: "kōng tiáo",

 // ── 便 (biàn / pián) ──
 便宜: "pián yi",
 方便: "fāng biàn",
 便利: "biàn lì",
 便饭: "biàn fàn",
 便条: "biàn tiáo",

 // ── 难 (nán / nàn) ──
 难过: "nán guò",
 难受: "nán shòu",
 困难: "kùn nan",
 很难: "hěn nán",
 难看: "nán kàn",
 难听: "nán tīng",
 难懂: "nán dǒng",
 灾难: "zāi nàn",
 难民: "nàn mín",
 遇难: "yù nàn",
 苦难: "kǔ nàn",

 // ── 重 (chóng / zhòng) ──
 重新: "chóng xīn",
 重复: "chóng fù",
 重写: "chóng xiě",
 重逢: "chóng féng",
 重庆: "chóng qìng",
 重要: "zhòng yào",
 重量: "zhòng liàng",
 重点: "zhòng diǎn",
 重大: "zhòng dà",
 尊重: "zūn zhòng",
 严重: "yán zhòng",

 // ── 差 (chā / chà / chāi) ──
 出差: "chū chāi",
 差使: "chāi shi",
 差不多: "chà bu duō",
 差一点: "chà yì diǎn",
 成绩差: "chéng jì chà",
 差劲: "chà jìn",
 差别: "chā bié",
 差距: "chā jù",
 差额: "chā é",

 // ── 行 (háng / xíng) ──
 银行: "yín háng",
 行长: "háng zhǎng",
 银行行长: "yín háng háng zhǎng",
 行业: "háng yè",
 同行: "tóng háng",
 行家: "háng jia",
 行情: "háng qíng",
 行人: "xíng rén",
 行动: "xíng dòng",
 行走: "xíng zǒu",
 自行车: "zì xíng chē",
 流行: "liú xíng",
 旅行: "lǚ xíng",
 行不行: "xíng bu xíng",

 // ── 长 (zhǎng / cháng) ──
 长大: "zhǎng dà",
 成长: "chéng zhǎng",
 生长: "shēng zhǎng",
 校长: "xiào zhǎng",
 家长: "jiā zhǎng",
 长辈: "zhǎng bèi",
 长江: "cháng jiāng",
 长城: "cháng chéng",
 很长: "hěn cháng",
 长期: "cháng qī",
 长短: "cháng duǎn",

 // ── 好 (hǎo / hào) ──
 爱好: "ài hào",
 好奇: "hào qí",
 好客: "hào kè",
 好学: "hào xué",
 好人: "hǎo rén",
 很好: "hěn hǎo",
 好看: "hǎo kàn",
 好吃: "hǎo chī",

 // ── 少 (shǎo / shào) ──
 多少: "duō shao",
 很少: "hěn shǎo",
 少年: "shào nián",
 少女: "shào nǚ",
 少爷: "shào ye",

 // ── 量 (liáng / liàng) ──
 商量: "shāng liang",
 打量: "dǎ liang",
 力量: "lì liang",
 质量: "zhì liàng",
 测量: "cè liáng",

 // ── 和 (hé / huo / hú) ──
 暖和: "nuǎn huo",
 和平: "hé píng",
 和气: "hé qi",
 和睦: "hé mù",
 和牌: "hú pái",
};

let isEngineInitialized = false;

/**
 * Idempotent initialization of custom pinyin dictionary in pinyin-pro.
 * Guaranteed O(1) invocation cost after first load.
 */
export function ensurePinyinEngineInitialized(): void {
 if (isEngineInitialized) return;
 customPinyin(POLYPHONIC_DICTIONARY);
 isEngineInitialized = true;
}

// Ensure dictionary is registered on module import
ensurePinyinEngineInitialized();

/* ── Grammatical Context Sets for O(1) Fast Lookups ── */

const VERBS_BEFORE_DE = new Set([
 "跑",
 "走",
 "吃",
 "做",
 "学",
 "写",
 "玩",
 "听",
 "看",
 "说",
 "唱",
 "跳",
 "住",
 "过",
 "长",
 "觉",
 "记",
 "变",
 "干",
 "弄",
 "打",
 "算",
 "讲",
 "修",
 "飞",
 "笑",
 "哭",
 "生",
]);

const DEGREE_OR_ADJ_AFTER_DE = new Set([
 "很",
 "非",
 "真",
 "太",
 "好",
 "快",
 "慢",
 "多",
 "少",
 "高",
 "低",
 "大",
 "小",
 "帅",
 "漂",
 "美",
 "累",
 "差",
 "清",
 "不",
 "早",
 "晚",
 "远",
 "近",
 "深",
 "浅",
]);

const PRONOUNS_BEFORE_DEI = new Set([
 "我",
 "你",
 "他",
 "她",
 "它",
 "咱",
 "谁",
 "大",
 "总",
 "就",
 "还",
 "可",
]);

const VERBS_AFTER_DEI = new Set([
 "去",
 "走",
 "做",
 "买",
 "学",
 "换",
 "回",
 "交",
 "带",
 "拿",
 "办",
 "看",
 "听",
 "等",
 "写",
 "花",
 "用",
 "吃",
 "喝",
 "穿",
 "找",
 "借",
 "还",
 "想",
 "问",
]);

const NOUN_SUFFIXES_AFTER_DI = new Set([
 "上",
 "下",
 "中",
 "方",
 "球",
 "图",
 "理",
 "震",
 "面",
 "址",
 "毯",
 "形",
 "区",
 "带",
 "位",
 "狱",
 "牢",
 "主",
 "铁",
 "盘",
 "点",
 "段",
]);

const NOUN_PREFIXES_BEFORE_DI = new Set([
 "目",
 "落",
 "领",
 "陆",
 "湿",
 "草",
 "荒",
 "盆",
 "旱",
 "驻",
 "耕",
 "产",
 "基",
 "内",
 "当",
 "原",
 "工",
 "空",
 "在",
 "随",
]);

/**
 * Apply grammatical contextual rules across syllables in single-pass O(N).
 * Handles structural particle "得" (de vs děi), "地" (de vs dì), and "倒" (dào vs dǎo).
 */
export function applyGrammarHeuristics(
 chineseChars: readonly string[],
 syllables: string[],
): string[] {
 const len = Math.min(chineseChars.length, syllables.length);

 for (let i = 0; i < len; i++) {
  const char = chineseChars[i];
  if (!char) continue;

  if (char === "得") {
   const prev = chineseChars[i - 1];
   const next = chineseChars[i + 1];

   // Modal verb "děi" (have to / must): 我得去, 总得走, 谁得负责
   if ((!prev || PRONOUNS_BEFORE_DEI.has(prev)) && next && VERBS_AFTER_DEI.has(next)) {
    syllables[i] = "děi";
   }
   // Complement particle "de" (degree / capability): 跑得很快, 做得很好
   else if (prev && VERBS_BEFORE_DE.has(prev) && next && DEGREE_OR_ADJ_AFTER_DE.has(next)) {
    syllables[i] = "de";
   }
  } else if (char === "地") {
   const prev = chineseChars[i - 1];
   const prevPrev = chineseChars[i - 2];
   const next = chineseChars[i + 1];

   // 目的地 -> mù dì dì
   if (prevPrev === "目" && prev === "的") {
    syllables[i] = "dì";
    continue;
   }
   if (next && NOUN_SUFFIXES_AFTER_DI.has(next)) {
    syllables[i] = "dì";
    continue;
   }
   if (prev && NOUN_PREFIXES_BEFORE_DI.has(prev)) {
    syllables[i] = "dì";
    continue;
   }

   // Structural adverbial particle "de" (e.g., 慢慢地走, 高兴地唱)
   syllables[i] = "de";
  } else if (char === "倒") {
   const next = chineseChars[i + 1];
   const nextNext = chineseChars[i + 2];
   // "dào" for pouring or reversing (倒车, 倒一杯水, 倒茶)
   if (
    next === "车" ||
    next === "水" ||
    next === "茶" ||
    next === "酒" ||
    next === "退" ||
    next === "流" ||
    next === "一" ||
    (next === "杯" && nextNext)
   ) {
    syllables[i] = "dào";
   }
  }
 }

 return syllables;
}

/* ── Polyphone Cache & Lookup ── */

const polyphoneCache = new Map<string, string[]>();

/**
 * Get all valid readings (pronunciations) for a single Chinese character.
 * Cached in-memory to prevent repeated library calls.
 */
export function getPolyphonicAlternatives(char: string): string[] {
 if (!char || char.length !== 1) return [];

 const cached = polyphoneCache.get(char);
 if (cached !== undefined) return cached;

 try {
  const result = polyphonic(char, { type: "array" });
  if (Array.isArray(result) && result[0] && Array.isArray(result[0])) {
   const readings = [...new Set(result[0])];
   polyphoneCache.set(char, readings);
   return readings;
  }
 } catch {
  // Graceful fallback for non-Chinese characters
 }

 polyphoneCache.set(char, []);
 return [];
}

/**
 * Returns true if a Chinese character has 2 or more distinct pronunciations.
 */
export function isPolyphonicCharacter(char: string): boolean {
 return getPolyphonicAlternatives(char).length > 1;
}

export type SmartPinyinResult = {
 /** Space-separated pinyin string */
 pinyin: string;
 /** Syllable per character, strictly 1-to-1 aligned */
 syllables: string[];
 /** 0-based indices of characters that are polyphonic (warning indicator) */
 polyphonicIndices: number[];
};

const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/u;

/**
 * Generate smart pinyin for a pure or mixed Chinese string.
 * Ensures strict 1-to-1 alignment with characters and applies grammar heuristics.
 */
export function generateSmartPinyin(chinese: string): SmartPinyinResult {
 ensurePinyinEngineInitialized();

 const chars = Array.from(chinese);
 if (chars.length === 0) {
  return { pinyin: "", syllables: [], polyphonicIndices: [] };
 }

 // Run pinyin-pro with custom dictionary and symbol tone marks
 const rawPinyin = pinyin(chinese, {
  type: "array",
  toneType: "symbol",
  v: true,
 });

 const syllables: string[] = Array.isArray(rawPinyin) ? [...rawPinyin] : [];

 // Align lengths in case of mismatch
 while (syllables.length < chars.length) {
  const idx = syllables.length;
  const char = chars[idx];
  syllables.push(
   char && CHINESE_CHAR_REGEX.test(char) ? pinyin(char, { toneType: "symbol" }) : char || "",
  );
 }
 if (syllables.length > chars.length) {
  syllables.length = chars.length;
 }

 // Apply contextual grammar heuristics
 applyGrammarHeuristics(chars, syllables);

 // Detect polyphonic characters for warning flags
 const polyphonicIndices: number[] = [];
 for (let i = 0; i < chars.length; i++) {
  const char = chars[i];
  if (char && CHINESE_CHAR_REGEX.test(char) && isPolyphonicCharacter(char)) {
   polyphonicIndices.push(i);
  }
 }

 return {
  pinyin: syllables.join(" "),
  syllables,
  polyphonicIndices,
 };
}
