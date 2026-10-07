# 用宝塔 + Docker 部署到 embhot.zhcmqtt.top（可视化操作版）

本文是给「云服务器 + 宝塔面板（含 Docker 管理器）」场景写的一步一步操作手册。目标：通过 `https://embhot.zhcmqtt.top` 访问网站。

**操作方式**：以宝塔可视化界面为主。只有两小步需要敲命令，而且都在你自己的 Mac 上（打包源码、生成随机密码），服务器上全程点鼠标。文末附录解释了命令到底做了什么，以及万一界面按钮不好使时的命令兜底。

---

## 0. 先弄懂三件事

### 0.1 和你以前部署 Spring Boot 的区别

| | 你以前的流程 | 这次的流程 |
|---|---|---|
| 后端 | 云服务器跑 Spring Boot | Docker 容器 `api` + `worker` |
| 数据库 | 单独买云数据库 | Docker 容器 `db`（PostgreSQL），数据存服务器，**不用买云数据库** |
| 前端 | 编译后的静态文件传 OBS 桶 | **不传 OBS**。前端是 `web` 容器里的 Node 服务（服务端渲染），和后端一起跑在服务器上 |
| HTTPS | 宝塔建站 + 证书 | 同样用宝塔：左侧「网站」建站 → SSL 证书 → 反向代理 |

### 0.2 宝塔 Docker 界面 = docker compose 的可视化外壳

你截图里的这套界面（容器编排 / 配置文件 / .env / 重建 / 编排日志），和命令是一一对应的：

| 你在宝塔里看到的 | 等价的命令行概念 |
|---|---|
| 「容器编排」里的一个项目（如 `dk_activemq`） | 一个 `docker-compose.yml` 项目 |
| 编排详情右侧「**配置文件**」编辑框 | 就是编辑 `docker-compose.yml` |
| 「**.env**」编辑框 | 就是编辑 `.env` 文件（你的 activemq 端口、密码就是这么配的） |
| 「**重建**」按钮 | `docker compose up -d --build`（构建镜像 + 启动全部容器） |
| 「停止 / 重启」按钮 | `docker compose stop` / `restart` |
| 「**编排日志**」黑框 | 就是命令的输出 |
| 「跳转目录」 | 打开这个编排在服务器上的文件目录 |

所以这次部署 = **在宝塔里再添加一个容器编排项目**，目标状态就一句话：

> 有一个名为 `embhot` 的编排，它的目录里放着完整项目源码 + `docker-compose.yml` + `.env`，点「重建」后容器列表多出 `db`、`api`、`worker`、`web` 四个容器。

### 0.3 为什么这次非要放「源码」，而 activemq 不用

Docker 起容器有两种方式：

1. **拉镜像**（你的 activemq）：`image: islandora/activemq:3.1`，镜像仓库里有现成的做好的镜像，下载下来就能跑，所以不用放任何源码。
2. **构建镜像**（本项目）：`build: .`，意思是"以当前目录的源码 + Dockerfile 为准，现场构建出镜像"。这个项目要改站点配置、改行业内容，源码就是"安装包"，**构建必须读到源码**，没有现成镜像可拉。

所以"把项目源码放到服务器"不是额外的门槛，它扮演的就是你以前"前端传 OBS、后端传 jar"的那个角色——只不过这里传的是整个源码目录，由 Docker 在服务器上把它构建成运行环境。

---

## 1. 域名解析（在域名控制台做，不在服务器上）

登录你买 `zhcmqtt.top` 的地方（华为云 / 腾讯云 / 阿里云 / Cloudflare 等）的 **DNS 解析**，添加一条记录：

| 字段 | 填什么 |
|---|---|
| 记录类型 | **A** |
| 主机记录 | **embhot**（完整域名变成 embhot.zhcmqtt.top） |
| 记录值 | **你的云服务器公网 IP** |
| TTL | 默认 |

**验证**（Mac 终端）：`ping embhot.zhcmqtt.top`，解析出你的服务器 IP 就生效了。

> **ICP 备案**：服务器在中国大陆的话，域名必须先完成 ICP 备案（在服务器所属云厂商处提交），否则 80/443 会被拦截。备案号之后填进 `site/site.ts` 的 `icp` 字段。

---

## 2. 检查 Docker 环境（从截图看你已经装好了）

你的 Docker 管理器已经在跑（还有一个 activemq 项目）。只需再确认两件事：

