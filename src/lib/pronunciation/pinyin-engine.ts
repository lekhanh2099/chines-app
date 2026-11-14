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
 不由得: "bù yóu de",
 舍不得: "shě bu de",
 怪不得: "guài bu de",
 不见得: "bù jiàn de",
 恨不得: "hèn bu de",
 懒得: "lǎn de",
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
 含笑地: "hán xiào de",
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
 不着边际: "bù zhuó biān jì",
 不着痕迹: "bù zhuó hén jì",
 不着调: "bù zháo diào",
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
 倒映: "dào yìng",
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

 // ── 乐 (yuè / lè) ──
 音乐: "yīn yuè",
 乐队: "yuè duì",
 乐器: "yuè qì",
 奏乐: "zòu yuè",
 乐曲: "yuè qǔ",
 民乐: "mín yuè",
 器乐: "qì yuè",
 声乐: "shēng yuè",
 古乐: "gǔ yuè",
 快乐: "kuài lè",
 乐观: "lè guān",
 乐趣: "lè qù",
 可乐: "kě lè",
 享乐: "xiǎng lè",
 玩乐: "wán lè",

 // ── 调 (diào / tiáo) ──
 调查: "diào chá",
 调动: "diào dòng",
 调课: "diào kè",
 声调: "shēng diào",
 音调: "yīn diào",
 语调: "yǔ diào",
 调换: "diào huàn",
 腔调: "qiāng diào",
 低调: "dī diào",
 强调: "qiáng diào",
 调整: "tiáo zhěng",
 调节: "tiáo jié",
 调料: "tiáo liào",
 调皮: "tiáo pí",
 烹调: "pēng tiáo",
 协调: "xié tiáo",

 // ── 中 (zhōng / zhòng) ──
 中奖: "zhòng jiǎng",
 看中: "kàn zhòng",
 猜中: "cāi zhòng",
 击中: "jī zhòng",
 中毒: "zhòng dú",
 中暑: "zhòng shǔ",
 中选: "zhòng xuǎn",
 中弹: "zhòng dàn",
 中国: "zhōng guó",
 中文: "zhōng wén",
 中间: "zhōng jiān",
 中心: "zhōng xīn",
 中学: "zhōng xué",

 // ── 相 (xiāng / xiàng) ──
 照相: "zhào xiàng",
 照相机: "zhào xiàng jī",
 相片: "xiàng piàn",
 首相: "shǒu xiàng",
 相貌: "xiàng mào",
 真相: "zhēn xiàng",
 相声: "xiàng sheng",
 相信: "xiāng xìn",
 互相: "hù xiāng",
 相互: "xiāng hù",
 相当: "xiāng dāng",
 相反: "xiāng fǎn",
 相同: "xiāng tóng",
 相处: "xiāng chǔ",

 // ── 背 (bēi / bèi) ──
 背着: "bēi zhe",
 背包: "bēi bāo",
 背黑锅: "bēi hēi guō",
 背景: "bèi jǐng",
 背后: "bèi hòu",
 背诵: "bèi sòng",
 背影: "bèi yǐng",
 后背: "hòu bèi",
 靠背: "kào bèi",

 // ── 传 (chuán / zhuàn) ──
 自传: "zì zhuàn",
 传记: "zhuàn jì",
 外传: "wài zhuàn",
 差不多先生传: "chà bu duō xiān sheng zhuàn",
 传说: "chuán shuō",
 传统: "chuán tǒng",
 传播: "chuán bō",
 宣传: "xuān chuán",
 流传: "liú chuán",
 传递: "chuán dì",

 // ── 弹 (tán / dàn) ──
 弹吉他: "tán jí tā",
 弹钢琴: "tán gāng qín",
 弹琴: "tán qín",
 弹力: "tán lì",
 弹性: "tán xìng",
 反弹: "fǎn tán",
 子弹: "zǐ dàn",
 炸弹: "zhà dàn",
 导弹: "dǎo dàn",
 炮弹: "pào dàn",

 // ── 应 (yīng / yìng) ──
 应该: "yīng gāi",
 应当: "yīng dāng",
 应有尽有: "yīng yǒu jìn yǒu",
 答应: "dā ying",
 应用: "yìng yòng",
 适应: "shì yìng",
 应聘: "yìng pìn",
 反应: "fǎn yìng",
 应付: "yìng fu",
 回应: "huí yìng",

 // ── 折 (zhé / shé) ──
 打折: "dǎ zhé",
 打八折: "dǎ bā zhé",
 打九折: "dǎ jiǔ zhé",
 打五折: "dǎ wǔ zhé",
 折扣: "zhé kòu",
 折磨: "zhé mó",
 折断: "zhé duàn",
 折本: "shé běn",

 // ── 省 (shěng / xǐng) ──
 省钱: "shěng qián",
 节省: "jié shěng",
 省心: "shěng xīn",
 省份: "shěng fèn",
 广东省: "guǎng dōng shěng",
 省长: "shěng zhǎng",
 反省: "fǎn xǐng",
 自省: "zì xǐng",
 省悟: "xǐng wù",

 // ── 转 (zhuǎn / zhuàn) ──
 转变: "zhuǎn biàn",
 转告: "zhuǎn gào",
 转账: "zhuǎn zhàng",
 转身: "zhuǎn shēn",
 转弯: "zhuǎn wān",
 转向: "zhuǎn xiàng",
 打转: "dǎ zhuàn",
 旋转: "xuán zhuàn",
 转动: "zhuàn dòng",
 转圈: "zhuàn quān",

 // ── 盛 (shèng / chéng) ──
 盛开: "shèng kāi",
 茂盛: "mào shèng",
 盛大: "shèng dà",
 盛行: "shèng xíng",
 盛情: "shèng qíng",
 盛饭: "chéng fàn",
 盛汤: "chéng tāng",
 盛入: "chéng rù",

 // ── Reviewed lexical readings from the learner corpus ──
 钻空子: "zuān kòng zi",
 挨训: "ái xùn",
 炸酱: "zhá jiàng",
 切成: "qiē chéng",
 心脏: "xīn zàng",
 藏蓝: "zàng lán",
 咧开: "liě kāi",
 东钻西窜: "dōng zuān xī cuàn",
 走调: "zǒu diào",
 遛鸟: "liù niǎo",
 含含糊糊: "hán hán hú hú",
 重重地: "zhòng zhòng de",
 撒上: "sǎ shàng",
 卷走: "juǎn zǒu",
 夹在: "jiā zài",
 东栅: "dōng zhà",
 西栅: "xī zhà",
 各奔东西: "gè bèn dōng xī",
 学生会: "xué shēng huì",
 地方戏: "dì fāng xì",
 大城市: "dà chéng shì",
 记性: "jì xing",
 打扮: "dǎ ban",
 主意: "zhǔ yi",
 笑话: "xiào hua",
 张罗: "zhāng luo",
 打交道: "dǎ jiāo dao",
 耽误: "dān wu",
 高粱: "gāo liang",
 养活: "yǎng huo",
 胭脂: "yān zhi",
 外甥: "wài sheng",
 帐篷: "zhàng peng",
 苗条: "miáo tiao",
 收拾: "shōu shi",
 欺负: "qī fu",
 打发: "dǎ fa",
 在乎: "zài hu",
 功夫: "gōng fu",
 白净: "bái jing",
 本事: "běn shi",
 财主: "cái zhu",
 打算: "dǎ suan",
 工夫: "gōng fu",
 故事: "gù shi",
 伙计: "huǒ ji",
 口袋: "kǒu dai",
 快活: "kuài huo",
 厉害: "lì hai",
 粮食: "liáng shi",
 两口子: "liǎng kǒu zi",
 料子: "liào zi",
 念叨: "niàn dao",
 婆家: "pó jia",
 首饰: "shǒu shi",
 太太: "tài tai",
 晚上: "wǎn shang",
 委屈: "wěi qu",
 位置: "wèi zhi",
 行李: "xíng li",
 学问: "xué wen",
 月亮: "yuè liang",
 马虎: "mǎ hu",
 裁缝: "cái feng",
 丈夫: "zhàng fu",
 大丈夫: "dà zhàng fū",
 明明白白: "míng míng bái bái",
 马马虎虎: "mǎ mǎ hū hū",

 // ── 落 (luò / là) ──
 落下: "luò xià",
 落后: "luò hòu",
 降落: "jiàng luò",
 落地: "luò dì",
 角落: "jiǎo luò",
 丢三落四: "diū sān là sì",
 落在家里: "là zài jiā lǐ",

 // ── 累 (lèi / lěi) ──
 太累: "tài lèi",
 很累: "hěn lèi",
 劳累: "láo lèi",
 累坏了: "lèi huài le",
 积累: "jī lěi",
 累积: "lěi jī",
 日积月累: "rì jī yuè lěi",

 // ── 只 (zhī / zhǐ) ──
 只有: "zhǐ yǒu",
 只要: "zhǐ yào",
 只是: "zhǐ shì",
 只能: "zhǐ néng",
 只想: "zhǐ xiǎng",
 一只: "yì zhī",
 两只: "liǎng zhī",
 几只: "jǐ zhī",

 // ── 为 (wèi / wéi) ──
 为了: "wèi le",
 因为: "yīn wèi",
 为什么: "wèi shén me",
 为你: "wèi nǐ",
 为我: "wèi wǒ",
 为大家: "wèi dà jiā",
 为人民: "wèi rén mín",
 认为: "rèn wéi",
 以为: "yǐ wéi",
 成为: "chéng wéi",
 作为: "zuò wéi",

 // ── Neutral Tone Words (轻声 - Khinh thanh) ──
 // High-frequency terms where the second/final syllable is pronounced with neutral tone:
 名字: "míng zi",
 明白: "míng bai",
 朋友: "péng you",
 东西: "dōng xi",
 买东西: "mǎi dōng xi",
 吃东西: "chī dōng xi",
 找东西: "zhǎo dōng xi",
 好东西: "hǎo dōng xi",
 先生: "xiān sheng",
 喜欢: "xǐ huan",
 认识: "rèn shi",
 漂亮: "piào liang",
 舒服: "shū fu",
 客气: "kè qi",
 不客气: "bú kè qi",
 清楚: "qīng chu",
 意思: "yì si",
 有意思: "yǒu yì si",
 没意思: "méi yì si",
 好意思: "hǎo yì si",
 不好意思: "bù hǎo yì si",
 告诉: "gào su",
 告诉他: "gào su tā",
 告诉她: "gào su tā",
 告诉我: "gào su wǒ",
 告诉您: "gào su nín",
 告诉谁: "gào su shéi",
 招呼: "zhāo hu",
 照顾: "zhào gu",
 麻烦: "má fan",
 不麻烦: "bù má fan",
 关系: "guān xi",
 没关系: "méi guān xi",
 有关系: "yǒu guān xi",
 休息: "xiū xi",
 事情: "shì qing",
 发生事情: "fā shēng shì qíng",
 时候: "shí hou",
 什么时候: "shén me shí hou",
 那时候: "nà shí hou",
 这时候: "zhè shí hou",
 小时候: "xiǎo shí hou",
 有时候: "yǒu shí hou",
 消息: "xiāo xi",
 眼睛: "yǎn jing",
 大眼睛: "dà yǎn jing",
 小眼睛: "xiǎo yǎn jing",
 耳朵: "ěr duo",
 衣服: "yī fu",
 穿衣服: "chuān yī fu",
 脱衣服: "tuō yī fu",
 洗衣服: "xǐ yī fu",
 新衣服: "xīn yī fu",
 钥匙: "yào shi",
 配钥匙: "pèi yào shi",
 窗户: "chuāng hu",
 开窗户: "kāi chuāng hu",
 关窗户: "guān chuāng hu",
 打听: "dǎ ting",
 脑袋: "nǎo dai",
 痛快: "tòng kuai",
 凉快: "liáng kuai",
 算盘: "suàn pan",
 热闹: "rè nao",
 糊涂: "hú tu",
 规矩: "guī ju",
 聪明: "cōng ming",
 谢谢: "xiè xie",
 谢谢你: "xiè xie nǐ",
 谢谢您: "xiè xie nín",
 对不起: "duì bu qǐ",
 姑娘: "gū niang",
 小姑娘: "xiǎo gū niang",
 兄弟: "xiōng di",
 兄弟们: "xiōng di men",
 脾气: "pí qi",
 发脾气: "fā pí qi",
 下巴: "xià ba",
 嘴巴: "zuǐ ba",
 尾巴: "wěi ba",
 巴掌: "bā zhang",
 肩膀: "jiān bang",
 抽屉: "chōu ti",
 包袱: "bāo fu",
 骆驼: "luò tuo",
 玻璃: "bō li",
 玻璃窗: "bō li chuāng",
 玻璃杯: "bō li bēi",
 核桃: "hé tao",
 葡萄: "pú tao",
 力气: "lì qi",
 有力气: "yǒu lì qi",
 没力气: "méi lì qi",
 福气: "fú qi",
 运气: "yùn qi",
 神气: "shén qi",
 结实: "jiē shi",
 豆腐: "dòu fu",
 吃豆腐: "chī dòu fu",
 萝卜: "luó bo",
 白萝卜: "bái luó bo",
 红萝卜: "hóng luó bo",
 胡萝卜: "hú luó bo",
 迷糊: "mí hu",
 模糊: "mó hu",
 咳嗽: "ké sou",
 动静: "dòng jing",
 篱笆: "lí ba",
 琵琶: "pí pa",
 葫芦: "hú lu",
 蘑菇: "mó gu",
 苍蝇: "cāng ying",
 蚊子: "wén zi",
 蜈蚣: "wú gong",
 蝙蝠: "biān fu",
 琢磨: "zuó mo",
 嘀咕: "dí gu",
 哆嗦: "duō suo",
 唠叨: "láo dao",
 眨巴: "zhǎ ba",
 结巴: "jiē ba",
 溜达: "liū da",
 别扭: "biè niu",
 称呼: "chēng hu",
 扫帚: "sào zhou",
 栅栏: "zhà lan",
 庄稼: "zhuāng jia",
 大夫: "dài fu",
 师傅: "shī fu",
 学生: "xué sheng",
 护士: "hù shi",

 // ── Kinship & Family (Thân tộc - Khinh thanh) ──
 爸爸: "bà ba",
 妈妈: "mā ma",
 爷爷: "yé ye",
 奶奶: "nǎi nai",
 叔叔: "shū shu",
 舅舅: "jiù jiu",
 姑姑: "gū gu",
 婶婶: "shěn shen",
 哥哥: "gē ge",
 姐姐: "jiě jie",
 弟弟: "dì di",
 妹妹: "mèi mei",
 婆婆: "pó po",
 姥姥: "lǎo lao",
 姥爷: "lǎo ye",
 姑爷: "gū ye",
 亲戚: "qīn qi",

 // ── Suffix -子 (-zi khinh thanh) ──
 孩子: "hái zi",
 小孩子: "xiǎo hái zi",
 女孩子: "nǚ hái zi",
 男孩子: "nán hái zi",
 儿子: "ér zi",
 孙子: "sūn zi",
 桌子: "zhuō zi",
 椅子: "yǐ zi",
 本子: "běn zi",
 杯子: "bēi zi",
 瓶子: "píng zi",
 盘子: "pán zi",
 盒子: "hé zi",
 箱子: "xiāng zi",
 房子: "fáng zi",
 屋子: "wū zi",
 院子: "yuàn zi",
 裙子: "qún zi",
 裤子: "kù zi",
 鞋子: "xié zi",
 帽子: "mào zi",
 袜子: "wà zi",
 句子: "jù zi",
 样子: "yàng zi",
 照样子: "zhào yàng zi",
 什么样子: "shén me yàng zi",
 日子: "rì zi",
 好日子: "hǎo rì zi",
 个子: "gè zi",
 高个子: "gāo gè zi",
 矮个子: "ǎi gè zi",
 肚子: "dù zi",
 脖子: "bó zi",
 嗓子: "sǎng zi",
 鼻子: "bí zi",
 胡子: "hú zi",
 镜子: "jìng zi",
 绳子: "shéng zi",
 梳子: "shū zi",
 刷子: "shuā zi",
 剪子: "jiǎn zi",
 夹子: "jiā zi",
 扣子: "kòu zi",
 胖子: "pàng zi",
 瘦子: "shòu zi",
 傻子: "shǎ zi",
 骗子: "piàn zi",
 猴子: "hóu zi",
 兔子: "tù zi",
 鸭子: "yā zi",
 鸽子: "gē zi",
 燕子: "yàn zi",
 狮子: "shī zi",
 妻子: "qī zi",
 柿子: "shì zi",
 栗子: "lì zi",
 桃子: "táo zi",
 李子: "lǐ zi",
 杏子: "xìng zi",
 梨子: "lí zi",
 橘子: "jú zi",
 柚子: "yòu zi",
 链子: "liàn zi",
 胆子: "dǎn zi",
 轮子: "lún zi",
 稿子: "gǎo zi",
 左撇子: "zuǒ piě zi",
 毯子: "tǎn zi",
 法子: "fǎ zi",
 例子: "lì zi",

 // ── Suffix -头 (-tou khinh thanh) ──
 骨头: "gǔ tou",
 拳头: "quán tou",
 指头: "zhǐ tou",
 手指头: "shǒu zhǐ tou",
 脚指头: "jiǎo zhǐ tou",
 枕头: "zhěn tou",
 石头: "shí tou",
 木头: "mù tou",
 念头: "niàn tou",
 苗头: "miáo tou",
 舌头: "shé tou",
 甜头: "tián tou",
 苦头: "kǔ tou",
 准头: "zhǔn tou",
 势头: "shì tou",
 奔头: "bèn tou",
 盼头: "pàn tou",
 馒头: "mán tou",
 罐头: "guàn tou",

 // ── Pronouns & Affixes (-men, -me, etc.) ──
 我们: "wǒ men",
 你们: "nǐ men",
 他们: "tā men",
 她们: "tā men",
 它们: "tā men",
 人们: "rén men",
 什么: "shén me",
 怎么: "zěn me",
 这么: "zhè me",
 那么: "nà me",
 多么: "duō me",
 凭什么: "píng shén me",
 干什么: "gàn shén me",
 怎么了: "zěn me le",
 怎么样: "zěn me yàng",
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

