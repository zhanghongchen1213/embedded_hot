<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-176b75?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Node.js-24-176b75?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24">
  <img src="https://img.shields.io/badge/PostgreSQL-17-176b75?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 17">
  <img src="https://img.shields.io/badge/Docker-Compose-176b75?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
  <a href="https://embhot.zhcmqtt.top"><img src="https://img.shields.io/badge/live-embhot.zhcmqtt.top-202a30?style=flat-square" alt="Live site embhot.zhcmqtt.top"></a>
</p>

<p align="center">
  <b>EmbHot — news for embedded systems and embodied AI.</b><br>
  It picks what is worth reading from chip vendors, robotics companies, and developer communities, groups reports of the same story, and publishes a daily briefing each morning.
</p>

<p align="center">
  <a href="README.md">简体中文</a> · <b>English</b>
</p>

<p align="center">
  <a href="https://embhot.zhcmqtt.top">Open the site</a> ·
  <a href="#what-it-watches">What it watches</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#run-it">Run it</a> ·
  <a href="#documentation">Documentation</a> ·
  <a href="#acknowledgements">Acknowledgements</a>
</p>

<br>

## What this is

[EmbHot](https://embhot.zhcmqtt.top) is an industry news site for embedded engineers, firmware and hardware developers, product managers choosing chips, and people following embodied AI.

It watches MCUs, SoCs, dev boards, RTOSes, on-device AI, humanoid robots, and robot foundation models. Incoming items are deduplicated and prefiltered. Promising ones are scored twice, independently, then written up as a Chinese headline, summary, and reason to read. Reports of the same story become one event, ranked by how many distinct sources are talking about it. An item enters the selection only when its score clears the threshold and it is not a repeat of news already selected.

Publication times are Beijing time: a daily at 08:00, a weekly on Monday at 10:00, and a monthly on the 1st at 10:30. Free, no account required.

The engine is the open-source project [AIHOT](https://github.com/KKKKhazix/AIHOT). This repository replaces the site name, sources, taxonomy, prompts, and selection thresholds with ones for embedded systems and embodied AI. See [Acknowledgements](#acknowledgements).

## What it watches

The first boot imports **95 sources** from [`industry/sources.json`](industry/sources.json):

| Kind | Count | Examples |
|---|---:|---|
| RSS | 32 | GitHub Releases for official SDKs and kernels: Espressif ESP-IDF, HPMicro, NXP MCUXpresso, Raspberry Pi Linux, Zephyr, FreeRTOS, RT-Thread, NuttX |
| Web lists | 31 | Vendor newsrooms: Rockchip, GigaDevice, ST, NXP, Espressif, and others |
| WeChat accounts | 31 | Embedded and open-hardware communities |
| JSON | 1 | Hugging Face daily papers |

Sources are tiered, and each tier has its own selection threshold: 52 first-party (T1), 28 official or semi-official accounts (T1.5), and 15 media or personal feeds (T2). The site shows a summary and a link to the original. Full text stays with the publisher.

Categories live in [`industry/taxonomy.ts`](industry/taxonomy.ts): chips, embodied AI, development, industry, papers, tutorials, and opinion. There are 43 topic pages in three groups: companies (Espressif, STM32, NXP, Rockchip, NVIDIA Jetson, Raspberry Pi, Unitree, AgiBot, Figure, Tesla Optimus, and others), fields (embodied AI, humanoids, VLA, dexterous manipulation, on-device AI, RTOS, RISC-V, wireless, sensors, supply chain), and genres (chip launches, product updates, papers, benchmarks, tutorials, opinion, policy).

## How it works

An item is deduplicated, then prefiltered. Promising items are scored twice against the same rubric, written up in Chinese, clustered with other reports, and counted toward heat. Every prompt is in [`industry/prompts/`](industry/prompts/). Details are in [Selection](docs/selection.md).

The rubric is written for people who pick parts and write firmware. A chip or robot launch, a move into volume production, an end-of-life notice with a replacement, a breaking SDK change, an errata or CVE, a certification, an export-control action, and a tutorial or SDK a reader can use today are scored by how much they matter. Trade-show teasers, partnership announcements with nothing delivered, concept-only robots, and syndicated copies of the same press release are held down. The full rubric is [`industry/prompts/selection-score.md`](industry/prompts/selection-score.md).

Thresholds (the average of the two scores) are in [`industry/selection.ts`](industry/selection.ts): 56 for first-party sources, 58 for official accounts, 60 for media and individuals. When **10 or more** distinct sources report the same event, those reports are promoted into the selection. They still appear in the daily, and they do not trigger a push.

### Clustering and heat

Readers should see a story once. EmbHot clusters reports into one **event**: vector similarity on the headline and summary (or text overlap, if no embedding service is configured) finds candidates from the last two weeks, then a model decides whether they are the same story, a follow-up, or two stories. Uncertain merges are reviewed again before they are written. The review model can be set separately with `GROUP_REVIEW_MODEL`.

**Heat is counted per event, not per article.** The window is the last **7 days**, because news in this field moves slowly. Inside the window each distinct source counts once, with a 24-hour half-life. A refetch does not add heat, and ten articles from one outlet still count as one source. Events rising faster than six hours ago are marked up; newly appeared ones are marked new.

### What the site includes

| | |
|---|---|
| **Selection** | Prefilter, two independent scores, then a tiered threshold. One story, one slot |
| **Writing** | Chinese headline, summary, and reason to read. Category, tags, and facts are extracted separately. Foreign items are translated |
| **Events** | Many sources become one event, with follow-ups attached and a digest on the event page. Manual assignments are kept |
| **Heat** | Last 7 days, one count per distinct source, 24-hour half-life |
| **Daily, weekly, monthly** | Daily at 08:00: one entry per story, and a follow-up only when there is new information. Weekly on Monday at 10:00 and monthly on the 1st at 10:30 are compiled from the dailies; the model writes only the overview and section leads. Times are `EDITION_TIMES` in `site/site.ts` |
| **Topics and search** | Topic pages for companies, fields, and genres; title search and full-text search |
| **For agents** | RSS, a public API, MCP (tool prefix `embhot_`), Agent Markdown, and `llms.txt` |
| **Admin** | Sources and trial fetches, content diagnostics, selection evals, a model per step, budget circuit breakers, run logs and alerts |

## Run it

You need [Docker](https://docs.docker.com/get-started/get-docker/), [Node.js 24](https://nodejs.org/en/download), and an OpenAI-compatible model API key (DeepSeek, Qwen, or Zhipu all work).

`init-env` assumes DeepSeek. For another provider, follow `.env.example` and set `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_EXTRA_JSON`. Reasoning models also need `LLM_REASONING_TOKENS`.

```bash
git clone https://github.com/zhanghongchen1213/embedded_hot.git
cd embedded_hot
node scripts/init-env.ts --llm-key <your model API key>
docker compose up -d --build
```

Open <http://localhost:3000>. Admin is at `/admin`; the password is `ADMIN_PASSWORD` in `.env`. Content starts appearing within a couple of minutes. The first import takes about half an hour, because every item is prefiltered, scored, written, and clustered.

After the site is up, `/agent` has copy-ready MCP, RSS, and API setup. The API description is `/openapi-v1.json`.

The live site is <https://embhot.zhcmqtt.top>. The Baota panel deploy is in [docs/deploy-baota.md](docs/deploy-baota.md). Domains, HTTPS, backups, and running without Docker are in [docs/deploy.md](docs/deploy.md).

## Change this site

Names and brand live in [`site/`](site/). Industry knowledge lives in [`industry/`](industry/). The framework code usually stays as it is. A feature only this site needs goes in `modules/`.

| File | What to change |
|---|---|
| `site/site.ts` | Site name, subject, edition times, homepage and about copy |
| `industry/taxonomy.ts`, `industry/topics.json` | Categories, tags, companies, topic pages |
| `industry/sources.json` | Sources imported on first boot. After that, edit them in admin |
| `industry/prompts/` | Selection rubric and writing instructions |
| `industry/selection.ts` | Score thresholds, and how many sources promote an event |
| `site/models.ts` | Which model each step uses. Unset steps use the model in `.env` |
| `site/brand/`, `site/pages/`, `site/public/`, `site/changelog.json` | Icons and logo, terms and privacy, files published at the site root, changelog |

After changing the rubric or the thresholds, rerun `scripts/eval-selection.ts` on your own labeled sample before shipping. See [Selection](docs/selection.md).

## Documentation

| Document | Contents |
|---|---|
| [Sources](docs/sources.md) | How to configure sources, tiers, full text, fetch frequency, and inbound push |
| [Selection](docs/selection.md) | How an item becomes a selection and enters a daily, weekly, or monthly, and how to calibrate on your own sample |
| [Grouping](docs/grouping.md) | How event relations are judged, and how to evaluate them on labeled pairs |
| [Story digests](docs/story-digest-evaluation.md) | How to compare digest prompts on the same events |
| [Deploy](docs/deploy.md) | Docker, domains and HTTPS, updates, backups |
| [Baota deploy](docs/deploy-baota.md) | Deploying this site to embhot.zhcmqtt.top with the Baota panel |
| [Architecture](docs/architecture.md) | Three processes, layout, modules, migrations, public outputs |
| [Changelog](site/changelog.json) | Changes since this site launched |

Stack: Node.js 24 · TypeScript · React Router (server-rendered) · Fastify · PostgreSQL · pg-boss · Tailwind CSS · Docker Compose.

## Acknowledgements

Collection, selection, clustering, heat, editions, the website, the admin, and the public interfaces come from [AIHOT](https://github.com/KKKKhazix/AIHOT), built and open-sourced by [数字生命卡兹克](https://github.com/KKKKhazix). The original site is [aihot.news](https://aihot.news). The code is under the [MIT License](LICENSE). Copyright (c) 2026 数字生命卡兹克.

Thank you for publishing the engine. This site would not exist without it.

What this repository adds is the embedded and embodied-AI layer: the source list, taxonomy and company directory, topics, prompts, selection thresholds, and the EmbHot name and brand. Use this site's own name and marks. The name AIHOT and the AIHOT logo are not covered by the MIT license.

Issues and ideas about the framework itself belong in [AIHOT discussions](https://github.com/KKKKhazix/AIHOT/discussions) and [issues](https://github.com/KKKKhazix/AIHOT/issues). Security reports follow [SECURITY.md](SECURITY.md).

## License

The code is under the [MIT License](LICENSE) (Copyright (c) 2026 数字生命卡兹克). The name AIHOT and the AIHOT logo are not covered. Fonts have their own license; see [NOTICE](NOTICE).

Source content remains with its publishers. By default the site shows a summary and a link to the original.