1. **镜像加速**：Docker 管理器 → **设置**，把「镜像加速」配上一个当前可用的国内加速地址（搜索引擎搜「Docker 镜像加速地址」）。构建时要拉 Node、PostgreSQL 的基础镜像，不加速会极慢或超时。
2. **内存余量**：你的服务器约 4 GB 内存（截图里 3.63 G），activemq 占着约 180 MB。本项目构建 + 运行建议留 2.5 GB 以上空闲。**如果后面构建报错（OOM / 退出码 137），先到「容器编排」把 `dk_activemq` 停掉释放内存，构建完再开。**

---

## 3. 在 Mac 上打包源码（一条命令）

打开 Mac 终端，执行：

```bash
cd /Users/hongchenke/Documents/Github/embedded_hot
COPYFILE_DISABLE=1 tar --exclude node_modules --exclude .data --exclude '.env*' --exclude .git --exclude '._*' --exclude .DS_Store --exclude 'apps/web/build' --exclude 'apps/web/.react-router' -czf /tmp/embhot.tar.gz .
```

得到 `/tmp/embhot.tar.gz`（几十 MB）——这就是要传上服务器的"安装包"。四个排除项很重要：`node_modules`（依赖服务器上重新装）、`.data`（本地数据，要迁到服务器见第 11 节）、`.env`（本地配置不要带上服务器）、`.git`（用不上）。

打好的包在第 4 节创建编排之后上传。

---

## 4. 添加容器编排（详细步骤）

宝塔左侧 → **Docker** → **容器编排**。整个配置分四步：**建模板 → 建编排 → 传源码 → 核对**。

### 4.1 添加 Yaml 模板（「编排模板」→「添加 Yaml 模板」）

「容器编排」页面左侧点「**编排模板**」→「**添加 Yaml 模板**」，表单逐项填：

| 字段 | 怎么填 |
|---|---|
| **创建模板**（必填） | `embhot` |
| 备注 | 随意，可空 |
| compose 文件（选择 / 本地上传） | 只是路径引用，**选了文件不等于内容进去了**——内容以下面的编辑框为准 |
| **compose 内容**（必填） | 把项目 `docker-compose.yml` 全文**粘贴进编辑框**（Mac 上打开该文件全选复制）。「本地上传」如果能带出内容也行，粘贴后**必须亲眼确认框里有完整内容**——这个框是空的就等于模板没内容，保存后等于白改 |
| .env 文件 / **.env 内容** | **可以先留空**（第 5 节在编排详情里填，效果一样）；想一次到位，就把第 5 节配好的 `.env` 全文粘贴进来。同样注意内容框为准 |

粘贴后核对 compose 内容：开头是 `name: aihot`，里面有 `build: .`（构建源码）、`env_file: .env`，以及 `db / setup / api / worker / web` 五个服务——这是「从源码构建 + 起 5 个容器」的关键，**不要改它的内容**（所有参数都在 `.env` 里外置了）。

> **创建编排时报「此端口 [80] 已经被其他模板使用」怎么办**：这个「其他模板」指**模板库里的旧模板**——宝塔创建编排时会拿所有已保存的编排模板做端口冲突检查，模板里的 `caddy` 服务声明了 `80:80`/`443:443`，就把 80「登记」占住了，新创建全被挡。用宝塔 Nginx 反代时 Caddy 永远用不上，本项目源码的 `docker-compose.yml` 已删掉 `caddy` 服务。处理：
> 1. 「编排模板」→「**搜索本地模板**」（模板存在 `/www/server/panel/data/compose/<模板名>/`），对每个模板点「**编辑**」看 compose 内容——只要还有 `caddy:`、`80:80`、`443:443` 字样，就整段替换成仓库里干净的 `docker-compose.yml`（自查：搜不到这三样，`ports` 只有 `${PORT:-3000}:3000` 一处）；嫌麻烦就「删除」后重新「添加 Yaml 模板」。
> 2. 「添加容器编排」时模板**从下拉里点选**「搜索本地模板」列表里真实存在的名字（可能是 `dk_` 前缀的，如 `dk_embhot`）——下拉里手输/缓存的旧名字（如 `embhot_true`）不在库里，创建必失败。
> 3. 用旧压缩包传过源码的，重新打包再传一次，保证编排目录里的 compose 也是删过的版本。

点「**添加**」。

