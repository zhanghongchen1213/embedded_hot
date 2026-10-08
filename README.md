<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-176b75?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Node.js-24-176b75?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24">
  <img src="https://img.shields.io/badge/PostgreSQL-17-176b75?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 17">
  <img src="https://img.shields.io/badge/Docker-Compose-176b75?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
  <a href="https://embhot.zhcmqtt.top"><img src="https://img.shields.io/badge/%E7%BA%BF%E4%B8%8A-embhot.zhcmqtt.top-202a30?style=flat-square" alt="线上站点 embhot.zhcmqtt.top"></a>
</p>

<p align="center">
  <b>EmbHot — 嵌入式与具身智能行业动态。</b><br>
  从芯片原厂、机器人公司和开发者社区里挑出值得看的，把同一件事归到一起，每天早上出一份日报。
</p>

<p align="center">
  <b>简体中文</b> · <a href="README.en.md">English</a>
</p>

<p align="center">
  <a href="https://embhot.zhcmqtt.top">打开网站</a> ·
  <a href="#它盯什么">它盯什么</a> ·
  <a href="#它是怎么工作的">它是怎么工作的</a> ·
  <a href="#跑起来">跑起来</a> ·
  <a href="#文档">文档</a> ·
  <a href="#致谢">致谢</a>
</p>

<br>

## 这是什么