export const ERHUA_WORDS: readonly string[] = [
 "哪儿",
 "那儿",
 "这儿",
 "花儿",
 "玩儿",
 "小孩儿",
 "男孩儿",
 "女孩儿",
 "会儿",
 "点儿",
 "一下儿",
 "一块儿",
 "个儿",
 "串儿",
 "事儿",
 "人缘儿",
 "份儿",
 "伴儿",
 "冰棍儿",
 "准儿",
 "劲儿",
 "味儿",
 "哥儿",
 "声儿",
 "大伙儿",
 "好好儿",
 "宝贝儿",
 "小肚儿",
 "心眼儿",
 "摊儿",
 "数数儿",
 "明儿",
 "样儿",
 "根儿",
 "歌儿",
 "活儿",
 "海边儿",
 "牌儿",
 "玩意儿",
 "画儿",
 "盒儿",
 "码儿",
 "空儿",
 "纳闷儿",
 "老头儿",
 "聊天儿",
 "脑儿",
 "脸蛋儿",
 "腿儿",
 "菜馆儿",
 "跟儿",
 "路边儿",
 "错儿",
 "鹿尾儿",
 "气儿",
 "头儿",
 "走调儿",
];

const VERBS_BEFORE_DE = new Set([
 "跑",
 "去",
 "回",
 "走",
 "吃",
 "喝",
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
 "拿",
 "办",
 "放",
 "扫",
 "洗",
 "塞",
 "亮",
 "困",
 "饿",
 "忙",
 "兴",
 "憋",
 "系",
 "坐",
 "站",
 "答",
 "窜",
 "买",
 "停",
 "排",
 "来",
 "受",
 "发展",
 "高兴",
 "卖",
 "开",
 "考",
 "打扮",
 "画",
 "策划",
 "吵",
 "激动",
 "生活",
 "收拾",
 "睡",
 "紧张",
 "闷",
 "相处",
 "销售",
 "布置",
 "穿",
 "搭配",
 "逗",
 "感动",
 "气",
 "疼",
 "委屈",
 "想",
 "知道",
 "称赞",
 "承认",
 "吃惊",
 "愁",
 "搭",
 "等",
 "干涉",
 "工作",
 "沟通",
 "害",
 "好",
 "花",
 "急",
 "渴",
 "累",
 "抹",
 "配合",
 "热",
 "设计",
 "实现",
 "谈",
 "体会",
 "选择",
 "压",
 "保管",
 "保护",
 "保证",
 "避",
 "便宜",
 "辩论",
 "表演",
 "病",
 "藏",
 "宠",
 "出发",
 "吹",
 "从容",
 "弹",
 "倒霉",
 "颠",
 "调",
 "对",
 "多",
 "罚",
 "分布",
 "丰富",
 "服",
 "付",
 "付出",
 "改编",
 "高大",
 "观察",
 "管",
 "规定",
 "恢复",
 "挤",
 "检查",
 "讲解",
 "讲究",
 "接触",
 "拒绝",
 "控制",
 "困难",
 "了解",
 "离",
 "聊",
 "流",
 "漏",
 "闹",
 "拍摄",
 "赔偿",
 "佩服",
 "捧",
 "抢",
 "轻松",
 "伸",
 "适应",
 "收集",
 "瘦",
 "树立",
 "掏",
 "淘汰",
 "讨论",
 "提",
 "贴",
 "统计",
 "推荐",
 "玩儿",
 "文明",
 "问",
 "下",
 "吓",
 "闲",
 "心疼",
 "信",
 "行",
 "宣布",
 "要",
 "遗憾",
 "印",
 "用",
 "扎",
 "张",
 "涨",
 "招呼",
 "照顾",
 "震",
 "睁",
 "支付",
 "治疗",
 "装饰",
 "装修",
 "钻",
 "钻研",
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
 "都",
 "也",
]);