### 4.2 创建容器编排（「添加容器编排」→「容器编排」标签）

「容器编排」页面点「**添加容器编排**」，切到「**容器编排**」标签（不是「手动创建」）：

| 字段 | 怎么填 |
|---|---|
| 容器编排模板 | 下拉选 `embhot`（4.1 刚建的） |
| **名称** | `embhot` |
| 备注 | 随意，可空 |

> 「编排名称重复时，将会覆盖现有项目」的提示，首次创建不用管。

点「**创建**」。

> **创建时宝塔会立刻构建并启动，报 `failed to read dockerfile: open Dockerfile: no such file or directory` 是预期的，不是配置错了**——`build: .` 要读编排目录里的 `Dockerfile`，而这会儿源码还没传（4.3 才传）。报错里 `Pulling Image aihot-app ... 403 Forbidden` 也是正常噪音：compose 先去远程拉 `aihot-app`（它只在本地从源码构建，远程当然没有），失败后才转本地构建。两者都不用处理，继续 4.3 传源码，第 6 节「重建」时构建才会真正成功。

创建之后（报上述错也算创建了）去「容器编排」列表找这个项目：右侧「配置文件」是 `docker-compose.yml`，右下是 `.env` 编辑框（带「保存」），下方是「编排日志」。宝塔同时在服务器上生成编排目录（参照你 activemq 的 `dk_activemq` 规律，本项目应是 `/www/dk_project/dk_app/dk_embhot/`——以「**跳转目录**」实际打开的路径为准）。

### 4.3 「跳转目录」上传源码

1. 编排详情点「**跳转目录**」（或左侧「文件」手动进入上一步的编排目录）。
2. 点「**上传**」，把 Mac 的 `/tmp/embhot.tar.gz` 传上来（用 scp 的话：`scp /tmp/embhot.tar.gz root@服务器IP:/www/dk_project/dk_app/dk_embhot/`）。
3. 右键该文件 → **解压**。
4. 核对目录里能看到：`Dockerfile`、`docker-compose.yml`、`.env`、`package.json`、`apps/`、`site/`、`industry/` 等。

说明：解压会覆盖宝塔生成的 `docker-compose.yml`——两边本就是同一份内容，无所谓；`.env` 不在压缩包里，不会被覆盖。**源码必须和 `docker-compose.yml` 在同一个目录**（`build: .` 就指这个目录），解压完这个条件就满足了（目录里能看到 `Dockerfile` 就对了）。传完不用立刻构建——先去第 5 节填 `.env`，第 6 节点「**重建**」才是正式的构建启动。

### 4.4 核对配置

编排详情页看两处：

- 「**配置文件**」：五个服务齐全、有 `build: .`——不用改。
- 「**.env**」框：按第 5 节填好全文，点「**保存**」（4.1 里填过的，在这里核对一遍 `SITE_URL` 等关键项）。

---

## 5. 填 .env（网站配置 + 密钥，全文最重要的一步）

`.env` 是这个站唯一的配置文件。**编辑位置**：容器编排详情右下角的「**.env**」编辑框（4.1 建模板时填过的，在这里核对；漏填的在这里补），改完点「**保存**」。它和「跳转目录」里的 `.env` 是同一个文件。

先在 Mac 终端生成 4 个随机密钥（生成好抄过去）：

```bash
echo "ADMIN_PASSWORD=$(openssl rand -base64 18)"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo "IMG_PROXY_SIGN_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)"
```

**管理员密码抄下来**（登录后台用）。然后把下面的内容粘贴进 `.env` 编辑框（把 4 个 `粘贴生成的值` 和 `LLM_API_KEY` 换成你的）：

```dotenv
# ===== 必填 =====
# 网站对外地址：必须写读者实际访问的地址，带 https、不带端口、不带结尾斜杠
SITE_URL=https://embhot.zhcmqtt.top

ADMIN_PASSWORD=粘贴生成的值
SESSION_SECRET=粘贴生成的值
IMG_PROXY_SIGN_SECRET=粘贴生成的值
POSTGRES_PASSWORD=粘贴生成的值

# 模型接口：以 DeepSeek 为例，换成你自己的 Key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=sk-你的Key
LLM_MODEL=deepseek-flash
LLM_EXTRA_JSON={"thinking":{"type":"disabled"}}

# ===== 网络相关 =====
# 网站端口只监听服务器本机 3000，外网走宝塔 Nginx（反向代理在第 7 步配）
PORT=127.0.0.1:3000
# 前面有 Nginx 反代，必须是 true，访客 IP 才从转发头里读
TRUST_PROXY=true

# ===== 安全阀 =====
# true 才抓信源、调模型，上线要开着
COLLECT_ENABLED=true
MODEL_CALLS_ENABLED=true
```

