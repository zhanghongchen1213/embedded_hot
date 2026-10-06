// 这个行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（教程、观点）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "chip", label: "芯片", feedLabel: "芯片与器件", section: "芯片发布/更新", guide: "芯片与器件本身的发布和重大变化：新 MCU、SoC、NPU、射频与无线模组、传感器件的正式发布，既有芯片的封装/主频/存储变体，芯片配套 SDK 或工具链的大版本，勘误（errata）、停产停售、供货周期与价格变化，以及既有芯片的跑分成绩。开发板和参考设计归开发，机器人整机归具身智能，泛泛的产业经营新闻归行业。" },
  { key: "robotics", label: "具身智能", feedLabel: "具身智能", section: "机器人与具身智能", guide: "机器人整机与具身智能：人形、四足、机械臂、灵巧手等整机的发布与迭代，量产交付与真实场景部署，具身大模型（VLA）与机器人基础模型的发布或开源，机器人操作系统、仿真与数据采集平台，赛事成绩与行业标准的落地。机器人用芯片的供应链消息归芯片，纯产业经营新闻归行业。" },
  { key: "dev", label: "开发", feedLabel: "开发与生态", section: "开发与生态", guide: "嵌入式开发工具与生态：RTOS 与软件框架的大版本、治理或许可证变化，开发板与参考设计发布，IDE/编译器/调试器/烧录器等工具，驱动与 BSP，开源项目里程碑，固件安全漏洞（CVE）与修复，开发者社区与文档生态的大事。可照着做的实操归教程，单一芯片或模组的发布归芯片。" },
  { key: "industry", label: "行业", feedLabel: "行业动态", section: "行业动态", guide: "已发生的公司经营、融资并购上市、人事、合作、量产订单、产能与供应链、诉讼、政策监管、真实安全事故及调查进展。新闻由当事人发帖、带有态度，也不因此变成观点。" },
  { key: "paper", label: "论文", feedLabel: "论文", section: "论文研究", guide: "以新研究方法、实验设计与发现为核心的论文、技术报告、新基准或研究数据集：操作泛化、导航、灵巧操作、端侧推理效率等方向的研究突破。工程产物（直接可用的框架、数据集发布）按可复用价值归开发或具身智能；既有榜单成绩归芯片；真实事故的新闻调查归行业。" },
  { key: "tip", label: "教程", section: "技巧与观点", guide: "读者可以照着使用的方法、工具用法、外设驱动与调试实践、开发环境搭建、工程复盘和板卡上手评测。重点是可复用的做法；单纯发布工具归开发，只有态度和预测而无做法归观点。", commentary: true },
  { key: "opinion", label: "观点", section: "技巧与观点", guide: "重点是作者的解释、判断、主张、预测、评论或访谈观点。讨论市场不自动归行业，作者是名人不自动归观点。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（本行业是芯片发布）：日报报头的“N 款新芯片”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "chip", tag: "芯片发布", unit: "款新芯片" };

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["ai", "api", "mcu", "soc", "sdk", "bsp", "rtos", "npu", "gpu", "fpga", "dsp", "riscv", "ros", "vla", "gpio", "i2c", "spi", "can", "usb", "uart", "wifi", "ble", "lora", "zigbee", "ota", "ide", "hal", "pwm", "emmc", "aiot", "llm", "ceo", "ipo", "oem"];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 * key 是框架内部标识，保持原名不改（改 key 要同步权重表、类型定义和校验代码）；
 * 本行业的语义：model_release=芯片/模组/机器人整机的正式发布，product_launch=开发板/工具/平台等可使用产品，
 * tool_or_prompt=可直接复用的技巧/配置/脚本，research_paper=论文研究，industry_event=行业事件，
 * opinion_analysis=观点，tutorial_explainer=教程与评测。
 */
export const ITEM_TYPES = ["model_release", "product_launch", "tool_or_prompt", "research_paper", "industry_event", "opinion_analysis", "tutorial_explainer"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "芯片发布", "产品更新", "固件/SDK", "开发板", "开源/仓库", "论文/研究", "教程/实践", "评测/基准", "安全漏洞", "行业动态", "政策/监管",
  "现象/趋势", "大佬观点", "其他",
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "具身智能", "人形机器人", "灵巧操作", "VLA", "端侧AI", "RTOS", "RISC-V", "无线连接", "传感器", "工具链", "开源生态", "供应链",
] as const;

/** 可选的实体标签（公司、机构、平台）。 */
export const ENTITY_TAGS = ["乐鑫", "瑞芯微", "ST", "NXP", "NVIDIA", "树莓派", "宇树", "智元", "优必选", "Figure", "Boston Dynamics", "特斯拉"] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  固件: "固件/SDK", "固件更新": "固件/SDK", "固件/驱动": "固件/SDK", sdk: "固件/SDK", bsp: "固件/SDK", 驱动: "固件/SDK", 工具链: "固件/SDK", "toolchain": "固件/SDK",
  芯片: "芯片发布", mcu: "芯片发布", soc: "芯片发布", 发布: "芯片发布", 新品: "芯片发布", 流片: "芯片发布", 量产: "行业动态",
  "开发板": "开发板", "评估板": "开发板", "单板机": "开发板", sbc: "开发板",
  "教程/玩法": "教程/实践", "技巧/最佳实践": "教程/实践", "合作/生态": "行业动态", "融资/收购": "行业动态", "公司动态": "行业动态",
  合作: "行业动态", 生态: "行业动态", 融资: "行业动态", 收购: "行业动态", 投资: "行业动态", 并购: "行业动态", 订单: "行业动态", 产能: "行业动态",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", "出口管制": "政策/监管",
  安全: "安全漏洞", 漏洞: "安全漏洞", cve: "安全漏洞", errata: "安全漏洞", 勘误: "安全漏洞", "漏洞利用": "安全漏洞",
  论文: "论文/研究", 研究: "论文/研究", paper: "论文/研究", papers: "论文/研究",
  "open-source": "开源/仓库", 开源: "开源/仓库", 仓库: "开源/仓库", repo: "开源/仓库",
  教程: "教程/实践", 玩法: "教程/实践", 指南: "教程/实践", 技巧: "教程/实践", 最佳实践: "教程/实践", 实践: "教程/实践", 上手: "教程/实践",
  评测: "评测/基准", 跑分: "评测/基准", benchmark: "评测/基准", 对比测试: "评测/基准",
  产品: "产品更新", 更新: "产品更新", 趋势: "现象/趋势", 现象: "现象/趋势", 观点: "大佬观点",
  embodied: "具身智能", "embodied-ai": "具身智能", "embodied ai": "具身智能", humanoid: "人形机器人", "humanoid robot": "人形机器人",
  rtos: "RTOS", zephyr: "RTOS", freertos: "RTOS", "rt-thread": "RTOS", nuttx: "RTOS",
  端侧: "端侧AI", "edge-ai": "端侧AI", "edge ai": "端侧AI", "on-device": "端侧AI",
  riscv: "RISC-V", "risc-v": "RISC-V",
  行业: "行业动态", 动态: "行业动态",
};

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/**
 * 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看；otherNames 是公司自己的其他称呼（官方账号名、子品牌），
 * 把事实的主体对到发布方时也认它们。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  // ── 国内芯片原厂 ──
  espressif: { name: "乐鑫", displayTag: "乐鑫", aliases: ["Espressif", "乐鑫", "ESP32", "ESP8266", "ESP-IDF", "ESP32-S3", "ESP32-C6", "ESP32-P4"], otherNames: ["乐鑫科技", "Espressif Systems", "乐鑫信息科技"] },
  "t-head": { name: "平头哥", displayTag: null, aliases: ["T-Head", "平头哥", "玄铁", "XuanTie", "曳影1520", "无剑"], otherNames: ["阿里平头哥", "平头哥半导体", "T-Head Semiconductors", "玄铁官方"] },
  gigadevice: { name: "兆易创新", displayTag: null, aliases: ["GigaDevice", "兆易创新", "GD32"], otherNames: ["兆易创新科技集团", "GigaDevice Semiconductor"] },
  nations: { name: "国民技术", displayTag: null, aliases: ["Nations Technologies", "国民技术", "N32"], otherNames: ["国民技术股份有限公司"] },
  hpmicro: { name: "先楫", displayTag: null, aliases: ["HPMicro", "先楫", "HPM", "HPM6750", "HPM6E00"], otherNames: ["先楫半导体", "上海先楫半导体"] },
  allwinner: { name: "全志", displayTag: null, aliases: ["Allwinner", "全志", "sunxi", "H616", "A527"], otherNames: ["全志科技", "珠海全志科技"] },
  hisilicon: { name: "海思", displayTag: null, aliases: ["HiSilicon", "海思"], otherNames: ["华为海思", "HiSilicon Technologies"] },
  rockchip: { name: "瑞芯微", displayTag: "瑞芯微", aliases: ["Rockchip", "瑞芯微", "RK3588", "RK3568", "RK3576", "RV1106"], otherNames: ["瑞芯微电子", "福州瑞芯微电子"] },
  luat: { name: "合宙", displayTag: null, aliases: ["Luat", "合宙", "LuatOS", "Air724", "Air780", "Air001"], otherNames: ["合宙通信", "上海合宙通信", "Luat 合宙"] },
  canaan: { name: "嘉楠", displayTag: null, aliases: ["Canaan", "嘉楠", "Kendryte", "K210", "K230"], otherNames: ["嘉楠科技", "嘉楠耘智", "Canaan Creative"] },
  sophgo: { name: "算能", displayTag: null, aliases: ["Sophgo", "算能", "SG2042", "BM1684", "BM1688"], otherNames: ["算能科技", "SOPHGO"] },
  wch: { name: "沁恒", displayTag: null, aliases: ["WCH", "沁恒", "CH32V", "CH32V003", "CH32V307", "CH559"], otherNames: ["沁恒微电子", "南京沁恒微电子"] },
  hdsc: { name: "华大半导体", displayTag: null, aliases: ["HDSC", "华大半导体", "HC32", "小华"], otherNames: ["小华半导体", "XHSC"] },
  cwsemi: { name: "武汉芯源", displayTag: null, aliases: ["CW32", "武汉芯源"], otherNames: ["武汉芯源半导体"] },
  spacemit: { name: "进迭时空", displayTag: null, aliases: ["SpacemiT", "进迭时空", "K1", "MUSE Book"], otherNames: ["进迭时空计算机科技", "BianBu"] },
  bouffalo: { name: "博流", displayTag: null, aliases: ["BouffaloLab", "博流", "BL616", "BL808", "BL618"], otherNames: ["博流智能", "博流智能科技"] },
  sifli: { name: "思澈", displayTag: null, aliases: ["SiFli", "思澈", "SF32"], otherNames: ["思澈科技", "SiFli Technologies"] },
  artinchip: { name: "匠芯创", displayTag: null, aliases: ["ArtInChip", "匠芯创", "luban-lite", "D211"], otherNames: ["匠芯创科技", "深圳匠芯创科技"] },
  // ── 国际芯片原厂 ──
  st: { name: "ST", displayTag: "ST", aliases: ["STMicroelectronics", "意法半导体", "STM32", "STM32H7", "STM32N6", "STM8"], otherNames: ["意法半导体"] },
  nxp: { name: "NXP", displayTag: "NXP", aliases: ["NXP", "恩智浦", "i.MX", "LPC", "MCUXpresso", "S32K", "KW45"], otherNames: ["恩智浦半导体", "NXP Semiconductors"] },
  microchip: { name: "Microchip", displayTag: null, aliases: ["Microchip", "微芯科技", "PIC32", "AVR", "SAM", "PolarFire"], otherNames: ["Microchip Technology", "微芯"] },
  ti: { name: "TI", displayTag: null, aliases: ["Texas Instruments", "德州仪器", "MSPM0", "Sitara", "SimpleLink", "CC1352"], otherNames: ["德州仪器", "TI"] },
  renesas: { name: "瑞萨", displayTag: null, aliases: ["Renesas", "瑞萨", "RA8", "RZ", "RX"], otherNames: ["瑞萨电子"] },
  nvidia: { name: "NVIDIA", displayTag: "NVIDIA", aliases: ["NVIDIA", "英伟达", "Jetson", "Orin", "Thor", "Isaac", "CUDA"], otherNames: ["英伟达"] },
  qualcomm: { name: "高通", displayTag: null, aliases: ["Qualcomm", "高通", "Snapdragon", "骁龙", "RB5", "QCS"], otherNames: ["Qualcomm Technologies"] },
  raspberrypi: { name: "树莓派", displayTag: "树莓派", aliases: ["Raspberry Pi", "树莓派", "RP2040", "RP2350", "Pico", "Pi 5"], otherNames: ["Raspberry Pi Holdings", "Raspberry Pi Foundation"] },
  broadcom: { name: "Broadcom", displayTag: null, aliases: ["Broadcom", "博通", "BCM2712"], otherNames: ["博通"] },
  // ── 国内具身智能 ──
  unitree: { name: "宇树", displayTag: "宇树", aliases: ["Unitree", "宇树", "Go2", "G1", "H1", "H2", "R1", "B2"], otherNames: ["宇树科技", "Unitree Robotics", "杭州宇树科技"] },
  agibot: { name: "智元", displayTag: "智元", aliases: ["AgiBot", "智元", "远征A2", "灵犀X2", "AgiBot World"], otherNames: ["智元机器人", "AGIBOT", "上海智元新创"] },
  ubtech: { name: "优必选", displayTag: "优必选", aliases: ["UBTECH", "优必选", "Walker", "Walker S1", "Walker S2", "天工行者"], otherNames: ["优必选科技", "UBTech Robotics", "深圳市优必选科技"] },
  fourier: { name: "傅利叶", displayTag: null, aliases: ["Fourier", "傅利叶", "GR-1", "GR-2", "GR-3"], otherNames: ["傅利叶智能", "Fourier Intelligence", "上海傅利叶智能"] },
  galbot: { name: "银河通用", displayTag: null, aliases: ["Galbot", "银河通用", "Galbot G1", "盖朵"], otherNames: ["银河通用机器人", "北京银河通用机器人"] },
  robotera: { name: "星动纪元", displayTag: null, aliases: ["Robot Era", "星动纪元", "STAR1", "X1"], otherNames: ["星动纪元科技", "北京星动纪元科技"] },
  limx: { name: "逐际动力", displayTag: null, aliases: ["LimX Dynamics", "逐际动力", "CL-1", "CL-2", "Tron1"], otherNames: ["深圳逐际动力科技"] },
  booster: { name: "加速进化", displayTag: null, aliases: ["Booster Robotics", "加速进化", "Booster T1"], otherNames: ["北京加速进化科技"] },
  noetix: { name: "松延动力", displayTag: null, aliases: ["Noetix", "松延动力", "N2", "E1", "Bumi"], otherNames: ["北京松延动力科技", "NOETIX"] },
  "spirit-ai": { name: "千寻智能", displayTag: null, aliases: ["Spirit AI", "千寻智能", "Mojoco"], otherNames: ["千寻智能科技", "SPIRIT AI"] },
  galaxea: { name: "星海图", displayTag: null, aliases: ["Galaxea", "星海图", "Galaxea R1", "A1"], otherNames: ["星海图（苏州）科技"] },
  "x-square": { name: "自变量", displayTag: null, aliases: ["X Square Robot", "自变量", "WALL-A", "WALL-B", "WALL-O"], otherNames: ["自变量机器人", "自变量机器人科技"] },
  tarsrobotics: { name: "它石智航", displayTag: null, aliases: ["TARS Robot", "它石智航", "TARS"], otherNames: ["它石智航科技", "TARS Robotics"] },
  noematrix: { name: "穹彻", displayTag: null, aliases: ["Noematrix", "穹彻", "Noematrix Brain"], otherNames: ["穹彻智能", "穹彻智能科技"] },
  kepler: { name: "开普勒", displayTag: null, aliases: ["Kepler Robotics", "开普勒", "先行者", "K1", "S1"], otherNames: ["开普勒机器人", "深圳开普勒机器人"] },
  leju: { name: "乐聚", displayTag: null, aliases: ["Leju Robotics", "乐聚", "夸父", "Kuavo"], otherNames: ["乐聚机器人", "深圳市乐聚机器人"] },
  "digital-china": { name: "数字华夏", displayTag: null, aliases: ["数字华夏", "夏澜"], otherNames: ["数字华夏（深圳）科技"] },
  "ai2-robotics": { name: "智平方", displayTag: null, aliases: ["AI2 Robotics", "智平方", "Alpha Bot", "爱宝"], otherNames: ["智平方（深圳）科技"] },
  linkerbot: { name: "灵心巧手", displayTag: null, aliases: ["灵心巧手", "LinkerBot"], otherNames: ["灵心巧手（北京）科技"] },
  paxini: { name: "帕西尼", displayTag: null, aliases: ["PaXini", "帕西尼", "TORA-ONE", "多维触觉"], otherNames: ["帕西尼感知", "帕西尼感知科技"] },
  deeprobotics: { name: "云深处", displayTag: null, aliases: ["DeepRobotics", "云深处", "绝影", "X30", "山猫"], otherNames: ["云深处科技", "杭州云深处科技"] },
  tashan: { name: "他山科技", displayTag: null, aliases: ["他山科技", "TS3F", "触觉芯片"], otherNames: ["北京他山科技"] },
  // ── 国际具身智能 ──
  figure: { name: "Figure", displayTag: "Figure", aliases: ["Figure AI", "Figure", "Figure 02", "Figure 03", "Helix"], otherNames: ["Figure AI Inc."] },
  tesla: { name: "特斯拉 Optimus", displayTag: "特斯拉", aliases: ["Tesla Optimus", "Optimus", "特斯拉", "Tesla Bot"], otherNames: ["Tesla AI", "Tesla"] },
  "boston-dynamics": { name: "波士顿动力", displayTag: "Boston Dynamics", aliases: ["Boston Dynamics", "波士顿动力", "Atlas", "Spot", "Stretch"], otherNames: ["Boston Dynamics AI Institute", "丰田研究院"] },
  "1x": { name: "1X", displayTag: null, aliases: ["1X Technologies", "1X", "NEO", "EVE"], otherNames: ["1X Robotics"] },
  apptronik: { name: "Apptronik", displayTag: null, aliases: ["Apptronik", "Apollo"], otherNames: ["Apptronik Systems"] },
  sanctuary: { name: "Sanctuary AI", displayTag: null, aliases: ["Sanctuary AI", "Phoenix"], otherNames: ["Sanctuary Cognitive Systems"] },
  "physical-intelligence": { name: "Physical Intelligence", displayTag: null, aliases: ["Physical Intelligence", "π0", "pi0", "openpi", "π0.5"], otherNames: ["PI", "Physical Intelligence Co."] },
  skild: { name: "Skild AI", displayTag: null, aliases: ["Skild AI", "Skild", "Skild Brain"], otherNames: ["Skild.ai"] },
  "field-ai": { name: "Field AI", displayTag: null, aliases: ["Field AI"], otherNames: ["FieldAI"] },
  dexterity: { name: "Dexterity", displayTag: null, aliases: ["Dexterity (company)"], otherNames: ["Dexterity Inc."] },
  "robust-ai": { name: "Robust AI", displayTag: null, aliases: ["Robust AI", "Carter"], otherNames: ["Robust.AI"] },
  "standard-bots": { name: "Standard Bots", displayTag: null, aliases: ["Standard Bots", "RO1"], otherNames: ["StandardBots"] },
  agility: { name: "Agility Robotics", displayTag: null, aliases: ["Agility Robotics", "Digit"], otherNames: ["Agility Inc."] },
};

/**
 * 身份词典：摘要和标题里出现的公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 行业没有这个问题时可以留空数组。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "espressif", name: "乐鑫", patterns: [/espressif|乐鑫|\besp32|\besp8266|\besp-idf|\besptool/i] },
  { id: "rockchip", name: "瑞芯微", patterns: [/rockchip|瑞芯微|\brk35\d\d\b|\brk3576\b|\brv11\d\d/i] },
  { id: "st", name: "意法半导体", patterns: [/stmicroelectronics|意法半导体|\bstm32|\bstm8\b|\bstm32n6/i] },
  { id: "nxp", name: "恩智浦", patterns: [/\bnxp\b|恩智浦|\bi\.mx\s?[789]?\b|\bmcuxpresso\b|\bs32k\d/i] },
  { id: "microchip", name: "Microchip", patterns: [/microchip|微芯科技|\bpic32|\bpolarfire\b|\bsamd\d\d/i] },
  { id: "ti", name: "德州仪器", patterns: [/texas\s?instruments|德州仪器|\bmspm0|\bsitara\b|\bsimplelink\b|\bcc13\d\d/i] },
  { id: "renesas", name: "瑞萨", patterns: [/renesas|瑞萨|\bra8[mp]?\d/i] },
  { id: "nvidia", name: "NVIDIA", patterns: [/nvidia|英伟达|\bjetson\b|\borin\b|\bisaac\s?(?:lab|sim|ros|mx)\b|\bthor\b/i] },
  { id: "qualcomm", name: "高通", patterns: [/qualcomm|高通|骁龙|snapdragon|\brb[35]\s?(?:platform|kit|dev)?\b/i] },
  { id: "raspberrypi", name: "树莓派", patterns: [/raspberry\s?pi|树莓派|\brp2040\b|\brp2350\b/i] },
  { id: "broadcom", name: "Broadcom", patterns: [/broadcom|博通|\bbcm\d{4}/i] },
  { id: "gigadevice", name: "兆易创新", patterns: [/gigadevice|兆易创新|\bgd32/i] },
  { id: "hpmicro", name: "先楫", patterns: [/hpmicro|先楫|\bhpm\d{4}/i] },
  { id: "wch", name: "沁恒", patterns: [/沁恒|\bch32/i] },
  { id: "sophgo", name: "算能", patterns: [/sophgo|算能|\bsg204\d/i] },
  { id: "canaan", name: "嘉楠", patterns: [/canaan|嘉楠|kendryte|\bk23[00]\b/i] },
  { id: "spacemit", name: "进迭时空", patterns: [/spacemit|进迭时空/i] },
  { id: "bouffalo", name: "博流", patterns: [/bouffalo|博流|\bbl61[68]\b|\bbl808\b/i] },
  { id: "sifli", name: "思澈", patterns: [/sifli|思澈|\bsf32/i] },
  { id: "artinchip", name: "匠芯创", patterns: [/artinchip|匠芯创/i] },
  { id: "t-head", name: "平头哥", patterns: [/t-head|平头哥|玄铁|xuantie/i] },
  { id: "allwinner", name: "全志", patterns: [/allwinner|全志|sunxi/i] },
  { id: "luat", name: "合宙", patterns: [/合宙|\bluatos?\b/i] },
  { id: "hisilicon", name: "海思", patterns: [/hisilicon|海思/i] },
  { id: "unitree", name: "宇树", patterns: [/unitree|宇树/i] },
  { id: "agibot", name: "智元", patterns: [/agibot|智元/i] },
  { id: "ubtech", name: "优必选", patterns: [/ubtech|优必选|walker\s?s?\d/i] },
  { id: "figure", name: "Figure", patterns: [/figure\s?ai|\bfigure\s?0[23]\b/i] },
  { id: "tesla", name: "特斯拉", patterns: [/optimus|tesla\s?(?:ai|bot|optimus)/i] },
  { id: "boston-dynamics", name: "波士顿动力", patterns: [/boston\s?dynamics|波士顿动力/i] },
  { id: "1x", name: "1X", patterns: [/1x\s?technologies/i] },
  { id: "apptronik", name: "Apptronik", patterns: [/apptronik/i] },
  { id: "sanctuary", name: "Sanctuary AI", patterns: [/sanctuary\s?ai/i] },
  { id: "physical-intelligence", name: "Physical Intelligence", patterns: [/physical\s?intelligence|\bπ0|\bpi0\.?\d?\b|openpi/i] },
  { id: "skild", name: "Skild AI", patterns: [/skild/i] },
  { id: "field-ai", name: "Field AI", patterns: [/field\s?ai/i] },
  { id: "robust-ai", name: "Robust AI", patterns: [/robust\.?ai/i] },
  { id: "standard-bots", name: "Standard Bots", patterns: [/standard\s?bots/i] },
  { id: "agility", name: "Agility Robotics", patterns: [/agility\s?robotics|\bdigit\s?(?:robot|humanoid)?/i] },
  { id: "fourier", name: "傅利叶", patterns: [/fourier\s?intelligence|傅利叶|\bgr-[123]\b/i] },
  { id: "galbot", name: "银河通用", patterns: [/galbot|银河通用/i] },
  { id: "limx", name: "逐际动力", patterns: [/limx|逐际动力|tron1/i] },
  { id: "deeprobotics", name: "云深处", patterns: [/deeprobotics|云深处|绝影/i] },
  { id: "paxini", name: "帕西尼", patterns: [/paxini|帕西尼|\btora-one\b/i] },
  { id: "leju", name: "乐聚", patterns: [/leju|乐聚|\bkuavo\b|夸父/i] },
];

/** 这些域名上的文章，发布方就是对应的公司（托管平台如 GitHub、arXiv 不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "espressif", domains: ["espressif.com"] },
  { entityId: "t-head", domains: ["t-head.cn", "occ.t-head.cn"] },
  { entityId: "gigadevice", domains: ["gigadevice.com"] },
  { entityId: "nations", domains: ["nationstech.com"] },
  { entityId: "hpmicro", domains: ["hpmicro.com"] },
  { entityId: "allwinner", domains: ["allwinnertech.com"] },
  { entityId: "hisilicon", domains: ["hisilicon.com"] },
  { entityId: "rockchip", domains: ["rock-chips.com"] },
  { entityId: "luat", domains: ["luatos.com", "airspacex.com"] },
  { entityId: "canaan", domains: ["canaan-creative.com"] },
  { entityId: "sophgo", domains: ["sophgo.com", "developer.sophgo.com"] },
  { entityId: "wch", domains: ["wch.cn", "wch-ic.com"] },
  { entityId: "hdsc", domains: ["hdsc.com", "xhsc.com.cn"] },
  { entityId: "spacemit", domains: ["spacemit.com"] },
  { entityId: "bouffalo", domains: ["bouffalolab.com"] },
  { entityId: "sifli", domains: ["sifli.com"] },
  { entityId: "artinchip", domains: ["artinchip.com"] },
  { entityId: "st", domains: ["st.com", "newsroom.st.com"] },
  { entityId: "nxp", domains: ["nxp.com", "media.nxp.com"] },
  { entityId: "microchip", domains: ["microchip.com"] },
  { entityId: "ti", domains: ["ti.com", "newsroom.ti.com"] },
  { entityId: "renesas", domains: ["renesas.com"] },
  { entityId: "nvidia", domains: ["nvidia.com", "developer.nvidia.com"] },
  { entityId: "qualcomm", domains: ["qualcomm.com", "developer.qualcomm.com"] },
  { entityId: "raspberrypi", domains: ["raspberrypi.com"] },
  { entityId: "unitree", domains: ["unitree.com"] },
  { entityId: "agibot", domains: ["agibot.com", "zhiyuan-robot.com"] },
  { entityId: "ubtech", domains: ["ubtrobot.com"] },
  { entityId: "fourier", domains: ["fftai.com"] },
  { entityId: "galbot", domains: ["galbot.com"] },
  { entityId: "robotera", domains: ["robotera.com"] },
  { entityId: "limx", domains: ["limxdynamics.com"] },
  { entityId: "booster", domains: ["booster.tech"] },
  { entityId: "noetix", domains: ["noetixrobotics.com"] },
  { entityId: "spirit-ai", domains: ["spirit-ai.com"] },
  { entityId: "galaxea", domains: ["galaxea.ai"] },
  { entityId: "x-square", domains: ["x2robot.com"] },
  { entityId: "noematrix", domains: ["noematrix.com"] },
  { entityId: "kepler", domains: ["keplerrobotics.com"] },
  { entityId: "leju", domains: ["lejugym.com"] },
  { entityId: "ai2-robotics", domains: ["ai2robotics.com"] },
  { entityId: "paxini", domains: ["paxini.com"] },
  { entityId: "deeprobotics", domains: ["deeprobotics.cn"] },
  { entityId: "figure", domains: ["figure.ai"] },
  { entityId: "tesla", domains: ["tesla.com"] },
  { entityId: "boston-dynamics", domains: ["bostondynamics.com"] },
  { entityId: "1x", domains: ["1x.tech"] },
  { entityId: "apptronik", domains: ["apptronik.com"] },
  { entityId: "sanctuary", domains: ["sanctuary.ai"] },
  { entityId: "physical-intelligence", domains: ["physicalintelligence.company"] },
  { entityId: "skild", domains: ["skild.ai"] },
  { entityId: "field-ai", domains: ["fieldai.com"] },
  { entityId: "dexterity", domains: ["dexterity.ai"] },
  { entityId: "robust-ai", domains: ["robust.ai"] },
  { entityId: "standard-bots", domains: ["standardbots.com"] },
  { entityId: "agility", domains: ["agilityrobotics.com"] },
];

/** 原文里的这些写法也算提到了对应公司。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "boston-dynamics", pattern: /\bBostonDynamics\b/ },
  { entityId: "physical-intelligence", pattern: /@physical_int/i },
];
