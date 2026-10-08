---
name: embhot-ship
description: embhot 的开发交付闭环：完成开发需求 → 本地验证（按风险自判）→ 撰写更新日志 → 备份后在负载安全时构建部署到生产服务器并实证验收。每当用户要求开发/修改本项目功能并发布、部署、上线、交付、ship、更新服务器、上生产、写更新日志并发布，或提到"改完发一下""部署到服务器"，即使用户只说了开发需求没提部署，只要意图是让改动上线，都必须使用本技能。
---

# embhot-ship：开发交付闭环

按顺序走完适用的阶段。**任何步骤失败都不得进入下一步**（失败粒度到子步骤，如 4.2 解压失败不得跑 4.3）。部署的最后一步永远是实证验收：没输出 `SHIP_VERIFIED` 标志不许宣称完成。每一步的判定与跳过理由都要出现在最终汇报里。

## 使用边界

- **适用**：本仓库的开发/修复/内容调整，且意图是让改动上线。
- **不适用**：用户明说不部署的本地试验；纯本地咨询。
- **否定优先**：语句里出现"不要部署/先不发/别上线"与肯定表述并存时，一律按否定处理（不部署），其余阶段照走，汇报里追问确认。
- **单点请求**：用户只要其中一件事（只写日志、只部署已就绪的改动）时只做对应阶段，其余阶段在汇报中标记"不适用"，不要空转。
- **混合请求拆分**：需求同时含铁律事项（门槛数字、"什么算重要"、信源取舍、站名、分类、条款隐私）时，可自主的部分走完整流程先交付；铁律部分单独挂起、列出待使用者拍板，不阻塞其余交付。
- **铁律**（AGENTS.md）：改评分标准保留结构只换例子；门槛数字须用标注样本校准（无样本时要求使用者书面接受"未校准"并记入汇报）；必须问使用者本人的五项：站名、信源、什么消息重要/什么是噪声、分类怎么分、条款与隐私内容。

## 阶段 1：完成开发需求

- 按 `AGENTS.md`/`CLAUDE.md`：先想后写（假设明示、不确定就问）、精准改动（diff 只含需求相关）、目标驱动（先定义可验证的成功标准）。
- 测试里的示例行业分类/公司按 AGENTS.md 约定维护：改了 `industry/taxonomy.ts` 就把例子换成新行业对应项；其他改动不要删测试覆盖。

## 阶段 2：本地验证（模型自判，结论必须写进汇报）

**唯一判据**：`git diff --name-only`（含 untracked）中不存在任何 `.ts`/`.tsx`/`.sql`/`package.json`/`package-lock.json`/`Dockerfile`/`docker-compose.yml`/`industry/` 数据与提示词（`sources.json`、`topics.json`、`prompts/`、`selection.ts`、`taxonomy.ts`）/`site/` 带类型的代码的**语义**改动——字符串字面量、注释、纯格式除外。满足才可跳过；**拿不准一律跑验证**。跳过时输出一行 `SKIP_VERIFY: <理由>`；误判是可追溯事故，宁可多跑。

跑验证时（新开终端需重新 export；三条命令在同一个已 export 的 shell 里跑）：

```bash
export PATH=/opt/homebrew/opt/node@26/bin:$PATH   # 本机默认 node 22 不满足 >=24.11
docker start embhot-test-pg 2>/dev/null || docker run -d --name embhot-test-pg \
  -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine

npm run typecheck
DATABASE_URL=postgres://postgres@127.0.0.1:5432/embhot_ci npm test
npm run build -w @aihot/web && node --test apps/web/tests/*.test.ts
node scripts/smoke.ts --base http://localhost:3000   # 本地站点已起时补跑
```

**绿的标准**：前三条命令退出码全 0（warning 与 skip 不算失败；typecheck 失败同样阻断）；smoke 仅在本地站点已起时补跑，未跑不算失败但要在汇报注明。失败处理：