### 容易填错的地方

- `SITE_URL`：写 `https://embhot.zhcmqtt.top`——**不要** `http://`、**不要** `:3000`、**不要**结尾 `/`。写错全站链接、RSS 都会错。
- **不要**填 `SITE_DOMAIN`（那是给项目自带的 Caddy 用的，我们用宝塔 Nginx，Caddy 根本不启动）。
- `*_ENABLED` 开关只认小写 `true`，写 `1`、`TRUE` 都算关闭。
- `.env` 里全是密钥，不要外传、不要提交 Git。
- （可选）数据库自动备份到华为云 OBS 的配置见文末第 10 节，也可以部署完再加。

---

## 6. 启动：点「重建」

回到容器编排详情页，点「**重建**」按钮。它会：读取 `docker-compose.yml` → 按 `build: .` 用目录里的源码构建镜像 → 启动全部容器（`setup` 先跑数据库迁移然后自己退出，属正常现象）。

第一次构建要下载基础镜像 + 安装依赖，**等 5～10 分钟**，进度全在「**编排日志**」里。

### 怎么判断成功

| 在哪看 | 预期 |
|---|---|
| 编排日志 | 出现构建输出（`[+] Building...`），最后是各服务 `Started` / `Healthy` |
| Docker → **容器** 列表 | 多出 `aihot-db-1`、`aihot-api-1`、`aihot-worker-1`、`aihot-web-1`（名字前缀可能随编排名略有不同） |
| Docker → **本地镜像** | 多出一个叫 `aihot-app` 的镜像（约 1 GB） |
| 浏览器临时验证 | 安全组临时放行 3000，打开 `http://服务器公网IP:3000` 能看到网站；验完关掉 |

### 如果「重建」没构建出镜像

宝塔不同版本对 `build: .` 的支持程度不一。如果日志里**没有**出现构建输出、本地镜像里**没有** `aihot-app`，用命令兜底（宝塔左侧 → **终端**）：

```bash
cd /www/dk_project/dk_app/dk_embhot        # 换成你的编排目录
docker compose up -d --build
```

效果和「重建」完全一样。构建报内存不足（OOM）时，先「停止」activemq 编排再跑一次。

网站起来后，第一次启动一两分钟开始出内容，示范信源的第一批约半小时处理完。

---

## 7. 宝塔建站：域名 + HTTPS + 反向代理

在宝塔左侧 → **网站**（注意：是左侧菜单的「网站」，**不是** Docker 页面里的「网站」标签，那个不用管）。

### 7.1 添加站点

- **域名**：`embhot.zhcmqtt.top`
- **PHP 版本**：**纯静态**（不需要 PHP）
- 数据库、FTP：不创建
- 根目录：默认即可（反代后用不到）

### 7.2 申请 HTTPS 证书

站点 → `embhot.zhcmqtt.top` → **SSL** → **Let's Encrypt**：勾选域名 → **申请**（要求备案已完成、80 端口可访问）。成功后打开「**强制 HTTPS**」。证书 90 天自动续期。

### 7.3 反向代理到本机 3000

站点设置 → **反向代理** → **添加反向代理**：

- **代理名称**：`embhot`
- **目标 URL**：`http://127.0.0.1:3000`
- **发送域名**：`$host`

确定 → 点这个代理 → **配置文件**，确认（缺就补）这几行：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
```

其中 `X-Forwarded-For` 那行是 `.env` 里 `TRUST_PROXY=true` 要读的，必须有。

### 7.4 两个「不要」

- **不要**给这个站点开缓存（「性能优化」/缓存插件全关）。站点自带 `Cache-Control`，代理再加缓存会导致内容不更新。
- **不要**给它装 PHP；WAF 规则别乱调，误伤 API 就打不开了。

### 7.5 防火墙 / 安全组

两层都放行 **80、443**（云厂商安全组 + 宝塔「安全」页面）。**3000 不用放行**。宝塔面板端口建议只对你自己的 IP 放行。

---

## 8. 完成检查

| 检查 | 预期 |
|---|---|
| `https://embhot.zhcmqtt.top` | 网站首页，地址栏带小锁 |
| `http://embhot.zhcmqtt.top` | 自动跳 https |
| `https://embhot.zhcmqtt.top/admin` | 后台登录页，用 `ADMIN_PASSWORD` 登录成功 |
| 后台「信源」「运行」页 | 抓取任务在跑，几分钟后「全部动态」出现内容 |

