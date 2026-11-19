# DSH Costline 0.1.0 发布日材料

维护者批准后再发。把各段里的 `REPO` 换成已公开的仓库链接，附本仓库的实际截图。社交文案以 npm 已公开且读回版本为前提。

## 发布日检查

- [ ] 确认公开仓库、署名、MIT、`dsh-plugin` topic 和 npm 包名。
- [ ] 重跑 37 项单测、语法、JSON 和官方索引校验。确认 `private: false`，包内有 bundle patch 和运行文件，且无 build/lifecycle 脚本、测试或本地 profile。
- [ ] 用将要发布的 tarball 跑干净 profile 安装。核对已测版本、仅页脚、用量对账与浅/深主题素材。
- [ ] 依 [发布手册](PUBLISH.zh.md) 的顺序核对 npm 读回、GitHub Release、Pages 索引与图标。
- [ ] 先发一处公告，检查链接和安装指令，再发其他渠道。查阅各社区当日推广规则并选择合适版块。
- [ ] 提交目录条目前检查是否已自动收录。记录各渠道的链接和状态，有错误时更新原帖。

## X

**中文**

> DSH 一轮跑完，思考、工具往返和重试一共用了多少 token？我做了 DSH Costline，把用量和预估直接放在完成用时旁。会话成本可单独查看主会话、子智能体和压缩，本地计算。MIT · `dsh plugin --profile web add dsh-costline` · REPO

**English**

> How many tokens did that DSH turn actually use? Costline puts recorded tokens and estimated cost next to the elapsed time. A local ledger separates the main chat, child agents and compaction. MIT. `dsh plugin --profile web add dsh-costline` · REPO

## 即刻

**中文**

> 最近用 DeepSeek Harness 跑长任务时，我想在回复结束的地方直接看到这轮用量，所以做了 DSH Costline。标题用量含思考、工具往返和重试。会话总账能拆看主会话、本地子智能体和压缩摘要。遇到未知路由还会保留 token 和原因。附的深浅截图是在临时 profile 拍的，数据是合成的。欢迎试用并反馈哪些缺项最需要说明。REPO

**English**

> I built DSH Costline because I kept wanting one number after a long DeepSeek Harness turn. The header shows recorded tokens. The separate session ledger makes child agents and compaction visible, alongside the main chat. The screenshots use synthetic history in a temporary profile. Feedback on the coverage labels is welcome. REPO

## V2EX

**中文标题** `做了个 DSH 插件，把整轮 token 和预估费用放到用时旁`

> DSH Costline 使用模型记录的整轮用量，覆盖思考、工具往返和重试。设置可覆写 DeepSeek 费率及币种，合计按币种展示。会话总账拆为主会话、子会话和压缩摘要，数据缺项会标出来。插件运行时零外部请求。安装 `dsh plugin --profile web add dsh-costline`，兼容范围、截图与回退说明见 REPO。欢迎带 DSH 版本反馈。

**English title** `DSH Costline — whole-turn token usage in the chat header`

> This MIT plugin reads usage already recorded by DSH, including tool follow-ups and retries. There's an editable DeepSeek rate table and a separate ledger for sessions, child agents and compaction. It runs offline and includes a footer-only mode. Install with `dsh plugin --profile web add dsh-costline`. Version and scope details are in REPO.

## Linux.do

**中文标题** `开源 DSH Costline，整轮和会话用量可以对账了`

> 换模型、用工具或发生重试时，单看最后一段输出很难理解用量。Costline 把 DSH 已记录的整轮 token 放在标题边，按 DeepSeek 峰谷估算。会话总账对缺用量、未读子会话和未知费用分别提示。自定义费率保存在本机 profile。附安装命令、版本矩阵和截图，求测试反馈。REPO

**English title** `Open-source DSH Costline for reconciling turn and session usage`

> Costline makes recorded turn tokens visible at the end of a DSH task. Its session ledger shows known cost by currency and explains incomplete coverage. Rates stay in the local profile. See REPO for the install command, tested versions and captured screenshots.

## Reddit

**Title** `I built a local whole-turn cost line and session ledger for DeepSeek Harness`