- 先修到绿；不许带着自己引入的失败部署。
- 失败出现在从未触碰的文件里时，走基线复现三步曲：`git stash push -u` → 重跑失败用例 → **必须 `git stash pop` 并用 `git status` 确认改动已恢复**（未恢复禁止进入阶段 3，否则会打出不含修复的包）。基线也失败且与本次改动无关 = 环境性旧失败：不修、可部署，但必须在汇报里列表记录（文件、用例、基线结果、放行理由）。基线绿 = 是你引入的，必须修。

## 阶段 3：撰写更新日志

编辑 `site/changelog.json`。**读者视角**（说清读者得到什么；不写代码术语、文件名、命令）。目标结构（与 `packages/contracts/src/site.ts` 的 `ChangelogRelease` 一致）：

```json
{
  "latestVersion": "2026-10-08T09:30",
  "releases": [
    { "date": "2026-10-08", "time": "09:30", "kind": "更新", "title": "一句话说清用户收益",
      "body": ["段1：一个要点", "段2：一个要点"] }
  ]
}
```

规则：
- 顶层键名是 `releases`；`body` 是**字符串数组**（1–3 个元素，每个只讲一个要点，不允许空数组）。
- **时间戳向前进，且三者恒等**：新条目的 `date + "T" + time`（精确格式 `YYYY-MM-DDTHH:MM`，无秒）必须**严格大于**所有已有条目（不许倒灌、不许同戳——同戳会让侧栏红点永不亮，见 `apps/web/app/components/shell/Sidebar.tsx` 的字符串比较）；`latestVersion` 恒等于 `releases[0]` 的戳，也恒等于全表最大值。同日多条目按发布时间先后递增分钟（如先发的 09:30 在后、新发的 09:31 在前）。一律用**北京时间**，取部署上线时刻。
- 最新条目放数组最前。
- `kind` 判据：新能力=`更新`；体验改善与修复=`优化`；站务通知=`公告`；功能移除=`下线`。
- 何时可不写：仅当改动不影响任何读者可感知行为（纯重构/测试/CI）时才跳过本阶段，汇报里注明"changelog: 无读者可见变化"；拿不准就写。纯视觉微调（表情、字距）归此类。

## 阶段 4：备份、打包与安全部署

### 4.0 发版前置检查（全部过才继续）

1. `git status`：工作树干净，或列出将出货的全部改动并获使用者确认（防止把无关 WIP 卷上线）。
2. **备份数据库**（更新前备份不能省，迁移可能删表删列；custom 格式，回滚时 `pg_restore` 直接可用）：
   `ssh root@113.44.43.204 'cd /www/dk_project/dk_app/dk_embhot && docker compose exec -T db pg_dump -U aihot -Fc -f /tmp/backup-$(date +%F-%H%M).dump aihot && docker compose cp db:/tmp/backup-<时间戳>.dump /tmp/'`（不走管道，退出码保真；OBS 自动备份最近一次成功也可作为唯一备份，二选一）。
3. **长脚本互斥**：`ssh root@113.44.43.204 'docker top aihot-worker-1'` 人工看一眼（容器内无 `ps`；不要用 `exec … ps aux`）——凡运行超过 1 分钟的批量/重评分脚本都算长脚本，`up -d` 会杀掉它。有则等它完成或**先问使用者**再停。
4. 磁盘检查：`ssh root@113.44.43.204 'df -h /'`——可用 <2G 先清理（`docker image prune`、旧 SQL 备份；`embhot-*.tar.gz` 除当前包外**至少保留上一代**供回滚，不算可清理项）。

### 4.1 打包（在仓库根目录执行；`PKG` 变量贯穿 4.1–4.2）

```bash
PKG=/tmp/embhot-$(date +%Y%m%d-%H%M).tar.gz
COPYFILE_DISABLE=1 tar --exclude node_modules --exclude .data --exclude '.env*' --exclude .git \
  --exclude '._*' --exclude .DS_Store --exclude 'apps/web/build' --exclude 'apps/web/.react-router' \
  -czf "$PKG" .
```

- `COPYFILE_DISABLE=1` 与 `._*` 不可省（macOS 元数据文件会炸数据库迁移）。
- 打包的是**整棵工作树**（覆盖合并语义），所以 4.0 的工作树检查是硬前提。

### 4.2 上传解压（失败即停）