---

## 9. 代码更新（完整步骤）

更新分两种情况，前置动作不同，后面的部署步骤相同：

- **改自己的站**（日常修改 `site/` 文案、`industry/` 信源提示词、门槛、模块等）：直接从 9.1② 备份开始。
- **合并框架更新**（上游 `docs/deploy.md` 的「更新」一节有新日期的更新说明时）：**必须先读对应日期的更新说明**——里面写着环境变量增删、`site.ts` 配置改法、迁移注意事项。该改的 `.env`、`site/` 文件先在本地改好，再走下面的步骤。

### 9.1 更新前（必做）

**① 备份数据库**（二选一）：

- 配了 OBS 自动备份（第 10 节）：把更新安排在每天 04:10 自动备份完成之后，确认最近一次备份成功即可。
- 手动快照（宝塔「终端」执行，几十秒）：

```bash
cd /www/dk_project/dk_app/dk_embhot
docker compose exec -T db pg_dump -U aihot aihot | gzip > backup-$(date +%F).sql.gz
```

生成的 `backup-<日期>.sql.gz` 就在编排目录里，可以下载到本地。编排页的「备份」按钮备份的是编排配置，**数据库快照以上面两种为准**。

**② Mac 上打包新代码**（同第 3 节的命令）：

```bash
cd /Users/hongchenke/Documents/Github/embedded_hot
COPYFILE_DISABLE=1 tar --exclude node_modules --exclude .data --exclude '.env*' --exclude .git --exclude '._*' --exclude .DS_Store --exclude 'apps/web/build' --exclude 'apps/web/.react-router' -czf /tmp/embhot.tar.gz .
```

### 9.2 换上新代码（宝塔文件管理）

打包排除了 `.env`，所以更新**永远不会覆盖服务器上的 `.env`**（管理员密码、密钥、备份配置都还在）。推荐的干净换法：

1. 文件管理进入编排目录（`/www/dk_project/dk_app/dk_embhot/`），先把要留的东西护住：`.env` **改名**成 `.env.keep`；如果目录里有 9.1 生成的 `backup-<日期>.sql.gz`，先下载到本地（别随旧代码一起删）；
2. **删除目录里的其余全部文件**（为什么：改名或删除过的源文件残留会混进下次构建，可能让构建出错或带上旧代码）；
3. 上传新的 `/tmp/embhot.tar.gz` → 右键**解压**；
4. 把 `.env.keep` 改回 `.env`；
5. 如果这次更新要求改配置（框架更新说明里写的），现在编辑 `.env` 补上。

> 嫌麻烦也可以直接覆盖解压不删旧文件（`.env` 依然不会被覆盖）——多数小改动没问题，但文件有改名/删除时会踩残留的坑，推荐按上面四步来。

### 9.3 停旧服务 → 重建（顺序不能反）

1. Docker → 容器编排 → `embhot` → 先点「**停止**」。
   - worker 停止时会等进行中的付费调用收尾，**最长三分多钟**才停完，正常现象，等它变成已停止。
2. 再点「**重建**」：构建新镜像 → 自动跑数据库迁移（setup）→ 启动新版全部服务。
3. 盯「**编排日志**」：能看到迁移文件名滚动（每个文件一行），最后各服务启动。

**为什么要先「停止」再「重建」，而不是直接「重建」**：数据库迁移可能删表删列，旧的 api/worker 还在跑就会出错（框架文档的硬性要求）。「停止」保证迁移在旧服务完全停下之后才执行。

**停机窗口** = 构建 + 迁移 + 启动 ≈ 5～10 分钟。想缩短见 9.5 命令版（构建时旧服务还在跑）。

### 9.4 更新后验证

| 检查 | 预期 |
|---|---|
| 容器列表 | `db`、`api`、`worker`、`web` 四个运行中 |
| 编排日志 | setup 迁移无报错，各服务 `Started` |
| 网站 | 首页、`/admin` 能打开，后台「运行」页任务正常 |
| 确认换新（可选） | `.env` 里设过 `AIHOT_RELEASE=版本名` 的话，后台「运行」页和 `/api/health` 会显示它，一眼看出进程是新的 |

