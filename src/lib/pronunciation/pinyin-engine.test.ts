import { describe, expect, it } from "vitest";

import {
 generateSmartPinyin,
 getPolyphonicAlternatives,
 isPolyphonicCharacter,
} from "./pinyin-engine";

describe("pinyin-engine", () => {
 it.each([
  ["一掠而过", "yí lüè ér guò"],
  ["虐待", "nüè dài"],
 ])("displays ü in symbol pinyin for %s", (text, expected) => {
  const result = generateSmartPinyin(text);
  expect(result.pinyin).toBe(expected);
  expect(result.syllables.join(" ")).toBe(expected);
 });

 it("keeps a literal Latin r separate from the preceding Hanzi syllable", () => {
  const result = generateSmartPinyin("字r");
  expect(result.pinyin).toBe("zì r");
  expect(result.syllables).toEqual(["zì", "r"]);
 });

 describe("Polyphonic and Grammar accuracy", () => {
  it.each([
   ["无可奈何地说", "地", "de"],
   ["亮得耀眼", "得", "de"],
   ["都得挨训", "得", "děi"],
   ['陈静"哎"了一声', "了", "le"],
   ["办得了", "了", "liǎo"],
   ["瞪着眼", "着", "zhe"],
   ["找不着路", "着", "zháo"],
   ["着眼于未来", "着", "zhuó"],
   ["燃烧着我", "着", "zhe"],
   ["她的穿着很好", "着", "zhuó"],
  ])("shares contextual particle rules for %s", (text, char, reading) => {
   const result = generateSmartPinyin(text);
   expect(result.syllables[Array.from(text).indexOf(char)]).toBe(reading);
  });

  it("resolves complement particle 得 (de) vs modal verb (děi) vs acquire (dé)", () => {
   expect(generateSmartPinyin("你看得懂吗").pinyin).toBe("nǐ kàn de dǒng ma");
   expect(generateSmartPinyin("跑得很快").pinyin).toBe("pǎo de hěn kuài");
   expect(generateSmartPinyin("做得很棒").pinyin).toBe("zuò de hěn bàng");
   expect(generateSmartPinyin("走得慢").pinyin).toBe("zǒu de màn");
   expect(generateSmartPinyin("长得帅").pinyin).toBe("zhǎng de shuài");

   expect(generateSmartPinyin("我得去学校").pinyin).toBe("wǒ děi qù xué xiào");
   expect(generateSmartPinyin("你得走").pinyin).toBe("nǐ děi zǒu");
   expect(generateSmartPinyin("总得做").pinyin).toBe("zǒng děi zuò");

   expect(generateSmartPinyin("得到好成绩").pinyin).toBe("dé dào hǎo chéng jì");
  });

  it("resolves structural particle 地 (de) vs place/target (dì)", () => {
   expect(generateSmartPinyin("慢慢地走").pinyin).toBe("màn màn de zǒu");
   expect(generateSmartPinyin("高兴地唱").pinyin).toBe("gāo xìng de chàng");
   expect(generateSmartPinyin("认真地学").pinyin).toBe("rèn zhēn de xué");
   expect(generateSmartPinyin("含笑地看着你").pinyin).toBe("hán xiào de kàn zhe nǐ");
   expect(generateSmartPinyin("含笑的地方").pinyin).toBe("hán xiào de dì fang");
   expect(generateSmartPinyin("目的地").pinyin).toBe("mù dì dì");
   expect(generateSmartPinyin("地方").pinyin).toBe("dì fang");
  });

  it.each([
   "静静地走过",
   "怯怯地问",
   "工工整整地写",
   "蹦蹦跳跳地走",
   "一笔一笔地算",
   "缓缓地下去",
   "高高兴兴地上台",
   "好好地工作",
   "一步一步地上台",
  ])("infers adverbial 地 without an exact phrase entry: %s", (text) => {
   const result = generateSmartPinyin(text);
   expect(result.syllables[Array.from(text).indexOf("地")]).toBe("de");
  });

  it.each([
   "地",
   "天地",
   "大地",
   "我的地很大",
   "一块块地用了",
   "看看地上",
   "瞧瞧地下室",
   "挖挖地看看",
   "打扫打扫地下室",
   "收拾收拾地下室",
   "整理整理地上的灰",
  ])("does not force an unrecognized noun 地 to de: %s", (text) => {
   const result = generateSmartPinyin(text);
   expect(result.syllables[Array.from(text).indexOf("地")]).toBe("dì");
  });

  it("resolves 着 (zhe vs zháo vs zhuó)", () => {
   expect(generateSmartPinyin("睡不着").pinyin).toBe("shuì bu zháo");
   expect(generateSmartPinyin("睡着了").pinyin).toBe("shuì zháo le");
   expect(generateSmartPinyin("着火了").pinyin).toBe("zháo huǒ le");
   expect(generateSmartPinyin("看着我").pinyin).toBe("kàn zhe wǒ");
   expect(generateSmartPinyin("穿着新衣服").pinyin).toBe("chuān zhe xīn yī fu");
   expect(generateSmartPinyin("着重强调").pinyin).toBe("zhuó zhòng qiáng diào");
  });

  it("resolves 还 (huán vs hái)", () => {
   expect(generateSmartPinyin("还给你").pinyin).toBe("huán gěi nǐ");
   expect(generateSmartPinyin("还钱").pinyin).toBe("huán qián");
   expect(generateSmartPinyin("还款方式").pinyin).toBe("huán kuǎn fāng shì");
   expect(generateSmartPinyin("提前还贷").pinyin).toBe("tí qián huán dài");
   expect(generateSmartPinyin("还本付息").pinyin).toBe("huán běn fù xī");
   expect(generateSmartPinyin("还有很多").pinyin).toBe("hái yǒu hěn duō");
  });

  it("resolves 倒 (dào vs dǎo)", () => {
   expect(generateSmartPinyin("倒车请注意").pinyin).toBe("dào chē qǐng zhù yì");
   expect(generateSmartPinyin("倒一杯茶").pinyin).toBe("dào yì bēi chá");
   expect(generateSmartPinyin("摔倒在地上").pinyin).toBe("shuāi dǎo zài dì shàng");
  });

  it("resolves other common polyphones: 数, 教, 发, 空, 行", () => {
   expect(generateSmartPinyin("数一数").pinyin).toBe("shǔ yi shǔ");
   expect(generateSmartPinyin("数学课").pinyin).toBe("shù xué kè");

   expect(generateSmartPinyin("在教室教书").pinyin).toBe("zài jiào shì jiāo shū");

   expect(generateSmartPinyin("去理发店剪头发").pinyin).toBe("qù lǐ fà diàn jiǎn tóu fa");
   expect(generateSmartPinyin("发生事情").pinyin).toBe("fā shēng shì qíng");

   expect(generateSmartPinyin("你有空吗").pinyin).toBe("nǐ yǒu kòng ma");
   expect(generateSmartPinyin("新鲜空气").pinyin).toBe("xīn xiān kōng qì");

   expect(generateSmartPinyin("中国工商银行").pinyin).toBe("zhōng guó gōng shāng yín háng");
   expect(generateSmartPinyin("骑自行车").pinyin).toBe("qí zì xíng chē");
  });

  it("resolves high-frequency HSK polyphones: 乐, 调, 中, 相, 背, 传, 弹, 应, 折", () => {
   expect(generateSmartPinyin("听音乐").pinyin).toBe("tīng yīn yuè");
   expect(generateSmartPinyin("一支乐队").pinyin).toBe("yì zhī yuè duì");
   expect(generateSmartPinyin("祝你快乐").pinyin).toBe("zhù nǐ kuài lè");

   expect(generateSmartPinyin("市场调查").pinyin).toBe("shì chǎng diào chá");
   expect(generateSmartPinyin("调整计划").pinyin).toBe("tiáo zhěng jì huà");
   expect(generateSmartPinyin("打开空调").pinyin).toBe("dǎ kāi kōng tiáo");

   expect(generateSmartPinyin("买彩票中奖").pinyin).toBe("mǎi cǎi piào zhòng jiǎng");
   expect(generateSmartPinyin("食物中毒").pinyin).toBe("shí wù zhòng dú");
   expect(generateSmartPinyin("来到中国").pinyin).toBe("lái dào zhōng guó");

   expect(generateSmartPinyin("照相馆").pinyin).toBe("zhào xiàng guǎn");
   expect(generateSmartPinyin("互相帮助").pinyin).toBe("hù xiāng bāng zhù");

   expect(generateSmartPinyin("背着背包").pinyin).toBe("bēi zhe bēi bāo");
   expect(generateSmartPinyin("背景音乐").pinyin).toBe("bèi jǐng yīn yuè");

   expect(generateSmartPinyin("名人自传").pinyin).toBe("míng rén zì zhuàn");
   expect(generateSmartPinyin("传统文化").pinyin).toBe("chuán tǒng wén huà");

   expect(generateSmartPinyin("弹吉他").pinyin).toBe("tán jí tā");
   expect(generateSmartPinyin("子弹飞").pinyin).toBe("zǐ dàn fēi");

   expect(generateSmartPinyin("应该做").pinyin).toBe("yīng gāi zuò");
   expect(generateSmartPinyin("适应环境").pinyin).toBe("shì yìng huán jìng");

   expect(generateSmartPinyin("商场打折").pinyin).toBe("shāng chǎng dǎ zhé");
   expect(generateSmartPinyin("打八折").pinyin).toBe("dǎ bā zhé");
  });

  it("resolves dynamic contextual grammar rules: 只, 为, 长, 还", () => {
   expect(generateSmartPinyin("一只猫").pinyin).toBe("yì zhī māo");
   expect(generateSmartPinyin("两只鸟").pinyin).toBe("liǎng zhī niǎo");
   expect(generateSmartPinyin("只要你来").pinyin).toBe("zhǐ yào nǐ lái");
   expect(generateSmartPinyin("只能这样").pinyin).toBe("zhǐ néng zhè yàng");

   expect(generateSmartPinyin("为了大家").pinyin).toBe("wèi le dà jiā");
   expect(generateSmartPinyin("为你服务").pinyin).toBe("wèi nǐ fú wù");
   expect(generateSmartPinyin("成为朋友").pinyin).toBe("chéng wéi péng you");
   expect(generateSmartPinyin("我认为对").pinyin).toBe("wǒ rèn wéi duì");

   expect(generateSmartPinyin("腿很长").pinyin).toBe("tuǐ hěn cháng");
   expect(generateSmartPinyin("李校长").pinyin).toBe("lǐ xiào zhǎng");

   expect(generateSmartPinyin("还我钱").pinyin).toBe("huán wǒ qián");
   expect(generateSmartPinyin("有借有还").pinyin).toBe("yǒu jiè yǒu huán");
   expect(generateSmartPinyin("他还活着").pinyin).toBe("tā hái huó zhe");
  });

  it("resolves high-frequency neutral tone words (轻声)", () => {
   expect(generateSmartPinyin("你的名字").pinyin).toBe("nǐ de míng zi");
   expect(generateSmartPinyin("我明白").pinyin).toBe("wǒ míng bai");
   expect(generateSmartPinyin("买东西").pinyin).toBe("mǎi dōng xi");
   expect(generateSmartPinyin("小孩子").pinyin).toBe("xiǎo hái zi");
   expect(generateSmartPinyin("穿衣服").pinyin).toBe("chuān yī fu");
   expect(generateSmartPinyin("谢谢你").pinyin).toBe("xiè xie nǐ");
  });
 });

 describe("Reviewed corpus lexical readings", () => {
  it.each([
   ["记性", "jì xing"],
   ["打扮", "dǎ ban"],
   ["主意", "zhǔ yi"],
   ["笑话", "xiào hua"],
   ["张罗", "zhāng luo"],
   ["打交道", "dǎ jiāo dao"],
   ["耽误", "dān wu"],
   ["高粱", "gāo liang"],
   ["养活", "yǎng huo"],
   ["胭脂", "yān zhi"],
   ["外甥", "wài sheng"],
   ["帐篷", "zhàng peng"],
   ["苗条", "miáo tiao"],
   ["收拾", "shōu shi"],
   ["欺负", "qī fu"],
   ["打发", "dǎ fa"],
   ["在乎", "zài hu"],
   ["功夫", "gōng fu"],
   ["白净", "bái jing"],
   ["本事", "běn shi"],
   ["财主", "cái zhu"],
   ["打算", "dǎ suan"],
   ["工夫", "gōng fu"],
   ["故事", "gù shi"],
   ["伙计", "huǒ ji"],
   ["口袋", "kǒu dai"],
   ["快活", "kuài huo"],
   ["厉害", "lì hai"],
   ["粮食", "liáng shi"],
   ["料子", "liào zi"],
   ["念叨", "niàn dao"],
   ["婆家", "pó jia"],
   ["首饰", "shǒu shi"],
   ["太太", "tài tai"],
   ["晚上", "wǎn shang"],
   ["委屈", "wěi qu"],
   ["位置", "wèi zhi"],
   ["行李", "xíng li"],
   ["学问", "xué wen"],
   ["月亮", "yuè liang"],
  ])("uses the reviewed Mainland neutral lexical reading for %s", (text, expected) => {
   expect(generateSmartPinyin(text).pinyin).toBe(expected);
  });

  it.each([
   ["两口子", "子", "zi"],
   ["进行钻研", "钻", "zuān"],
   ["爱钻研", "钻", "zuān"],
   ["认真钻研", "钻", "zuān"],
   ["钻研一番", "钻", "zuān"],
   ["钻了这个空子", "钻", "zuān"],
   ["钻制度不严的空子", "钻", "zuān"],
   ["小鸡从鸡蛋壳里钻出来了", "钻", "zuān"],
   ["把头钻出来", "钻", "zuān"],
   ["钻出去", "钻", "zuān"],
   ["钻过去", "钻", "zuān"],
   ["钻进人群里", "钻", "zuān"],
   ["冲北房喊叫", "冲", "chòng"],
   ["你为什么冲他发脾气", "冲", "chòng"],
   ["老汉冲儿子瞪了一眼", "冲", "chòng"],
   ["冲着我们直奔过来", "冲", "chòng"],
   ["冲着我盯了好一会儿", "冲", "chòng"],
   ["他冲我说", "冲", "chòng"],
   ["冲张主任叫开了", "冲", "chòng"],
   ["冲着迎上来的父母就是一句", "冲", "chòng"],
   ["这儿子弹很便宜", "子", "zǐ"],
   ["这儿子弹很便宜", "弹", "dàn"],
   ["不能带着小狗同行", "行", "xíng"],
   ["大部分家庭住房比较紧张", "分", "fèn"],
  ])("resolves the reviewed contextual target in %s", (text, char, reading) => {
   const result = generateSmartPinyin(text);
   expect(result.syllables[Array.from(text).indexOf(char)]).toBe(reading);
  });

  it.each([
   ["各奔东西", "gè bèn dōng xī"],
   ["东西南北", "dōng xī nán běi"],
   ["东西方向", "dōng xī fāng xiàng"],
   ["地方政府", "dì fāng zhèng fǔ"],
   ["慢慢", "màn màn"],
   ["明明白白", "míng míng bái bái"],
   ["高高兴兴", "gāo gāo xìng xìng"],
  ])("preserves full tones at the reviewed lexical boundary in %s", (text, expected) => {
   expect(generateSmartPinyin(text).pinyin).toBe(expected);
  });

  it("keeps adjective reduplication outside neutral lexical suffixes", () => {
   expect(generateSmartPinyin("好好").syllables).not.toContain("hao");
   expect(generateSmartPinyin("马马虎虎").syllables.slice(-2)).toEqual(["hū", "hū"]);
  });

  it.each([
   ["差不多先生传", "chà bu duō xiān sheng zhuàn"],
   ["咧开嘴笑着", "liě kāi zuǐ xiào zhe"],
   ["东钻西窜", "dōng zuān xī cuàn"],
   ["走调儿", "zǒu diàor"],
   ["遛鸟", "liù niǎo"],
   ["含含糊糊", "hán hán hú hú"],
   ["重重地撞", "zhòng zhòng de zhuàng"],
   ["撒上花椒粉", "sǎ shàng huā jiāo fěn"],
   ["潮水卷走", "cháo shuǐ juǎn zǒu"],
   ["杂志夹在书里", "zá zhì jiā zài shū lǐ"],
   ["文件夹在桌上", "wén jiàn jiā zài zhuō shàng"],
   ["东栅和西栅", "dōng zhà hé xī zhà"],
   ["各奔东西", "gè bèn dōng xī"],
   ["学生会", "xué shēng huì"],
   ["大城市", "dà chéng shì"],
   ["地方戏", "dì fāng xì"],
  ])("resolves the reviewed lexical meaning in %s", (text, expected) => {
   expect(generateSmartPinyin(text).pinyin).toBe(expected);
  });

  it.each([
   ["越传越远", "yuè chuán yuè yuǎn"],
   ["冲进银行", "chōng jìn yín háng"],
   ["冲着咖啡", "chōng zhe kā fēi"],
   ["钻石", "zuàn shí"],
   ["调整", "tiáo zhěng"],
   ["重重包围", "chóng chóng bāo wéi"],
   ["撒谎", "sā huǎng"],
   ["试卷", "shì juàn"],
   ["夹衣", "jiá yī"],
   ["买东西", "mǎi dōng xi"],
   ["学生", "xué sheng"],
   ["地方", "dì fang"],
  ])("preserves the contrasting lexical meaning in %s", (text, expected) => {
   expect(generateSmartPinyin(text).pinyin).toBe(expected);
  });

  it.each([
   ["链子", "liàn zi"],
   ["胆子", "dǎn zi"],
   ["轮子", "lún zi"],
   ["稿子", "gǎo zi"],
   ["左撇子", "zuǒ piě zi"],
   ["毯子", "tǎn zi"],
   ["法子", "fǎ zi"],
   ["例子", "lì zi"],
  ])("keeps the reviewed noun suffix neutral in %s", (text, expected) => {
   expect(generateSmartPinyin(text).pinyin).toBe(expected);
  });
 });

 describe("Polyphonic character detection", () => {
  it("detects polyphonic characters and provides alternatives", () => {
   expect(isPolyphonicCharacter("得")).toBe(true);
   expect(isPolyphonicCharacter("着")).toBe(true);
   expect(isPolyphonicCharacter("地")).toBe(true);
   expect(isPolyphonicCharacter("你")).toBe(false);
   expect(isPolyphonicCharacter("我")).toBe(false);

   const deAlternatives = getPolyphonicAlternatives("得");
   expect(deAlternatives).toEqual(expect.arrayContaining(["dé", "děi", "de"]));

   const res = generateSmartPinyin("我得去学校");
   // "得" is at index 1
   expect(res.polyphonicIndices).toContain(1);
  });
 });

 describe("Performance benchmark", () => {
  it("processes 10,000 characters within 100ms", () => {
   const sampleSentence =
    "李允美是一位在中国工作的韩国人，她到中国工商银行开户并询问汇款的事情，跑得很快，慢慢地走。";
   const longText = sampleSentence.repeat(200); // ~10,000 chars

   const start = performance.now();
   const result = generateSmartPinyin(longText);
   const duration = performance.now() - start;

   expect(result.syllables.length).toBe(Array.from(longText).length);
   expect(duration).toBeLessThan(150);
  });
 });
});