```bash
scp -q "$PKG" root@113.44.43.204:/tmp/
ssh root@113.44.43.204 "cd /www/dk_project/dk_app/dk_embhot && tar -xzf /tmp/$(basename "$PKG")"
```

- 解压是**覆盖合并**：不会删除服务器上多出的旧文件（本地删过的文件会残留）；`.env*` 已整体排除，永不覆盖。
- tar 报错（磁盘满等）即停：清理后重传重解，**不得带着半截目录进 4.3**。解压成功前不要删除服务器上的上一代包。

### 4.3 部署（顺序是框架硬性要求，不得简化）

```bash
ssh root@113.44.43.204 'cd /www/dk_project/dk_app/dk_embhot || exit 1
  waited=0
  while [ "$(cut -d" " -f1 /proc/loadavg | cut -d. -f1)" -ge 8 ]; do
    sleep 30; waited=$((waited+30)); echo "waiting load... ${waited}s $(cat /proc/loadavg)"
    if [ "$waited" -ge 900 ]; then echo "LOAD_GATE_TIMEOUT: 未部署，代码已在服务器"; uptime; free -h; exit 2; fi
  done
  docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com > /tmp/build.log 2>&1 \
    && echo BUILD_OK || { echo BUILD_FAILED; tail -20 /tmp/build.log; exit 3; }
  docker compose stop api worker web || { echo "DEPLOY_FAILED_STEP=stop"; exit 4; }
  docker compose run --rm setup || { echo "DEPLOY_FAILED_STEP=setup（站点已停！按 4.5 处置）"; exit 5; }
  docker compose up -d || { echo "DEPLOY_FAILED_STEP=up"; exit 6; }'
```

- **while 循环体结尾必须是 `if … fi`**（或 `; true`）：bash 的 while 退出状态 = 循环体最后一条命令的状态，写成 `[ … ] && { … }` 会让"等过一轮"的路径以失败退出、好路径被打断（这是实测复现过的 bug）。
- **顺序语义**：build（新镜像就绪）→ 停旧 api/worker/web（迁移可能删表删列，旧进程在跑会出错）→ `setup` 跑迁移+种子（**失败则不启动**，参照 `docs/deploy.md` 排障）→ `up -d` 起新版。这是 `docs/deploy.md` 的硬性要求。
- 退出码保真用重定向（禁 `| tail`——管道会吞掉 build 失败）。任何 `*_FAILED_STEP`/`LOAD_GATE_TIMEOUT` 都算部署失败：停下汇报，不许宣称完成。
- **`DEPLOY_FAILED_STEP=setup` 的特殊处置**：此时 api/worker/web 已停、站点不可用——必须当场继续（排障后重跑 `run --rm setup && up -d`，或立即走 4.5 回滚），修不好不许离场，汇报里明确写"站点当前不可用"。

### 4.4 实证验收（真门，不许糊弄）

```bash
ssh root@113.44.43.204 'curl -fsS http://127.0.0.1:3000/<页面路径> | grep -qF "<新内容独有标志>" && echo SHIP_VERIFIED'
```

- **必须用 `grep -qF` + `curl -fsS`**（`-f` 让 5xx 非零退出；`grep -q` 空输入非零退出）。禁止 `grep -o | head` 组合——它在内容未命中时也返回 0，会假报成功。
- **独有标志的选取**：本次 changelog 条目 `title` 的 ≥10 字连续子串，或本次新增的唯一文本（新按钮/新标题的原文）——不用可能撞车的短词。
- **双验收**：内网 `127.0.0.1:3000` 过后，再验公网 `curl -fsS https://embhot.zhcmqtt.top/<同路径>`（公网必须验，只在明确无公网条件时跳过并汇报）。公网 502/超时而内网正常 = 反代层问题：按序查 `docker compose ps`（web 是否在听）→ 宝塔该站点的反向代理配置 → `docs/deploy-baota.md` 的反代小节；反代层修不好不算交付完成，如实汇报。
- 无页面可见效果的改动（API/RSS/worker 行为）：验收证据换成对应出口的 `curl -fsS` 结果或一条可核对的运行日志，同样只在证据成立时输出 `SHIP_VERIFIED`。
- 验收失败：**最多共 3 次尝试（首次 + 重试 2 次），每次间隔 ≥15 秒**（web 可能还在起）；仍失败则停止，汇报 curl 的完整输出，**不许宣称完成**，是否回滚听使用者。