### 9.5 迁移失败与回滚

- **迁移失败**：编排日志里会有具体错误，此时 api/worker/web 不会启动（这是保护，不是故障）。对照错误处理后（框架更新说明里常写处理办法）再点「重建」。**不要**跳过迁移硬启动。
- **回滚代码**：传回旧的 tar 包，重复 9.2② 和 9.3。
- **回滚数据库**：只在新迁移已经执行、且必须退回旧版代码时才需要——用 9.1 的备份恢复（`pg_restore`，见 `docs/deploy.md` 备份一节）。这就是更新前备份不能省的原因。

### 9.6 命令对照（停机更短的更新方式）

宝塔「终端」执行，顺序就是框架 `docs/deploy.md` 的官方顺序：

```bash
cd /www/dk_project/dk_app/dk_embhot
docker compose build                                    # ① 构建新镜像（旧服务继续跑，不停机）
docker compose stop api worker web                      # ② 停后端（worker 等付费调用收尾）
docker compose run --rm setup && docker compose up -d   # ③ 迁移，成功才启动新版
```

和界面版的差别：①构建期间网站还在服务，停机窗口只剩迁移 + 启动（约 1 分钟）；③迁移失败时 `&&` 挡住不启动，先看错误再处理。9.1 的备份、9.2 的换代码照做。

## 10. 备份到 OBS（可选，强烈建议）

数据库每天 04:10 自动备份到 S3 兼容对象存储。华为云 OBS 兼容 S3：在 OBS 控制台建一个私有桶 + 一对访问密钥，然后在 `.env` 里加：

```dotenv
DB_BACKUP_STORE_SECRET_ID=<OBS 的 AK>
DB_BACKUP_STORE_SECRET_KEY=<OBS 的 SK>
DB_BACKUP_STORE_BUCKET=<桶名>
DB_BACKUP_STORE_REGION=<区域，如 cn-north-4>
DB_BACKUP_STORE_DOMAIN=<桶名>.obs.<区域>.myhuaweicloud.com
```

`DB_BACKUP_STORE_DOMAIN` 必须填（不填会按腾讯云 COS 拼地址）。备份是一对文件：`aihot-<时间>.dump`（数据库）+ `aihot-files-<时间>.tar.gz`（上传的文件）。改完 `.env` 后点编排的「重启」。

---

## 11. 把本地测试数据带到服务器（可选）

**先回答最常见的疑问：按第 3 步打包上传，本地测试的数据不会被带上去。** 数据在本地 PostgreSQL 数据库里，**不在项目目录里**；`.data`（上传文件）和 `.env` 打包时又明确排除了。所以按前面步骤部署完的服务器是**空库**（只有 setup 自动导入的示范信源）。

想把本地数据（采集过的资料、分析结果、后台设置、改过的信源等）迁到服务器，在第 6 步服务启动完成后按下面做。

### 11.1 本地导出（Mac 终端）

**① 导出数据库**（按你本地怎么跑的选一条）：

```bash
# 本地是 docker compose 跑的（和服务器同款 PostgreSQL 17，最稳）：
cd /Users/hongchenke/Documents/Github/embedded_hot
docker compose exec -T db pg_dump -U aihot aihot > /tmp/myhot.dump

# 本地是本机 PostgreSQL（.env 的 DATABASE_URL 指向的那个库）：
pg_dump "postgres://用户名@127.0.0.1:5432/库名" > /tmp/myhot.dump
```

**② 导出上传的文件**（只带 `uploads/`；图片缓存 `imgcache/`、`ogcache/` 不用带，会重新生成）：

```bash
cd /Users/hongchenke/Documents/Github/embedded_hot
tar -czf /tmp/myhot-files.tar.gz -C .data uploads
```

（本地从没上传过图片就跳过这步；有反馈截图就把 `uploads` 换成 `uploads feedback-screenshots`。）

### 11.2 上传

把 `/tmp/myhot.dump`、`/tmp/myhot-files.tar.gz` 传到服务器编排目录（scp 或宝塔文件管理，同 4.3 节）。

### 11.3 服务器上恢复（宝塔「终端」）

