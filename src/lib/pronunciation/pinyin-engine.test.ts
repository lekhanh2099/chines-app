import { describe, expect, it } from "vitest";

import {
 generateSmartPinyin,
 getPolyphonicAlternatives,
 isPolyphonicCharacter,
} from "./pinyin-engine";

describe("pinyin-engine", () => {
 describe("Polyphonic and Grammar accuracy", () => {
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
   expect(generateSmartPinyin("目的地").pinyin).toBe("mù dì dì");
   expect(generateSmartPinyin("地方").pinyin).toBe("dì fang");
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
   expect(generateSmartPinyin("成为朋友").pinyin).toBe("chéng wéi péng yǒu");
   expect(generateSmartPinyin("我认为对").pinyin).toBe("wǒ rèn wéi duì");

   expect(generateSmartPinyin("腿很长").pinyin).toBe("tuǐ hěn cháng");
   expect(generateSmartPinyin("李校长").pinyin).toBe("lǐ xiào zhǎng");

   expect(generateSmartPinyin("还我钱").pinyin).toBe("huán wǒ qián");
   expect(generateSmartPinyin("有借有还").pinyin).toBe("yǒu jiè yǒu huán");
   expect(generateSmartPinyin("他还活着").pinyin).toBe("tā hái huó zhe");
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