> I wanted to reconcile long tool-heavy turns with what DSH had recorded. Costline adds tokens and an estimate beside the elapsed time, with a footer-only option. The ledger includes local child agents up to a visible cap and separately recorded compaction calls. It keeps known amounts in their original currencies. There are no runtime external requests. MIT. `dsh plugin --profile web add dsh-costline`. The screenshots use synthetic history. I'm interested in which gap labels are unclear when you try an older session. REPO

**中文备选**

> 我做了一个离线的 DSH 用量插件，方便核对长任务的思考、工具往返和重试。用量在完成用时旁，也可切到页脚。会话总账分别列出主会话、本地子智能体与独立压缩调用。欢迎反馈历史会话的缺项提示是否清楚。REPO

## 小红书

**中文标题** `用 DeepSeek Harness 跑长任务，我给它加了个会话成本按钮`

> 第一张看完成用时旁的整轮 token，第二张看会话总账里的子智能体和压缩。示例截图来自临时会话，价格可自己改，缺数据会直接标出来。路径：插件 → 添加插件 → 搜 `dsh-costline`。MIT 开源，详情见 REPO。#DeepSeekHarness #开源工具

**English caption**

> Two screenshots from my DeepSeek Harness setup: a turn-level cost estimate and a session ledger. The demo uses synthetic usage. Install DSH Costline from Plugins → Add plugin. Source and tested versions in REPO.

## GIF 分镜与待办

| 时间 | 拍摄动作 | 字幕 |
| --- | --- | --- |
| 0–3 秒 | 打开离线合成会话，聚焦标题和费用 | 同一轮的用时、token 和费用 |
| 3–6 秒 | 悬停费用，展示缓存/输出与峰谷费率 | 整轮含工具往返和重试 |
| 6–10 秒 | 打开会话成本，点击加载子会话 | 主会话、子会话、压缩分开看 |
| 10–13 秒 | 显示两种币种、缺项提示与水位 | 已知费用并列，覆盖范围可核对 |
| 13–16 秒 | 在配置中切为仅页脚，回到同一轮 | 标题不可用时可用页脚 |

- [ ] 在隔离 profile 实录，核对应用版本、费率与预期输出。
- [ ] 导出 GIF 或 MP4，检查尺寸、字幕和首帧。逐帧核对无账户名、路径、真实聊天或凭据。
- [ ] 添加 README 演示链接。未完成前保留截图与 [拍摄清单](SCREENSHOTS.md)。

## FAQ

**为什么标题金额和总账不同？** 标题按主会话的单轮模型用量计算。总账覆盖该会话其他轮次、已读本地子会话和可确认的压缩调用。

**为什么有 token 却没有费用？** 模型/路由、缓存或时间不足时仍可确认 token。对照分项原因与费率配置。

**不同模型和币种能加在一起吗？** 可计价行按自己的费率算，同币种相加。各币种分别列出。单行混合路由而缺精确分摊时保留用量与原因。

**支持离线和旧会话吗？** 已记录的会话可离线查看。历史用量不足时会标明缺项。未实测的可识别版本进入页脚，安装范围见 README。

**为什么只有 20 个子会话？** 总账只读取有限数量，防止一次打开过多本地会话。未读、超限和不可读均有提示。

**这些金额是账单吗？** 这是模型 token 估算，独立服务收费、套餐和额度以提供方账单为准。

**差评或误差怎么回复？**

> 谢谢指出差异。请提供 DSH 版本、显示位置、对应轮次和可脱敏的用量桶或缺失原因。我会用临时 profile 核对计价和日志。若标题影响使用，可先切到仅页脚。请保留原 profile 的会话内容和凭据。

## Issue 与 PR 模板

- [问题模板](../.github/ISSUE_TEMPLATE/bug_report.md) 收集 DSH 版本、位置、复现、预期与脱敏证据。
- [PR 模板](../.github/pull_request_template.md) 要求描述行为变化、回归范围、验证命令及兼容影响。
- 目录 PR 和审核说明可从 [发布手册](PUBLISH.zh.md) 复制。