```bash
cd /www/dk_project/dk_app/dk_embhot
docker compose stop api worker        # 停写入，防止恢复期间混进新数据
docker compose exec -T db pg_restore -U aihot -d aihot --clean --if-exists < myhot.dump
# 有上传文件才做下面两行：
docker compose cp myhot-files.tar.gz api:/data/
docker compose exec api tar -xzf /data/myhot-files.tar.gz -C /data
docker compose restart api worker web # 恢复完再启动
```

### 几个说明

- `--clean --if-exists`：先清掉服务器库里的现有数据（比如 setup 刚导入的示范信源）再导入，**以你本地的数据为准**。
- **不用重跑迁移**：dump 里带迁移账本。之后的更新照第 9 节做即可；setup 的种子脚本只补缺不覆盖（按信源 id 去重），你改过的信源不会被还原成示范源。
- **管理员密码不变**：密码在服务器 `.env` 的 `ADMIN_PASSWORD` 里，不在数据库里——恢复后仍用服务器那个密码登录后台。
- **版本兼容**：本地 PostgreSQL 版本 ≤ 服务器的 PG 17 都能直接恢复；本地若是更高版本（如 18）恢复会失败，换 Docker 里的 postgres:17 导出即可。
- 恢复完打开网站确认内容都在，然后删掉服务器上的 `myhot.dump`、`myhot-files.tar.gz`（含数据，别长期留着）。

---

## 12. 海外信源抓不到：服务器代理（mihomo）

大陆服务器直连海外站点会抖动/被墙（Hugging Face、Medium 稳定超时；GitHub 时好时坏；DNS 污染会解析到假 IP）。**本地开发机有 Clash 所以本地测试全正常，但服务器是独立的网络环境，需要自己的出口。** 项目原生支持：`.env` 的 `EGRESS_PROXY_URL`——只有非 `.cn` 的信源走它，国内源、模型接口、付费 API（Dajiala 等）都直连。

### 12.1 部署 mihomo（Clash 内核，Docker 方式）

1. 把你的 Clash 订阅配置存到 `/etc/mihomo/config.yaml`（`chmod 600`）。
2. 检查/修改配置：`allow-lan: true`；把最终规则 `MATCH,其他（默认）` 改成指向你的主力代理组（如 `MATCH,⚡️ 代理`），原因见 12.3 的坑 3。
3. 起容器（网络名是 compose 项目名加 `_default`）：

```bash
docker run -d --name mihomo --restart unless-stopped --network aihot_default \
  -v /etc/mihomo:/root/.config/mihomo -p 127.0.0.1:7890:7890 metacubex/mihomo:latest
```

### 12.2 接入站点

```bash
cd /www/dk_project/dk_app/dk_embhot
printf '\n%s\n' 'EGRESS_PROXY_URL=http://mihomo:7890' >> .env   # 用 printf 防坑 1
docker compose up -d --force-recreate api worker               # 必须重建，防坑 2
```

### 12.3 三个实测踩过的坑

1. **`.env` 末尾没有换行符时，`>>` 追加会接到上一行行尾**：碰上注释行就变成注释的一部分，变量根本不存在。追加后 `tail -2 .env` 确认变量独占一行；用 `printf '\n%s\n' '...' >> .env` 可防。
2. **`docker compose restart` 不重读 `.env`**：环境变量是容器创建时注入的。改 `.env` 后必须 `docker compose up -d --force-recreate <服务>`，再 `docker compose exec <服务> printenv <变量>` 验证真的进去了。
3. **mihomo 的 MATCH 组要选对**：站点防 DNS-rebinding 的设计是「先 DoH 解析、再 CONNECT 解析出的 **IP**」，mihomo 看不到域名只按 IP 分流——**域名规则（DOMAIN-SUFFIX）不生效**，流量走最终 `MATCH` 的组。目标站（HF/Medium）会拒某些节点的 IP，所以要让 MATCH 指向能通目标站的那个节点组。排查手法：`curl -x http://127.0.0.1:7890 <url>`（域名 CONNECT，走域名规则）通、真实 fetch（IP CONNECT）不通，就是两组节点的差异。

### 12.4 验证（worker 里跑真实抓取代码）

```bash
docker compose exec -T worker node --input-type=module -e "
const { guardedFetch } = await import('/app/packages/backend/src/lib/http-fetch.ts');
const r = await guardedFetch('https://huggingface.co/api/daily_papers', { timeoutMs: 30000 });
console.log(r.status);"
```

