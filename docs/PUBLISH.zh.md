# DSH Costline 0.1.0 发布手册

> **RELEASE BLOCKER**　npm 发布前先替换 GitHub owner 占位并通过 `./scripts/check-release.sh --before-npm`。npm 发布后，从 registry 回填实际发布时间。部署索引及提交市场前运行完整的 `./scripts/check-release.sh`，它同时检查 owner 和每个版本的正整数 `publishTimestamp`。

本文是维护者操作手册。只有你批准发布后才执行涉及 npm、GitHub 或社区提交的命令。

## 1. 确认公开身份与预检

- 公开仓库名用 `dsh-costline`。包、索引及双语 README 的 GitHub owner 仍待填写。MIT 署名和包作者固定为 `dsh-costline contributors`。
- `market/index.json` 的 `publishTimestamp: 0` 是有效格式的占位。只有 npm 上出现这一版本后，才将它换成 npm 的实际发布时间。Pages 的早期部署应先保持未启用。
- `npm view` 在发布前做一次名称与版本核对。若名称被占用，先核实所有权。若 npm 账户或缓存有问题，在自己的终端恢复权限并完成 npm 的验证流程。无需分享令牌。

```sh
export OWNER='填已确认的 GitHub owner'
node <<'NODE'
const fs = require('node:fs')
const owner = process.env.OWNER
if (!/^[a-z\d][a-z\d-]{0,38}$/i.test(owner)) throw Error('请先填写真实 GitHub owner')
const placeholder = '<' + 'github-owner' + '>'
for (const path of ['package.json', 'market/index.json', 'README.md', 'README.zh.md']) {
  fs.writeFileSync(path, fs.readFileSync(path, 'utf8').replaceAll(placeholder, owner))
}
NODE
./scripts/check-release.sh --before-npm

npm view dsh-costline name version --json
npm test
npm pack --dry-run
mkdir -p .release
npm pack --pack-destination .release
tar -tzf .release/dsh-costline-0.1.0.tgz
shasum -a 256 .release/dsh-costline-0.1.0.tgz
```

确认包内有 MIT、两份 README、变更记录、截图清单和三张 README 相关截图，以及 bundle patch、Host/Client 入口、账本和价格模块、locale 与图标。测试、索引、临时 profile、日志和发布脚本留在包外。完成干净 profile 安装，核对兼容矩阵、标题、页脚、总账和配置。提交真实 GitHub URL 后，重新生成最终 tarball。

## 2. npm 与 GitHub Release

若尚无远端，先创建空的公开 GitHub 仓库，添加 `dsh-plugin`、`deepseek-harness` 和 `cost` topic。下面的推送、npm 发布和 Release 都由维护者执行。

```sh
# origin 只在尚未配置时添加。已有 origin 时先人工核对仓库。
git remote add origin "https://github.com/${OWNER}/dsh-costline.git"
git push -u origin main
gh repo edit "${OWNER}/dsh-costline" --add-topic dsh-plugin,deepseek-harness,cost

./scripts/check-release.sh --before-npm && npm publish .release/dsh-costline-0.1.0.tgz --access public
npm view dsh-costline@0.1.0 version engines.dsh dist.integrity --json
```

读回 npm 的时间，再提交索引。量纲为 Unix 秒。

```sh
npm view dsh-costline time --json > .release/npm-time.json
node <<'NODE'
const fs = require('node:fs')
const path = 'market/index.json'
const market = JSON.parse(fs.readFileSync(path, 'utf8'))
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const times = JSON.parse(fs.readFileSync('.release/npm-time.json', 'utf8'))
const record = market.plugins.find(entry => entry.name === pkg.name).versions.find(entry => entry.version === pkg.version)
const seconds = Math.floor(Date.parse(times[pkg.version]) / 1000)
if (!Number.isSafeInteger(seconds) || seconds <= 0) throw Error('npm 尚未返回这个版本的发布时间')
record.publishTimestamp = seconds
fs.writeFileSync(path, JSON.stringify(market, null, 2) + '\n')
NODE

./scripts/check-release.sh || exit 1
git add market/index.json
git commit -m 'Stamp npm publication time in the plugin index'
git tag -a v0.1.0 -m 'DSH Costline 0.1.0'
git push origin main
git push origin v0.1.0
gh release create v0.1.0 .release/dsh-costline-0.1.0.tgz \
  --verify-tag --title 'DSH Costline 0.1.0' --notes-file CHANGELOG.md
```

Release 简介备选：

> DSH Costline 0.1.0 puts recorded whole-turn usage and estimated DeepSeek cost in Chat. The local session ledger includes the main session, bounded child sessions, and compaction summaries. Known costs are shown by currency. Install via `dsh plugin --profile web add dsh-costline@0.1.0`.

## 3. GitHub Pages 与自建索引