[EmbHot](https://embhot.zhcmqtt.top) 是一个给嵌入式工程师、固件与硬件开发者、做芯片选型的产品经理，以及关注具身智能的人看的行业动态站。

它盯着 MCU、SoC、开发板、RTOS、端侧 AI，以及人形机器人和具身模型。信源进来以后先判重、预筛；可能重要的独立打两次分，写成中文标题、摘要和推荐理由；不同来源说的同一件事聚成一个事件，按有多少人在说排进热点。分数过了门槛、又不是精选里已有新闻的重复，才进精选。

出刊时间是北京时间：每天 08:00 日报，每周一 10:00 周报，每月 1 日 10:30 月报。免费，不用注册。

引擎来自开源项目 [AIHOT](https://github.com/KKKKhazix/AIHOT)。这个仓库已经换成嵌入式与具身智能自己的站名、信源、分类、提示词和入选门槛。感谢见文末 [致谢](#致谢)。

## 它盯什么

首次启动会导入 [`industry/sources.json`](industry/sources.json) 里的 **95 个信源**：

| 类型 | 数量 | 在看什么 |
|---|---:|---|
| RSS | 32 | 官方 SDK 与内核的 GitHub Releases：乐鑫 ESP-IDF、先楫、恩智浦 MCUXpresso、树莓派内核、Zephyr、FreeRTOS、RT-Thread、NuttX 等 |
| 网页列表 | 31 | 芯片原厂与机器人公司的官网新闻：瑞芯微、兆易创新、意法半导体、恩智浦、乐鑫 Newsroom 等 |
| 微信公众号 | 31 | 嵌入式与开源硬件社区：芯板坊、立创开源、嵌入式专栏等 |
| JSON | 1 | Hugging Face 每日论文 |

信源分三级，各级入选门槛不同：官方一手（T1）52 个，官方账号与准官方（T1.5）28 个，媒体与个人（T2）15 个。默认只展示摘要和原文链接，全文归原作者。

分类在 [`industry/taxonomy.ts`](industry/taxonomy.ts)：芯片、具身智能、开发、行业、论文、教程、观点。主题目录有 43 个，分三组：

- **公司与机构**：乐鑫 / ESP32、意法半导体 / STM32、恩智浦、瑞芯微、NVIDIA / Jetson、树莓派、宇树、智元、Figure、特斯拉 Optimus 等
- **技术方向**：具身智能、人形机器人、VLA、灵巧操作、端侧 AI、RTOS、RISC-V、无线连接、传感器、供应链
- **内容形态**：芯片发布、产品更新、论文、评测、教程、观点、政策

## 它是怎么工作的

一条资料从信源进来，先判重，再预筛。可能重要的用同一份标准独立打两次分，写好中文标题、摘要和推荐理由，再和别的报道聚成事件、算进热度。每一步的提示词都在 [`industry/prompts/`](industry/prompts/)，改标准不用改代码。详见 [精选与校准](docs/selection.md)。

读者是做选型和写固件的人。评分看的是这件事今天值不值得被看见：芯片和整机的正式发布、量产转产、停产与替代、破坏性变更与迁移路径、勘误和安全漏洞、车规与互联认证、出口管制、能马上用的 SDK 和教程，按实际份量打分。展会预告、没有兑现物的合作通稿、只有概念视频的机器人、同一通稿的多家搬运，会被压住。标准全文在 [`industry/prompts/selection-score.md`](industry/prompts/selection-score.md)。

入选门槛（两次分的平均分）在 [`industry/selection.ts`](industry/selection.ts)：官方一手 56，官方账号与准官方 58，媒体与个人 60。一件事被 **10 家以上**不同信源报道时，相关报道自动进入精选——共识本身就是信号；这类内容仍进日报，不触发推送。

### 聚簇与热点

同一件事，官网发一篇、媒体转十篇，读者只需要看到一次。EmbHot 把它们聚成一个**事件**：先用标题摘要的向量（没配向量服务时比文字重合度）在最近两周里找候选，再让模型判断是同一件事、后续进展，还是两件事；拿不准的合并，写入前再复核一遍（复核可以单独换模型，设 `GROUP_REVIEW_MODEL`）。

**热度按事件算，不按文章算。** 统计窗口是过去 **7 天**——这个行业的新闻发酵慢，两天会漏掉真正的热点。窗口内每个独立来源只算一次，24 小时减半。重复抓取不会多算，一家媒体发十篇也只算一次。和 6 小时前比，涨得快的标上升，新出现的标「新」。

### 你会在站上看到什么

| | |
|---|---|
| **精选** | 预筛之后独立打两次分，再按信源分级的门槛入选。同一条新闻只占一条 |
| **写作** | 中文标题、答案先行的摘要、推荐理由；分类、标签和新闻事实单独抽取。外文会翻译 |
| **事件** | 多来源归成一个事件，后续进展挂在下面，事件页有综述。人工改过的归属不会被覆盖 |
| **热点** | 过去 7 天、按独立来源计热度，24 小时半衰期 |
| **日报、周报、月报** | 每天 08:00 日报，按规则编出当天要闻：一件事一条，报过的事只在有新进展时跟进。每周一 10:00 周报、每月 1 日 10:30 月报，从日报里汇编，模型只写总述和栏目导读。时间在 `site/site.ts` 的 `EDITION_TIMES` |
| **主题与搜索** | 公司、方向、内容形态三类主题页；标题摘要搜索和全文相关搜索 |
| **给 Agent 用** | RSS（精选、全部、全文、日报、周报、月报）、公开 API、MCP（工具名前缀 `embhot_`）、Agent Markdown、`llms.txt` |
| **后台** | 信源管理与试抓、内容诊断、精选评测、每一步单独换模型、付费服务的预算熔断、运行记录与告警 |

## 跑起来

需要 [Docker](https://docs.docker.com/get-started/get-docker/)、[Node.js 24](https://nodejs.org/en/download)，和一个 OpenAI 兼容的模型 API Key（DeepSeek、千问、智谱都可以）。

`init-env` 默认按 DeepSeek 配置。用别家时，照 `.env.example` 改 `LLM_BASE_URL`、`LLM_MODEL` 和 `LLM_EXTRA_JSON`；推理模型还要设 `LLM_REASONING_TOKENS`。

```bash
git clone https://github.com/zhanghongchen1213/embedded_hot.git
cd embedded_hot
node scripts/init-env.ts --llm-key <你的模型 API Key>
docker compose up -d --build
```

打开 <http://localhost:3000>。后台在 `/admin`，管理员密码在 `.env` 的 `ADMIN_PASSWORD` 里。一两分钟后开始有内容；第一次导入的资料要逐条预筛、评分、写作和归组，大约半小时处理完。

站点跑起来后，打开 `/agent` 可以复制 MCP、RSS 或 API 的接入方式。接口说明在 `/openapi-v1.json`。

线上站是 <https://embhot.zhcmqtt.top>。用宝塔面板部署的步骤在 [宝塔部署](docs/deploy-baota.md)；域名、HTTPS、中国大陆、备份和不用 Docker 的跑法在 [部署](docs/deploy.md)。

## 改这个站

站名、文案和品牌在 [`site/`](site/)，行业知识在 [`industry/`](industry/)。框架代码一般不用动；只有这个站要的功能，做成模块放进 `modules/`。

| 文件 | 改什么 |
|---|---|
| `site/site.ts` | 站名、行业词、出刊时间、首页和关于页文案 |
| `industry/taxonomy.ts`、`industry/topics.json` | 分类、标签、公司名录、主题页 |
| `industry/sources.json` | 首次启动时导入的信源。已经导入过的站，之后在后台改 |
| `industry/prompts/` | 精选标准和写作要求 |
| `industry/selection.ts` | 入选门槛，以及多少家信源共识后保送精选 |
| `site/models.ts` | 每一步默认用哪个模型。不改的话，都用 `.env` 里那一个 |
| `site/brand/`、`site/pages/`、`site/public/`、`site/changelog.json` | 图标与 Logo、使用规则和隐私说明、网站根目录文件、更新日志 |

改完评分标准或门槛后，用自己标注的样本跑 `scripts/eval-selection.ts` 再决定上线。步骤在 [精选与校准](docs/selection.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [信源](docs/sources.md) | 信源怎么配，分级和全文，抓取频率，外部推送 |
| [精选与校准](docs/selection.md) | 一条资料怎么变成精选、怎么编进日报周报月报，怎么用自己的样本校准 |
| [事件归组与关系评测](docs/grouping.md) | 事件关系怎么判断，怎么用成对样本评测 |
| [综述评测](docs/story-digest-evaluation.md) | 改事件综述提示词前，怎么在同一批事件上并排比较 |
| [部署](docs/deploy.md) | Docker、域名和 HTTPS、更新、备份 |
| [宝塔部署](docs/deploy-baota.md) | 用宝塔面板把本站部署到 embhot.zhcmqtt.top |
| [架构](docs/architecture.md) | 三个进程、目录、模块、数据库迁移、对外出口 |
| [更新日志](site/changelog.json) | 这个站上线后的改动 |

技术栈：Node.js 24 · TypeScript · React Router（服务端渲染）· Fastify · PostgreSQL · pg-boss · Tailwind CSS · Docker Compose。

## 致谢

EmbHot 的采集、精选、聚簇、热度、成刊、网站、后台和公开接口，来自 [AIHOT](https://github.com/KKKKhazix/AIHOT)。AIHOT 由[数字生命卡兹克](https://github.com/KKKKhazix)开发并开源，线上原站是 [aihot.news](https://aihot.news)。代码使用 [MIT 许可证](LICENSE)，版权归数字生命卡兹克。

谢谢他把这套引擎公开出来。没有这份开源，就没有这个站。

本站在此之上做的，是嵌入式与具身智能自己的部分：信源名单、分类和公司名录、主题、提示词、入选门槛，以及站名 EmbHot 和品牌。请使用本站自己的名字和标识。AIHOT 的名字和 Logo 不在 MIT 许可范围内，不要用到本站或衍生产物上。

框架本身的问题与想法，可以到 [AIHOT 的讨论区](https://github.com/KKKKhazix/AIHOT/discussions)和 [Issue](https://github.com/KKKKhazix/AIHOT/issues) 反馈。安全漏洞的报告方式见 [SECURITY.md](SECURITY.md)。

## 许可

代码使用 [MIT 许可证](LICENSE)（Copyright (c) 2026 数字生命卡兹克）。AIHOT 的名字和 Logo 不在许可范围内。字体有自己的许可，见 [NOTICE](NOTICE)。

信源内容的版权归各来源所有。本站默认只做摘要和原文链接。