const VERBS_AFTER_DEI = new Set([
 "去",
 "来",
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
 "要",
 "挨",
 "躲",
 "注",
 "承",
 "把",
 "被",
 "让",
 "先",
 "再",
 "改",
 "给",
 "马上",
 "稍稍",
 "多长时间",
 "收拾",
 "付出",
 "有",
 "在",
 "早点儿",
 "切",
 "倒",
 "帮",
 "赔",
 "负起",
 "迟到",
 "戴",
 "多练习",
 "好听",
 "选",
 "提前",
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
 "板",
 "名",
 "雷",
 "步",
 "基",
 "质",
 "租",
 "心",
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

const NUMBERS_BEFORE_ZHI = new Set([
 "一",
 "两",
 "三",
 "四",
 "五",
 "六",
 "七",
 "八",
 "九",
 "十",
 "几",
 "半",
 "每",
 "这",
 "那",
]);

const NOUNS_AFTER_ZHI = new Set([
 "猫",
 "狗",
 "鸟",
 "鸡",
 "鸭",
 "兔",
 "羊",
 "猪",
 "牛",
 "虎",
 "狼",
 "手",
 "脚",
 "眼",
 "耳",
 "臂",
 "鞋",
 "袜",
 "船",
 "箭",
]);

const VERBS_AFTER_ZHI_ADVERB = new Set([
 "有",
 "要",
 "是",
 "能",
 "想",
 "会",
 "需",
 "肯",
 "看",
 "听",
 "说",
 "做",
 "去",
 "见",
 "怕",
 "剩",
 "可",
 "好",
 "留",
 "知",
 "爱",
 "求",
 "懂",
]);

const VERBS_BEFORE_WEI = new Set([
 "成",
 "认",
 "作",
 "以",
 "变",
 "称",
 "视",
 "行",
 "无",
 "敢",
 "互",
 "改",
 "化",
 "定",
]);

const TARGETS_AFTER_WEI = new Set([
 "我",
 "你",
 "他",
 "她",
 "您",
 "它",
 "咱",
 "谁",
 "人",
 "大",
 "民",
 "何",
 "什",
 "了",
 "友",
 "国",
 "公",
]);

const DEGREE_BEFORE_CHANG = new Set(["很", "太", "真", "最", "更", "好", "多", "挺", "不"]);

const NOUNS_AFTER_CHANG = new Set(["度", "短", "久", "远", "年", "期", "江", "城", "沙", "路"]);

const TITLES_BEFORE_ZHANG = new Set([
 "校",
 "家",
 "班",
 "市",
 "省",
 "院",
 "局",
 "科",
 "部",
 "队",
 "处",
 "行",
 "排",
 "连",
 "营",
 "团",
 "师",
 "军",
 "县",
 "乡",
 "村",
 "组",
]);

const VERBS_AFTER_ZHANG = new Set(["大", "成", "高", "胖", "出", "得"]);

const TARGETS_AFTER_HUAN = new Set([
 "我",
 "你",
 "他",
 "她",
 "谁",
 "钱",
 "书",
 "债",
 "贷",
 "款",
 "清",
 "给",
 "愿",
 "礼",
]);

const ADVERB_AFTER_HAI = new Set([
 "有",
 "是",
 "要",
 "会",
 "能",
 "想",
 "在",
 "没",
 "好",
 "行",
 "算",
 "真",
 "得",
 "差",
 "可",
 "记",
 "爱",
]);

// Adjectival morphemes support the productive AA modifier pattern; verb
// reduplication such as 挖挖 must not turn its following land object into a particle.
const ADVERBIAL_REDUPLICATION_BASES = new Set([
 ...DEGREE_OR_ADJ_AFTER_DE,
 "静",
 "怯",
 "缓",
 "轻",
 "悄",
 "默",
 "匆",
 "微",
 "急",
 "忙",
 "整",
 "细",
 "稳",
 "紧",
 "兴",
 "平",
 "懒",
 "洋",
 "勃",
 "彬",
 "忧",
 "满",
 "牢",
]);

// Modifier vocabulary is independent of the following predicate; grammatical
// templates below cover productive reduplication, negation and comparison.
const ADVERBIAL_MODIFIERS = new Set([
 ...Object.entries(POLYPHONIC_DICTIONARY)
  .filter(([phrase, reading]) => phrase.endsWith("地") && reading.endsWith(" de"))
  .map(([phrase]) => phrase.slice(0, -1)),
 "开心",
 "兴奋",
 "从容",
 "沉着",
 "不停",
 "踌躇",
 "格外",
 "调皮",
 "感激",
 "怀疑",
 "满怀希望",
 "着急",
 "温柔",
 "冷静",
 "勇敢",
 "愉快",
 "突然",
 "迅速",
 "坚定",
 "随便",
 "顺利",
 "善意",
 "绝望",
 "自觉",
 "下意识",
 "心平气和",
 "聚精会神",
 "实事求是",
 "理所当然",
 "不由自主",
 "不知所措",
 "有条不紊",
 "专心致志",
 "津津有味",
 "火冒三丈",
 "小心",
 "赶快",
 "幸福",
 "庄严",
 "强烈",
 "轻易",
 "奇怪",
 "严格",
 "亲切",
 "感谢",
 "更好",
 "不断",
 "不好意思",
 "很快",
 "冒昧",
 "用力",
 "有效",
 "放心",
 "客观",
 "客气",
 "手忙脚乱",
 "友好",
 "安全",
 "白白",
 "成功",
 "吃惊",
 "干脆",
 "更多",
 "很好",
 "换着花样",
 "坚决",
 "厉害",
 "连呼带叫",
 "勉强",
 "面带微笑",
 "拼命",
 "全身心",
 "生气",
 "失望",
 "手舞足蹈",
 "微笑",
 "隐隐",
 "用心",
 "标准",
 "不安",
 "不服气",
 "不明白",
 "诚恳",
 "诚实",
 "吃力",
 "崇拜",
 "大批量",
 "得体",
 "得意",
 "分期分批",
 "感慨",
 "高效",
 "更快",
 "关心",
 "害怕",
 "汗流满面",
 "狠狠",
 "欢天喜地",
 "挥汗如雨",
 "极大",
 "急切",
 "肩并肩",
 "艰难",
 "接二连三",
 "尽可能",
 "尽情",
 "紧张不安",
 "惊喜",
 "精心",
 "久久",
 "开诚布公",
 "牢固",
 "连蹦带跳",
 "连滚带爬",
 "连声",
 "气喘吁吁",
 "气呼呼",
 "恰当",
 "千恩万谢",
 "轻快",
 "轻声",
 "热心",
 "深情",
 "深入",
 "神秘",
 "适当",
 "舒服",
 "随时随地",
 "听话",
 "系统",
 "详细",
 "响亮",
 "小声",
 "辛苦",
 "一个劲儿",
 "一根不少",
 "一溜烟",
 "意外",
 "悠闲",
 "有根据",
 "有计划",
 "圆满",
 "再三",
 "真实",
 "逐步",
 "专心",
 "准确",
 "自我安慰",
 "自由",
 "最大化",
 "尊敬",
 "郑重",
 "激烈",
]);

const PREDICATES_AFTER_DE = new Set([
 ...VERBS_BEFORE_DE,
 ...VERBS_AFTER_DEI,
 ...DEGREE_OR_ADJ_AFTER_DE,
 "站",
 "坐",
 "躺",
 "叹",
 "燃",
 "感",
 "脱",
 "掏",
 "赔",
 "宣",
 "点",
 "瞪",
 "望",
 "摇",
 "叙",
 "退",
 "答",
 "眨",
 "冲",
 "逃",
 "把",
 "被",
 "再",
 "面对",
]);

const REDUPLICATED_VERBS = new Set([
 "看",
 "走",
 "想",
 "试",
 "听",
 "学",
 "问",
 "玩",
 "尝",
 "读",
 "坐",
 "笑",
 "说",
 "写",
 "找",
 "洗",
 "逛",
 "聊",
 "练",
 "摸",
 "拍",
 "敲",
 "拿",
 "喝",
 "吃",
]);

const DURATIVE_VERBS_BEFORE_ZHE = new Set([
 "看",
 "听",
 "说",
 "走",
 "坐",
 "站",
 "躺",
 "穿",
 "戴",
 "拿",
 "带",
 "跟",
 "开",
 "关",
 "等",
 "望",
 "瞪",
 "闭",
 "想",
 "推",
 "冲",
 "引",
 "叫",
 "吹",
]);

const RESULT_VERBS_BEFORE_ZHAO = new Set([
 "睡",
 "找",
 "寻",
 "够",
 "逮",
 "捉",
 "点",
 "烧",
 "冻",
 "饿",
 "撞",
 "碰",
 "遇",
 "猜",
 "见",
 "摸",
 "犯",
 "掏",
]);

const COMPLEMENTS_AFTER_DE = new Set([
 ...DEGREE_OR_ADJ_AFTER_DE,
 "耀",
 "满",
 "干",
 "整",
 "这",
 "那",
 "了",
 "动",
 "慌",
 "要",
 "怎",
 "我",
 "你",
 "他",
 "她",
 "乱",
 "像",
 "稳",
 "笔",
 "合",
 "死",
 "飞",
 "秀",
 "肚",
 "浑",
 "脚",
 "汗",
 "惊",
 "发",
 "比",
 "直",
 "入",
 "老",
 "可",
 "上",
 "下",
 "及时",
 "起",
 "过",
 "通",
 "惯",
 "广泛",
 "讲究",
 "过分",
 "又",
 "正",
 "眼睛",
 "拍着",
 "得意",
 "算是",
 "跟",
 "十全十美",
 "便宜",
 "越",
 "倒",
 "有理",
 "有道理",
 "有价值",
 "最",
 "超过",
 "几乎",
 "如此",
 "没有",
 "饱饱",
 "一清二楚",
 "半夜",
 "实在",
 "声音",
 "数不清",
 "让人",
 "都",
 "流下",
 "人",
 "明白",
 "既",
 "简直",
 "确实",
 "也",
 "还",
 "更",
 "轻松",
 "舒服",
 "手舞足蹈",
 "对",
 "成",
 "出来",
 "出奇",
 "控制不住",
 "睡不着",
 "挺",
 "极",
 "一夜",
 "复杂",
 "说不出",
 "说话",
 "走不动",
 "一点",
]);

const LAND_VERBS_BEFORE_DI = new Set(["挖", "锄", "耕", "种", "租", "买", "卖", "占", "征", "犁"]);

/** Recognize a modifier plus predicate without enumerating whole pinyin phrases. */
export function isAdverbialDe(chineseChars: readonly string[], index: number): boolean {
 if (chineseChars[index] !== "地") return false;
 const prev = chineseChars[index - 1];
 const prevPrev = chineseChars[index - 2];
 const prev3 = chineseChars[index - 3];
 const prev4 = chineseChars[index - 4];
 const next = chineseChars[index + 1];
 if (
  prev === "腾" &&
  (next === "就"
   ? /^[坐站跳冲]$/u.test(chineseChars[index + 2] ?? "")
   : /^[坐站跳冲]$/u.test(next ?? ""))
 )
  return true;
 if (
  !prev ||
  !prevPrev ||
  !next ||
  !CHINESE_CHAR_REGEX.test(prev) ||
  !CHINESE_CHAR_REGEX.test(prevPrev)
 )
  return false;

 const repeatedAdjective = prev === prevPrev && ADVERBIAL_REDUPLICATION_BASES.has(prev);
 const repeatedPair = prev === prev3 && prevPrev === prev4 && CHINESE_CHAR_REGEX.test(prev3 ?? "");
 const doubledPair = prev === prevPrev && prev3 === prev4 && CHINESE_CHAR_REGEX.test(prev3 ?? "");
 const trailingPair =
  prev === prevPrev &&
  prev3 !== prev &&
  (ADVERBIAL_REDUPLICATION_BASES.has(prev4 ?? "") ||
   ADVERBIAL_REDUPLICATION_BASES.has(prev3 ?? "") ||
   ADVERBIAL_REDUPLICATION_BASES.has(prev) ||
   prev3 === "笑");
 const leadingPair = prev3 === prev4 && ADVERBIAL_REDUPLICATION_BASES.has(prev3 ?? "");
 const alternatingModifier =
  (prev4 === prevPrev && /^[无不自半]$/u.test(prev4 ?? "")) ||
  (prev4 === "一" && prev3 === prev && prevPrev === "不");
 const modifierText = chineseChars.slice(Math.max(0, index - 6), index).join("");
 const knownModifier = [...ADVERBIAL_MODIFIERS].some((word) => modifierText.endsWith(word));
 const recurringModifier =
  /(?:一([\p{Script=Han}])(?:又|接)一\1|东([\p{Script=Han}])[串走跑奔]西\2|一([寸天步])\3)$/u.test(
   modifierText,
  );
 const comparison =
  (prev === "样" && /^[一这那同]$/u.test(prevPrev)) || prev === "似" || prev === "般";
 const negatedModifier =
  (prev4 === "无" && prev3 === "可") ||
  (prev4 === "毫" && prev3 === "不") ||
  (prev4 === "似" && prevPrev === "非");
 if (
  !repeatedAdjective &&
  !repeatedPair &&
  !doubledPair &&
  !trailingPair &&
  !leadingPair &&
  !alternatingModifier &&
  !knownModifier &&
  !recurringModifier &&
  !comparison &&
  !negatedModifier
 )
  return false;
 // A quantified noun (一块块地) does not establish an adverbial boundary.
 if (
  prev === prevPrev &&
  !recurringModifier &&
  /^[一二三四五六七八九十百千万两几每这那]$/u.test(prev3 ?? "")
 )
  return false;
 if (LAND_VERBS_BEFORE_DI.has(prev)) return false;
 if (
  (next === "上" || next === "下") &&
  !/^[台车班学楼床山岸场网前去来门任课街升沉降水了]$/u.test(chineseChars[index + 2] ?? "")
 )
  return false;
 if (
  (next === "上" || next === "下") &&
  chineseChars[index + 2] === "了" &&
  !/^[一二三四五六七八九十两几0-9]*(?:辆|层|个|节|堂)?[台车班学楼床山岸场网课]/u.test(
   chineseChars.slice(index + 3, index + 9).join(""),
  )
 )
  return false;
 if (
  prevPrev === "小" &&
  prev === "心" &&
  next === "滑" &&
  !CHINESE_CHAR_REGEX.test(chineseChars[index + 2] ?? "")
 )
  return false;
 if (
  NOUN_SUFFIXES_AFTER_DI.has(next) &&
  !ADVERBIAL_REDUPLICATION_BASES.has(prev) &&
  (VERBS_BEFORE_DE.has(prev) || VERBS_AFTER_DEI.has(prev))
 )
  return false;
 // ABAB verbs can take a place noun (打扫打扫地下室); 一步一步 is a modifier.
 if (repeatedPair && prevPrev !== "一" && NOUN_SUFFIXES_AFTER_DI.has(next)) return false;

 // A recognized modifier establishes the boundary independently of which
 // predicate follows it. Keep place-noun suffixes guarded (怀疑地图/整理地下室).
 return (
  [...PREDICATES_AFTER_DE].some((word) =>
   chineseChars
    .slice(index + 1)
    .join("")
    .startsWith(word),
  ) ||
  (next === "工" && chineseChars[index + 2] === "作") ||
  ((next === "上" || next === "下") && CHINESE_CHAR_REGEX.test(chineseChars[index + 2] ?? "")) ||
  (CHINESE_CHAR_REGEX.test(next) && !NOUN_SUFFIXES_AFTER_DI.has(next))
 );
}

/** Return a positively identified grammatical reading, or leave inference to the library. */
export function getGrammarPinyin(chineseChars: readonly string[], index: number): string {
 const char = chineseChars[index];
 const prev = chineseChars[index - 1];
 const prevPrev = chineseChars[index - 2];
 const next = chineseChars[index + 1];

 if (
  /^[地得着冲不]$/u.test(char ?? "") &&
  chineseChars.slice(Math.max(0, index - 4), index + 4).some((value) => /^\s+$/u.test(value))
 ) {
  const grammarChars = chineseChars.filter((value) => !/^\s+$/u.test(value));
  const grammarIndex = chineseChars.slice(0, index).filter((value) => !/^\s+$/u.test(value)).length;
  return getGrammarPinyin(grammarChars, grammarIndex);
 }

 if (char === "地") return isAdverbialDe(chineseChars, index) ? "de" : "";

 if (
  char &&
  prev === char &&
  REDUPLICATED_VERBS.has(char) &&
  prevPrev !== char &&
  next !== char &&
  !/^(?:走廊|读物|问题|看法|想法|想象|听力|说明|说法|玩具|学问|笑话)/u.test(
   chineseChars.slice(index, index + 2).join(""),
  ) &&
  !(next && next === chineseChars[index + 2]) &&
  !(prevPrev && prevPrev === chineseChars[index - 3])
 )
  return pinyin(char, { toneType: "none" });

 if (
  char === "不" &&
  prev &&
  (REDUPLICATED_VERBS.has(prev) ||
   /^[去回买卖做办放拿过带搬借忘记认帮拆等付飞塞掏闲停生受花避干离关忙]$/u.test(prev) ||
   /^(?:联系不[上到]|进行不(?:下去|了(?!解))|(?:克服|改变|举行|应对)不了(?!解)|高兴不起来)/u.test(
    chineseChars.slice(Math.max(0, index - 2), index + 4).join(""),
   ) ||
   (prev === "来" && next === "及")) &&
  !/^懂装懂/u.test(chineseChars.slice(index + 1).join("")) &&
  !(
   prev === "说" &&
   (next === "懂" || /^来[^，。！？；,.!?;]{0,5}的人/u.test(chineseChars.slice(index + 1).join("")))
  ) &&
  /^[懂动见着了完清住起出进下上开到来过惯及]$/u.test(next ?? "")
 )
  return "bu";

 if (
  char === "过" &&
  /^[看听吃读用学见问做说买]$/u.test(prev ?? "") &&
  !/^[来去头分度火量半]$/u.test(next ?? "")
 )
  return "guo";

 if (
  char === "西" &&
  prev === "东" &&
  /^(?:南北|方|两[岸国端])/u.test(chineseChars.slice(index + 1).join(""))
 )
  return "xī";
 if (char === "缝" && prev === "裁" && /^[衣裤裙布]$/u.test(next ?? "")) return "féng";
 if (
  char === "方" &&
  prev === "地" &&
  /^(?:政府|官|经济|税|病|志|性)/u.test(chineseChars.slice(index + 1).join(""))
 )
  return "fāng";
 if (
  char === "分" &&
  prev === "部" &&
  (!prevPrev || !CHINESE_CHAR_REGEX.test(prevPrev) || /^[大一这那某少]$/u.test(prevPrev))
 )
  return "fèn";

 if (char === "得" && next) {
  const followingText = chineseChars.slice(index + 1, index + 9).join("");
  const precedingText = chineseChars.slice(Math.max(0, index - 6), index).join("");
  if (next === "来" && /(?:靠自己|辛苦|劳动)$/u.test(precedingText)) return "dé";
  if (next === "来" && prev === "合") return "de";
  if (/(?:不由|舍不|怪不|不见|恨不|懒)$/u.test(precedingText)) return "de";
  if (
   /^了[“"'「‘]*(?:第?[一二三四五六七八九十0-9]+等?奖|[\p{Script=Han}]{0,3}[病炎癌]|奖|冠军)/u.test(
    followingText,
   )
  )
   return "dé";
  if (prev === "还" && next === "了") {
   const before = chineseChars.slice(0, index - 1).join("");
   if (/(?:不但|不仅|不光|不只)/u.test(before)) return "dé";
   if (
    /[借欠]|图书馆/u.test(before) &&
    /^了[书钱债款](?:[吗吧呢了\p{Punctuation}]|$)/u.test(followingText)
   )
    return "de";
  }
  if (next === "到") {
   const destination = chineseChars.slice(index + 2, index + 18).join("");
   if (
    /^(?:专门的)?(?:洗衣店|学校|医院|机场|车站|北京|超市)(?:去|来|干洗|办理|买)/u.test(destination)
   )
    return "děi";
   if (/^[听看走]$/u.test(prev ?? "")) return "de";
   if (POLYPHONIC_DICTIONARY[`${prev ?? ""}得到`]?.endsWith(" de dào")) return "de";
   return "dé";
  }
  const bodyPartComplement = /^(?:(?:手|脚|头|肚子)(?:都|也|发|酸|疼|痛)|手舞足蹈)/u.test(
   followingText,
  );
  if (PRONOUNS_BEFORE_DEI.has(prev ?? "") && /^(?:分清|体会|知道|救[这那一])/u.test(followingText))
   return "děi";
  // Acquire/resultative lexical words retain their dictionary reading.
  if (
   /^[获取赢博值心只求争夺谋]$/u.test(prev ?? "") ||
   (prev === "难" && prevPrev !== "困") ||
   /^[到奖病分失利体法罪救逞偿知道意胜势]$/u.test(next)
  )
   return "";
  if (next === "手" && !bodyPartComplement) return "";
  if (
   /^(?:高分|大奖|好处|大病|重病|冠军|名次|票|了(?:胃癌|肝炎|感冒|大奖|冠军))/u.test(followingText)
  )
   return "";
  if (prev === "不" && (next === "不" || next === "了")) return "";
  if (/^[记觉懂舍免省显]$/u.test(prev ?? "")) return "de";
  if (next === "了" && /^[奖病]$/u.test(chineseChars[index + 2] ?? "")) return "";
  const verbalComplement =
   [...VERBS_BEFORE_DE].some((word) => precedingText.endsWith(word)) &&
   !(prev === "生" && prevPrev === "学");
  const adjectivalComplement =
   prev !== undefined &&
   !/^[很非真太不]$/u.test(prev) &&
   (ADVERBIAL_REDUPLICATION_BASES.has(prev) || /^[气胖咸]$/u.test(prev));
  const modifierComplement = [...ADVERBIAL_MODIFIERS].some((word) =>
   followingText.startsWith(word),
  );
  const degreeComplement = /^(?:十分|特别|相当|极其|格外|更加|越来越)/u.test(followingText);
  const causativeComplement =
   /^[\p{Script=Han}]{1,4}(?:很|怪|直|都|浑身|哈哈|忍不住|不知|不好意思|难为情|开心|高兴|难受|喜欢)/u.test(
    followingText,
   );
  const potentialResultClause = /^[\p{Script=Han}]{1,4}不[了成动住起出到]/u.test(followingText);
  const modalPredicate = [...VERBS_AFTER_DEI].some((word) => followingText.startsWith(word));
  if (modalPredicate && /(?:早晚|迟早|首先|最后|最终|以后|将来)$/u.test(precedingText))
   return "děi";
  if (/^[一二三四五六七八九十两几0-9]+个?人(?:分担|合作|来|一起)/u.test(followingText))
   return "děi";
  if (
   followingText.startsWith("多少钱") &&
   /[这那一两三四五六七八九十几](?:盆|幅|本|支|辆|件|张|双|些)[\p{Script=Han}]{1,4}$/u.test(
    precedingText,
   )
  )
   return "děi";
  if (
   (verbalComplement || (adjectivalComplement && next !== "了")) &&
   ([...COMPLEMENTS_AFTER_DE].some((word) => followingText.startsWith(word)) ||
    modifierComplement ||
    degreeComplement ||
    bodyPartComplement ||
    causativeComplement ||
    potentialResultClause ||
    followingText.startsWith("不能") ||
    (next === "一" && chineseChars[index + 2] === "般"))
  )
   return "de";
  if ((prev === "想" || prev === "怕") && /^(?:很|入神|发抖|浑身|合不拢)/u.test(followingText))
   return "de";
  if ((!prev || !CHINESE_CHAR_REGEX.test(prev) || PRONOUNS_BEFORE_DEI.has(prev)) && modalPredicate)
   return "děi";
  if (prev === "过" && prevPrev === "不" && modalPredicate) return "děi";
  if (next === "要" && prev !== "不") return "děi";
  // A subject followed by necessity can precede an adverbial phrase, not only
  // a bare verb (我们得认真考虑). A preceding predicate still introduces de.
  if (
   !verbalComplement &&
   !adjectivalComplement &&
   (modifierComplement ||
    modalPredicate ||
    /^(?:好好|安排)/u.test(followingText) ||
    /^[\p{Script=Han}]+才行/u.test(chineseChars.slice(index + 1, index + 22).join("")))
  )
   return "děi";
 }

 if (char === "了") {
  const previousChars = chineseChars.slice(0, index).filter((value) => !/^\s+$/u.test(value));
  const followingChars = chineseChars.slice(index + 1).filter((value) => !/^\s+$/u.test(value));
  const previous = previousChars.at(-1);
  const previous2 = previousChars.at(-2);
  const following = followingChars[0];
  if (/^无(?:新意|生趣|兴趣|痕迹|睡意|遗憾|牵挂|希望)/u.test(followingChars.join("")))
   return "liǎo";
  if (previous === "了" && previous2 === "不" && following === "之") return "liǎo";
  if (
   previous === "明" &&
   (!previous2 ||
    !CHINESE_CHAR_REGEX.test(previous2) ||
    /(?:[我你他她它您咱](?:们)?|已经|早已|十分|完全|彻底|很)$/u.test(
     previousChars.slice(0, -1).join(""),
    ))
  )
   return "liǎo";
  if (previous === "为" && !/^[因认以成作行]$/u.test(previous2 ?? "")) return "le";
  if (
   previous === "得" &&
   /^[“"'「‘]*(?:第?[一二三四五六七八九十0-9]+等?奖|[\p{Script=Han}]{0,3}[病炎癌]|奖|冠军)/u.test(
    followingChars.slice(0, 8).join(""),
   )
  )
   return "le";
  if (
   previous === "不" &&
   previous2 &&
   CHINESE_CHAR_REGEX.test(previous2) &&
   !/^[我你他她它咱您谁的都也就还又再可并真那这能敢愿不只]$/u.test(previous2)
  )
   return "liǎo";
  if (
   previous === "得" &&
   previous2 === "还" &&
   /(?:不但|不仅|不光|不只)/u.test(previousChars.join(""))
  )
   return "le";
  if (
   previous === "得" &&
   previous2 === "不" &&
   (VERBS_BEFORE_DE.has(previousChars.at(-3) ?? "") ||
    VERBS_AFTER_DEI.has(previousChars.at(-3) ?? ""))
  )
   return "le";
  if (previous === "得" && previous2 === "不") return "liǎo";
  if (
   previous === "了" &&
   (previous2 === "不" || previous2 === "得") &&
   (VERBS_BEFORE_DE.has(previousChars.at(-3) ?? "") ||
    VERBS_AFTER_DEI.has(previousChars.at(-3) ?? ""))
  )
   return "le";
  if (
   (previous === "得" || previous === "不") &&
   previous2 &&
   !(previous === "得" && following && /^[奖病]$/u.test(following)) &&
   (VERBS_BEFORE_DE.has(previous2) || VERBS_AFTER_DEI.has(previous2))
  )
   return "liǎo";
  if (
   (following === "结" && followingChars[1] === "果" && previous === "布") ||
   (following === "事" && previous === "错") ||
   (following === "却" && followingChars[1] === "又" && previous === "去" && previous2 === "失")
  )
   return "le";
  const before = previousChars.slice(-6).join("");
  const verbalAspect =
   ([...VERBS_BEFORE_DE].some((word) => before.endsWith(word)) ||
    /(?:发现|删除|发送|否认)$/u.test(before) ||
    previous === "到") &&
   !/^(?:想|要)$/u.test(previous ?? "") &&
   !/(?:打算|希望|准备|需要|愿意|决定)$/u.test(before);
  if (
   verbalAspect &&
   ((following === "结" && followingChars[1] === "案") ||
    (following === "断" && followingChars[1] === "裂") ||
    following === "却")
  )
   return "le";
  if (following === "解") {
   if (
    (/^[药毒热剖脱说放题暑释压约]$/u.test(followingChars[1] ?? "") && verbalAspect) ||
    (followingChars[1] === "决" && /^[说提]$/u.test(previous ?? ""))
   )
    return "le";
   return "liǎo";
  }
  if (following && /^[解结然却无事断不]$/u.test(following)) return "";
  // Whitespace in completed exercises does not change a particle's role.
  // Keep lexical endings and potential complements above ahead of this rule.
  if (prev !== previous || next !== following) {
   const lexicalEnding = previousChars.slice(-3).join("");
   if (
    previous &&
    CHINESE_CHAR_REGEX.test(previous) &&
    !/^(?:知|未|终|了|不|得)$/u.test(previous) &&
    !/(?:没完没|一了百|一了千)$/u.test(lexicalEnding) &&
    !(previous === "一" && following === "百")
   )
    return "le";
  }
  // Quoted speech/predicates and age numerals still take the aspect/change particle.
  const closingQuote =
   prev !== undefined &&
   (/^[”’」』》）)\]】]$/u.test(prev) ||
    (/^["']$/u.test(prev) &&
     chineseChars.slice(0, index).filter((value) => value === prev).length % 2 === 0));
  if (
   closingQuote &&
   (!next ||
    /^[吧吗呢啊\r\n\p{Punctuation}\p{Symbol}]$/u.test(next) ||
    /^(?:(?:[0-9一二三四五六七八九十百两几]+|好几)[声句下遍次]|很久|以后)/u.test(
     chineseChars.slice(index + 1, index + 8).join(""),
    ))
  )
   return "le";
  if (prev && /^[0-9]$/u.test(prev) && (!next || /^[吧吗呢啊\p{Punctuation}]$/u.test(next)))
   return "le";
  if (
   /(?:周末|月底|年底|岁|时候|时间|日子|月份|星期[一二三四五六天日])$/u.test(
    chineseChars.slice(Math.max(0, index - 4), index).join(""),
   ) &&
   (!next || /^[吧吗呢啊\p{Punctuation}]$/u.test(next))
  )
   return "le";
  if (prev && VERBS_BEFORE_DE.has(prev) && next && /^[一二三四五六七八九十两几]$/u.test(next))
   return "le";
 }

 if (char === "着") {
  if (
   next === "手" &&
   prev === "想" &&
   /^(?:解决|处理|开展|准备|进行|研究|修复|实施)/u.test(chineseChars.slice(index + 2).join(""))
  )
   return "zhuó";
  if (
   (next === "棋" &&
    !VERBS_BEFORE_DE.has(prev ?? "") &&
    !DURATIVE_VERBS_BEFORE_ZHE.has(prev ?? "")) ||
   (/^[一两三这那]$/u.test(prev ?? "") && /^[妙险]$/u.test(next ?? "")) ||
   (prev === "一" && prevPrev === "高") ||
   (prev === "没" && next === "了")
  )
   return "zhāo";
  const followingClause =
   chineseChars
    .slice(index + 1)
    .join("")
    .split(/[，。！？；,.!?;\n]/u)[0] ?? "";
  // A following relative 的 keeps 穿着 verbal: 我的穿着很好看的衣服的朋友.
  const nounPredicate =
   followingClause.startsWith("是") ||
   (!followingClause.includes("的") &&
    /^(?:很|十分|非常|比较|有些|都|虽然|让|风格|品味|和|与)/u.test(followingClause));
  if (
   prev === "穿" &&
   ((next === "打" && chineseChars[index + 2] === "扮") ||
    (prevPrev === "的" && (!next || /^\p{Punctuation}$/u.test(next) || nounPredicate)))
  )
   return "zhuó";
  const lexicalEnding = chineseChars.slice(index + 1, index + 3).join("");
  if (prev === "不" && (lexicalEnding === "边际" || lexicalEnding === "痕迹")) return "";
  if (
   (prev === "得" || prev === "不") &&
   prevPrev &&
   (VERBS_BEFORE_DE.has(prevPrev) ||
    VERBS_AFTER_DEI.has(prevPrev) ||
    RESULT_VERBS_BEFORE_ZHAO.has(prevPrev))
  )
   return "zháo";
  const repeatedVerb =
   (next === prev && chineseChars[index + 2] === "着") ||
   (prevPrev === "着" && chineseChars[index - 3] === prev);
  if (repeatedVerb) return "zhe";
  if (
   (prev === "找" || prev === "猜") &&
   (/(?:正(?!好)|一边)[^，。！？；,.!?;]{0,6}$/u.test(
    chineseChars.slice(Math.max(0, index - 9), index - 1).join(""),
   ) ||
    (prev === "猜" && followingClause.startsWith("谜语")))
  )
   return "zhe";
  if (prev === "正" && next === "走") return "zhe";
  if (
   prev === "摸" &&
   /没等[^，。！？；,.!?;]{0,4}摸$/u.test(
    chineseChars.slice(Math.max(0, index - 8), index).join(""),
   )
  )
   return "zháo";
  if (
   prev &&
   RESULT_VERBS_BEFORE_ZHAO.has(prev) &&
   !(prev === "找" && prevPrev === "寻") &&
   !(prev === "烧" && prevPrev === "燃") &&
   (next === "了" || /^[找猜够逮捉见]$/u.test(prev))
  )
   return "zháo";
  if (prev && DURATIVE_VERBS_BEFORE_ZHE.has(prev)) return "zhe";
 }

 if (char === "的") {
  const boundary = !next || /^\p{Punctuation}$/u.test(next);
  const beforeWord = chineseChars.slice(0, index - 1).join("");
  const taxiContext =
   (!beforeWord ||
    /[“‘「『"'，、,：:]$/u.test(beforeWord) ||
    /(?:经常|常常|总是|准备|选择|需要|愿意|喜欢|宁可|可以|决定|想|要|得)$/u.test(beforeWord)) &&
   !/是[^，。！？；,.!?;]{0,10}$/u.test(beforeWord);
  if (prev === "打" && ((boundary && taxiContext) || /^[去来回到]$/u.test(next ?? ""))) return "dī";
  if (prev === "面" && boundary && (!prevPrev || /^[“‘「『"'坐乘]$/u.test(prevPrev))) return "dī";
 }

 if (char === "卡" && next === "在") {
  const before = chineseChars
   .slice(Math.max(0, index - 8), index)
   .join("")
   .replace(/(?:牢牢|紧紧)$/u, "");
  const jammed =
   !prev ||
   /^[被却又就正仍还]$/u.test(prev) ||
   /(?:链子|链条|皮带|机器|钥匙|门栓|鱼刺|纸张|齿轮|零件|卡片|车轮)$/u.test(before);
  if (jammed) return "qiǎ";
 }

 if (char === "行" && prev === "同" && next !== "业") {
  const before = chineseChars.slice(Math.max(0, index - 16), index - 1).join("");
  if (
   /(?:辆车(?:仍然|依然|一直|一起|也|还|正|都|在)*|结伴|一路|并肩|相约|(?:与|跟|和|陪)[我你他她您](?:们)?|带着(?:[小白黑黄花]?[狗猫]|孩子|家人|朋友))$/u.test(
    before,
   )
  )
   return "xíng";
 }

 if (char === "冲" && !/^[锋动突击洗刷浪破垮毁撞进出到向上下走跑]$/u.test(next ?? "")) {
  const followingClause =
   chineseChars
    .slice(index + (next === "着" ? 2 : 1))
    .join("")
    .split(/[，。！？；,.!?;\n]/u)[0] ?? "";
  // Directed speech/gesture differs from a durative verb (冲着咖啡/冲着凉水澡).
  if (/^(?:[一二三两0-9]+杯)?(?:咖啡(?![师机])|奶粉|[冷凉热]水澡)/u.test(followingClause))
   return "chōng";
  if (
   next === "着" &&
   /^(?:[我你他她您咱](?:们)?|妈妈|爸爸|[\p{Script=Han}]{0,7}父母)/u.test(followingClause)
  )
   return "chòng";
  if (
   /^[\p{Script=Han}]{1,8}(?:喊|叫|说|笑|问|盯|瞪|发脾气|招手|点头|挥手)/u.test(
    followingClause.split(/一边|一面|同时|并且|然后/u)[0] ?? "",
   )
  )
   return "chòng";
 }

 if (
  char === "钻" &&
  !/(?:电|风|金刚|手摇|冲击)$/u.test(chineseChars.slice(Math.max(0, index - 3), index).join("")) &&
  (/^[研进出入过]/u.test(chineseChars.slice(index + 1).join("")) ||
   /^[^，。！？；,.!?;]{0,8}空子/u.test(chineseChars.slice(index + 1).join("")))
 )
  return "zuān";

 if (
  char === "还" &&
  /^(?:[我你他她]的[书钱]|[我你他她]一个公道)/u.test(chineseChars.slice(index + 1).join(""))
 )
  return "huán";
 if (
  char === "长" &&
  (/^[我你他她][一二三四五六七八九十0-9]+岁/u.test(chineseChars.slice(index + 1).join("")) ||
   (next === "长" && chineseChars[index + 2] === "了"))
 )
  return "zhǎng";
 if (char === "只" && prev && NUMBERS_BEFORE_ZHI.has(prev)) return "zhī";
 if (char === "倒" && /^[摔吹撞推打跌绊]$/u.test(prev ?? "")) return "dǎo";
 if (
  char === "倒" &&
  /^了[一两三四五六七八九十0-9]*[杯碗瓶壶盆][水茶酒奶汤]/u.test(
   chineseChars.slice(index + 1).join(""),
  )
 )
  return "dào";
 if (
  char === "教" &&
  /(?:业主|主任)$/u.test(chineseChars.slice(Math.max(0, index - 2), index).join("")) &&
  /^[我你他她孩]$/u.test(next ?? "")
 )
  return "jiāo";

 if (
  char === "斗" &&
  next === "酒" &&
  (chineseChars[index + 2] === "诗" ||
   (/^[一二三四五六七八九十两半几]$/u.test(prev ?? "") && chineseChars[index + 2] !== "就"))
 )
  return "dǒu";

 if (
  char === "还" &&
  /^(?:完|不了|得了)[钱书债款]/u.test(chineseChars.slice(index + 1, index + 5).join(""))
 ) {
  const before = chineseChars.slice(0, index).join("");
  if (
   !/^(?:得了)/u.test(chineseChars.slice(index + 1, index + 3).join("")) ||
   (!/(?:不但|不仅|不光|不只)/u.test(before) && /[借欠]|图书馆/u.test(before))
  )
   return "huán";
 }

 if (
  char === "教" &&
  !/(?:[宗佛道儒家说主邪回新旧礼国异文社胎政助祆明名景信入请讨求管调传指赐任]|基督|伊斯兰|印度|东正|白莲|摩门|天理)$/u.test(
   chineseChars.slice(Math.max(0, index - 3), index).join(""),
  ) &&
  /^[我你他她孩]$/u.test(next ?? "")
 )
  return "jiāo";

 return "";
}

/** Classifier recurrence does not take the neutral 一 of verb reduplication. */
export function getToneSandhiPinyin(chineseChars: readonly string[], index: number): string {
 if (
  chineseChars[index] !== "一" ||
  chineseChars[index - 2] !== "一" ||
  chineseChars[index - 1] !== chineseChars[index + 1] ||
  !/^[个件本年月天次遍回步样行条张支]$/u.test(chineseChars[index + 1] ?? "")
 )
  return "";
 const following = pinyin(chineseChars.slice(index + 1, index + 3).join(""), {
  type: "array",
  toneType: "num",
  toneSandhi: false,
 });
 return following[0]?.endsWith("4") ? "yí" : "yì";
}

/**
 * Apply grammatical contextual rules across syllables, including particles
 * 得, 地, 了, 着 and the existing 倒, 只, 为, 长, 还 heuristics.
 */
export function applyGrammarHeuristics(
 chineseChars: readonly string[],
 syllables: string[],
): string[] {
 const len = Math.min(chineseChars.length, syllables.length);

 for (let i = 0; i < len; i++) {
  const char = chineseChars[i];
  if (!char) continue;

  const grammarPinyin = getGrammarPinyin(chineseChars, i);
  if (grammarPinyin) {
   syllables[i] = grammarPinyin;
   continue;
  }
  const toneSandhiPinyin = getToneSandhiPinyin(chineseChars, i);
  if (toneSandhiPinyin) syllables[i] = toneSandhiPinyin;

  if (char === "地") {
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

   // Without positive grammatical evidence, keep the library/dictionary reading.
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
  } else if (char === "只") {
   const prev = chineseChars[i - 1];
   const next = chineseChars[i + 1];

   if ((prev && NUMBERS_BEFORE_ZHI.has(prev)) || (next && NOUNS_AFTER_ZHI.has(next))) {
    syllables[i] = "zhī";
   } else if (next && VERBS_AFTER_ZHI_ADVERB.has(next)) {
    syllables[i] = "zhǐ";
   }
  } else if (char === "为") {
   const prev = chineseChars[i - 1];
   const next = chineseChars[i + 1];

   if (prev && VERBS_BEFORE_WEI.has(prev)) {
    syllables[i] = "wéi";
   } else if (next && TARGETS_AFTER_WEI.has(next)) {
    syllables[i] = "wèi";
   }
  } else if (char === "长") {
   const prev = chineseChars[i - 1];
   const next = chineseChars[i + 1];

   if ((prev && DEGREE_BEFORE_CHANG.has(prev)) || (next && NOUNS_AFTER_CHANG.has(next))) {
    syllables[i] = "cháng";
   } else if ((prev && TITLES_BEFORE_ZHANG.has(prev)) || (next && VERBS_AFTER_ZHANG.has(next))) {
    syllables[i] = "zhǎng";
   }
  } else if (char === "还") {
   const prev = chineseChars[i - 1];
   const prevPrev = chineseChars[i - 2];
   const prev3 = chineseChars[i - 3];
   const next = chineseChars[i + 1];

   if (prev3 === "有" && prevPrev === "借" && prev === "有") {
    syllables[i] = "huán";
   } else if (next && TARGETS_AFTER_HUAN.has(next)) {
    syllables[i] = "huán";
   } else if (next && ADVERB_AFTER_HAI.has(next)) {
    syllables[i] = "hái";
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
  v: false,
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
 const wordSegments = [...new Intl.Segmenter("zh-CN", { granularity: "word" }).segment(chinese)];
 const lexicalErStarts = new Set(
  wordSegments.flatMap((item) =>
   /^儿[子女童歌科戏媳孙郎化音时]/u.test(item.segment) ? [item.index] : [],
  ),
 );
 for (const [index, char] of chars.entries()) {
  if (
   char === "儿" &&
   !lexicalErStarts.has(chars.slice(0, index).join("").length) &&
   ERHUA_WORDS.some((word) =>
    chars
     .slice(Math.max(0, index - 3), index + 1)
     .join("")
     .endsWith(word),
   )
  ) {
   syllables[index] = "r";
   // 儿子 must not consume the 子 of a following word (这儿 + 子弹).
   const followingWord = wordSegments.find(
    (item) => item.index === chars.slice(0, index + 1).join("").length,
   );
   if (followingWord !== undefined && /^[子女童歌科戏媳孙郎化音时]/u.test(followingWord.segment)) {
    const followingPinyin = POLYPHONIC_DICTIONARY[followingWord.segment];
    if (followingPinyin !== undefined) {
     for (const [offset, syllable] of followingPinyin.split(" ").entries()) {
      syllables[index + 1 + offset] = syllable;
     }
    }
   }
  }
 }

 // Detect polyphonic characters for warning flags
 const polyphonicIndices: number[] = [];
 for (let i = 0; i < chars.length; i++) {
  const char = chars[i];
  if (char && CHINESE_CHAR_REGEX.test(char) && isPolyphonicCharacter(char)) {
   polyphonicIndices.push(i);
  }
 }

 return {
  pinyin: syllables
   .map((syllable, index) =>
    index > 0 && !(chars[index] === "儿" && syllable === "r") ? ` ${syllable}` : syllable,
   )
   .join(""),
  syllables,
  polyphonicIndices,
 };
}