### 4.5 回滚与发版台账

- **回滚**（验收失败且使用者要求回滚、部署后发现严重问题、或 `DEPLOY_FAILED_STEP=setup` 修不好）：取服务器上上一代 tar 解压覆盖 → 重跑 4.3（同一顺序）。本次更新含数据库迁移时，恢复前先回灌 4.0.2 的备份：`docker compose cp /tmp/backup-<时间戳>.dump db:/tmp/ && docker compose exec -T db pg_restore -U aihot -d aihot --clean --if-exists /tmp/backup-<时间戳>.dump`（4.0.2 产的是 `-Fc` custom 格式，`pg_restore` 直接可用；注意 plain `.sql.gz` 备份不能用 pg_restore，那要 `psql` 灌），并提醒使用者迁移回退可能丢新数据。
- **台账**：每次成功交付后在汇报末尾输出一行：`SHIP <YYYY-MM-DD HH:MM> | <改动范围一句话> | <验收证据> | <包名>`。同戳/连续两次 ship 以此判别线上版本。

## 自保规则（实战坑，违反会翻车）

1. **负载风暴**：服务器 2 核 4G 且共存 Java 业务，build 曾把 load 压到 110（sshd 限流、面板卡死）。构建被杀的标志是 exit 144/137 或 SSH `banner exchange` 超时——先看 `uptime`/`free -h`，等 load 整数部分 <6 再重试；同一命令 5 分钟内重连不超过 2 次，重试从 build 那一步起重跑。
2. **SSH 会话僵死**：输出冻结超过 3 分钟时先查远端有无对应进程（`ps aux`）；有 sleep/while 就继续等（负载闸心跳是预期输出），确认无进程才判定悬挂——停掉任务直连重跑，不要空等。
3. **`.env` 追加**：`printf '\n%s\n' 'KEY=value' >> .env`——文件末尾无换行时 `echo >>` 会把变量接进上一行注释里静默失效。
4. **`.env` 变更生效**：`docker compose restart` 不重读环境变量，必须 `docker compose up -d --force-recreate api worker`；用 `docker compose exec -T api printenv | grep <KEY>` 验证真的进了容器（宿主机 `printenv` 看不到）。
5. **容器内临时脚本**（`.mjs`）：import 用绝对路径 `/app/...`（`@aihot/*` 从 /tmp 解析不到）；`.mjs` 是纯 JS，不得用 TS 语法（如 `!` 断言）。
6. **SQL 经 SSH**：用 `ssh ... 'docker compose exec -T db psql -U aihot -d aihot' <<'SQL'` heredoc 传入，避免引号地狱；Postgres 没有 `0x…::text` 这种 hex 转字符串。
7. **输出滞后 ≠ 失败**：`tail` 会缓冲到命令结束；`up` 后 `ps` 显示 `Up less than a second` 正常。但**退出码必须保真**——部署链路里禁止用管道吞退出码。
8. **长任务与部署互斥**：见 4.0.3；停长脚本前先问使用者。

## 服务器事实

- SSH：`ssh root@113.44.43.204`（本机公钥已装）
- 项目目录：`/www/dk_project/dk_app/dk_embhot/`（宝塔只做 Nginx 反代 + 证书）
- 容器：`aihot-db-1`（Postgres 17）、`aihot-api-1`、`aihot-worker-1`、`aihot-web-1`；compose 项目名 `aihot`
- 网站：内网 `http://127.0.0.1:3000`；公网 `https://embhot.zhcmqtt.top`（Nginx 反代）
- 数据库：`docker compose exec -T db psql -U aihot -d aihot`
- 海外信源走 mihomo 代理容器（`EGRESS_PROXY_URL=http://mihomo:7890`），勿动
- 负载安全线：loadavg 整数部分 ≥8 等待；<6 才算回落可重试构建