完整发布校验通过后，在仓库 **Settings → Pages** 选择 **Deploy from a branch → main → / (root)**。部署成功后，验证索引和相对图标都直接返回 200。

```sh
export MARKET_URL="https://${OWNER}.github.io/dsh-costline/market/index.json"
test "$(curl -sS -o .release/pages-index.json -w '%{http_code}' "$MARKET_URL")" = 200
test "$(curl -sS -o .release/pages-icon.svg -w '%{http_code}' "${MARKET_URL%/*}/icons/cost.svg")" = 200
node -e 'const i=require("./.release/pages-index.json"); if (i.format!==1 || i.plugins.length!==1 || i.plugins[0].versions[0].publishTimestamp<=0) process.exit(1)'
cmp market/index.json .release/pages-index.json
cmp market/icons/cost.svg .release/pages-icon.svg
```

在 DSH 的 **插件 → 实验性插件 → 自定义插件索引** 启用索引功能。进入 **发现 → 添加索引源**，粘贴 `MARKET_URL`，检查卡片来源为 npm，版本为 `0.1.0`。操作说明见 [DSH 官方索引指南](https://deepseek-harness.github.io/deepseek-harness/guide/plugin-market.md)。

自建索引介绍：

> DSH Costline 的单插件索引，公开列出 npm 发行版本、DSH 安装范围和源码地址。在 DSH「发现」添加 `https://OWNER.github.io/dsh-costline/market/index.json`。

## 4. 社区收录

提交前在 Costline 仓库再次运行 `./scripts/check-release.sh`，并核对公开索引已写入 npm 实际发布时间。

### awesome-dsh-plugin

仓库公开满一天并添加 topic 后，fork 目录仓库。在 fork 的分支新增 `data/plugins/OWNER__dsh-costline.yml`，替换 `OWNER`。提交单个条目文件，README 由上游生成。规则参见 [贡献指南](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)。

```yaml
url: https://github.com/OWNER/dsh-costline
name: OWNER/dsh-costline
category: usage
description:
  en: Shows recorded whole-turn tokens and estimated DeepSeek costs with a local session ledger.
  zh: 显示实际记录的整轮 token 和 DeepSeek 预估费用，并提供本地会话总账。
```

在目录 fork 的工作树提交此文件，再打开 PR。

```sh
git switch -c add-dsh-costline
git add "data/plugins/${OWNER}__dsh-costline.yml"
git commit -m 'Add DSH Costline to usage plugins'
git push -u origin add-dsh-costline
```

PR 标题：`Add DSH Costline to usage plugins`

> DSH Costline displays recorded whole-turn tokens and a DeepSeek cost estimate in Chat, with a separate local session ledger. Install with `dsh plugin --profile web add dsh-costline@0.1.0`. The bundle declares `dsh.bundle.patch`, ships JavaScript without a build step, and is MIT licensed. The README lists verified DSH builds and the footer fallback.
>
> Source and captures: https://github.com/OWNER/dsh-costline

### DSH-Store

打开 [商城投稿表单](https://github.com/AI-Scarlett/DSH-Store/issues/new?template=plugin-submission.yml)。提交公开仓库、指向 release 的 40 位 SHA、`package.json` 和 `cordis.patch.yml`。明确说明 Auto 使用了 DSH 的 Chat 渲染注册替换，提供仅页脚选项，请商城按其保护组件规则判断可否收录。规则见 [DSH-Store 收录标准](https://dsh.store/standards/)。

```sh
git rev-list -n 1 v0.1.0
```

> DSH Costline 0.1.0（MIT），源码 https://github.com/OWNER/dsh-costline，固定提交填写 `git rev-list` 输出。插件读取 DSH 本地会话的计量投影，无外部请求、凭据读取、遥测或命令执行。只有用户保存费率或显示位置才通过 DSH 写插件配置。Auto 使用 Chat 渲染扩展点显示标题费用，用户可切换仅页脚。安装范围和已实测版本以 README 为准，附上干净 profile 安装记录及浅色、深色截图。

### dshbase 与独立 DSH Plugin Store

- 在 [dshbase 插件收录表单](https://github.com/ylwl1997/dshbase/issues/new?template=plugin-submission.yml) 填 `dsh-costline`、公开仓库、npm 包名与最贴近用量或会话的分类。插件能离线查看已有记录，生成新用量由 DSH 使用自己配置的模型。附 MIT、`dsh-plugin` topic 和 bundle 清单。
- 独立目录 [DSH Plugin Store](https://dshpluginstore.com/submit) 接收仓库链接、一句话和兼容性备注。邮箱为可选。

通用一句话：

> DSH Costline shows recorded whole-turn token usage and an estimated DeepSeek cost in Chat, with a local ledger for session turns, subagents, and compaction.

中文：

> DSH Costline 在会话中显示实际记录的整轮 token 和 DeepSeek 估算费用，并用本地总账拆分主会话、子会话和压缩摘要。