### 12.5 对方 WAF 拦截的源（代理也救不了）

Cloudflare JS 盾（如 The Robot Report）和 IP 层 403（如乐鑫 Newsroom）从任何出口都抓不到正文，浏览器 UA 也没用——在后台暂停这些源即可，别硬试。

---

## 附录 A：命令到底做了什么（看懂即可，不用敲）

服务器上的 `docker compose up -d --build`（= 宝塔的「重建」）逐行翻译：

1. 读当前目录的 `docker-compose.yml` 和 `.env`；
2. 看到 `build: .`，就把这个目录的源码 + `Dockerfile` **构建成镜像**（第一次慢，之后有缓存）——这就是"源码扮演安装包"的时刻；
3. 创建专用网络（5 个容器在内网里互访：`web` → `api` → `db`）和数据卷（`db` 的数据、上传的文件，**重建/更新不会丢**）；
4. 启动 `db`（数据库）→ `setup`（建表、导示范信源，跑完自动退出）→ `api`（接口）→ `worker`（抓取、调模型、定时任务）→ `web`（网页）；
5. `-d` 表示后台运行。整个过程的输出就是你在「编排日志」里看到的东西。

所以：**上传源码 = 把"安装包"放上服务器；点重建 = 安装并运行**。以后更新就是"换安装包 + 再点一次重建"。

## 附录 B：命令兜底速查（宝塔「终端」里用）

```bash
cd /www/dk_project/dk_app/dk_embhot    # 你的编排目录

docker compose up -d --build        # = 「重建」：构建并启动
docker compose ps                   # 看 5 个容器的状态
docker compose logs -f --tail 100 api worker web   # 看日志（= 编排日志）
docker compose restart api worker   # 只重启后端
docker compose stop                 # 全停
```

## FAQ

**Q：能全程可视化吗？**
能。源码上传、解压、编排配置、.env、启动、建站、证书、反代全部在宝塔界面完成。只有「本地打包」和「生成随机密码」两条命令，跑在你自己 Mac 上。

**Q：为什么不做一个现成镜像让我直接拉？**
因为这个站的行业内容、站点文案、提示词都在源码里（`site/`、`industry/`），改成你自己的行业要动源码再构建。源码目录就是你的"安装包"。

**Q：Docker 要打包成什么文件上传吗？**
不是打包 Docker。上传的是 `/tmp/embhot.tar.gz`（项目源码压缩包），Docker 负责在服务器上把它构建并跑起来。

**Q：前端要传 OBS 吗？数据库要买云数据库吗？**
都不用。前端是 `web` 容器里的服务（服务端渲染，不是静态文件）；数据库是 `db` 容器，数据存在服务器。OBS 可以拿来存数据库每日备份（第 10 节）。

**Q：本地测试产生的数据会随打包带上去吗？**
不会。数据在本地 PostgreSQL 里（不在项目目录），`.data`、`.env` 打包时也排除了，服务器是空库起步。想带数据上去见第 11 节（导出 → 上传 → 恢复）。

**Q：迁移报 `migration ._0001_core.sql failed: invalid message format`？**
macOS 打包混入的 `._*` 元数据文件被当成了迁移 SQL。服务器上 `find <编排目录> -name '._*' -delete` 清掉，重新「重建」。新打包命令已带 `COPYFILE_DISABLE=1` 和 `--exclude '._*'` 预防。

**Q：setup 报 `password authentication failed for user "aihot"`（28P01）？**
改过 `.env` 的 `POSTGRES_PASSWORD` 时会发生：数据卷里存的是**第一次**初始化的旧密码，`.env` 换新值不会自动改数据库里的密码（容器 env 变了也没用）。修法一条命令（在编排目录执行）：

```bash
PW=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
docker exec aihot-db-1 psql -U aihot -d aihot -c "ALTER USER aihot WITH PASSWORD '$PW';"
```

验证密码时注意：容器里 `psql` 不加 `-h` 走 Unix socket（trust 认证，**不查密码**，会假阳性）；要加 `-h 127.0.0.1` 走 TCP 才是真认证。

**Q：「重建」会丢数据吗？**
不会。数据在 Docker 卷（`db` 数据、上传文件）里，重建/更新只换代码和镜像。只有 `docker compose down -v` 才会删数据（宝塔界面上别点「删除」编排，那可能会连卷一起删，删前看清提示）。
