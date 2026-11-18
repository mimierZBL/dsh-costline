# DSH Costline (回复用量与费用)

Shows the whole task's token usage and estimated RMB cost in the completed
Turn's header, right after the elapsed time:

```
已完成，用时 47 秒  本次任务消耗 10,494,193 tok，≈¥0.692   ⌄
```

The cost text keeps the header's font size and line height and uses the
DeepSeek brand blue; the rest of the header is unchanged. Hover the blue text
for the provider/model, exact token buckets, the peak or off-peak rate applied,
and the estimate note.

## What is counted

The number is **the whole Turn's exact provider-reported model usage**, not the
tokens of the final reply text:

- every Step and every tool round in the turn: each request's full prompt
  (system prompt, history, tool definitions, tool results) plus its output;
- thinking/reasoning tokens, which are part of the billed output and are
  charged at the output rate;
- every retried attempt after an LLM retry;
- edits, reads, searches, and commands: the tool output is sent back in the
  following request, so its tokens are included.

The example above was recorded in the original reply-cost plugin's README.
That turn reported 10,494,193 tokens over 80 steps and 113 tool calls.

Each user input starts a Turn; a running Turn stays one task through all of
its Steps and tool calls. A Turn's figure does not include separately billed
work: child subagent sessions, compaction summary requests, and session title
generation are separate calls in separate requests.

## How it is placed

The duration line is a single button rendered by Chat's `turn-process` node
renderer, and that button has no child slot. To put the cost after the time,
the plugin registers its own renderer under the same `conversation.chat.node`
key (`turn-process`), replacing the shipped control with a faithful copy:
same geometry, hover color, chevron, disclosure behavior, live-region
announcement, and data attributes, plus the cost span.

Reusing that key shadows shipped UI: while the plugin is enabled it owns the
completed-Turn header, and a DSH upgrade that changes the header's props,
styles, or copy can require an update here. Disabling the plugin restores the
shipped renderer. This is the cost of the requested position; the supported
alternative is the `conversation.chat.turnTail` seat below the reply.

## Pricing

The built-in CNY amounts come from the [DeepSeek API price table](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/).
Rates are per million tokens.

| Model | Window | Cache hit | Cache miss | Output |
| --- | --- | --- | --- | --- |
| `deepseek-flash` | peak | ¥0.04 | ¥2 | ¥8 |
| `deepseek-flash` | off-peak | ¥0.02 | ¥1 | ¥4 |
| `deepseek-v4-pro` | peak | ¥0.30 | ¥9 | ¥27 |
| `deepseek-v4-pro` | off-peak | ¥0.15 | ¥4.5 | ¥13.5 |

Costline uses the turn's end time in Asia/Shanghai. Workday peak windows are
09:00–12:00 and 14:00–18:00. The plugin's estimate treats announced Chinese
holidays as peak all day and applies workday hours to weekend make-up days.
DeepSeek's published billing policy treats weekends and public holidays as
off-peak. Estimates can therefore differ from your invoice. The bundled
calendar covers [2025](https://www.forestry.gov.cn/c/www/szxx/594663.jhtml),
[2026](https://big5.www.gov.cn/gate/big5/www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm),
and [2027](https://www.dxh.gov.cn/ZWGK/zc_zwgk/ZFWJ/TZGG/202611/t20261106_2875104.shtml).
Outside those years Costline uses the weekday schedule.

An unsupported route, a mix of models or rates, or insufficient cache detail
produces “cost unknown”. Hover over the cost line for the reason.

## Customizing

Open **Plugins → Built-in plugins → DSH Costline rates**. Add an official
DeepSeek provider/model pair, enter prices for cache hits, cache misses, cache
writes, or output, then save. Empty fields inherit their CNY defaults. The
default CNY cache-write value equals the built-in cache-miss value.

To use another currency, enter the currency code and all four prices in both
periods. Costline displays those amounts without exchange-rate conversion.
Saving recalculates visible completed turns. **Restore defaults** removes the
plugin's saved overrides from the active profile.

## What makes Costline different

Costline puts provider-reported whole-turn usage and a local cost estimate next
to the elapsed time. Its focus is official DeepSeek routes and the cost of the
task in front of you. Pricing and the calendar ship with the plugin. The
settings page uses DSH's built-in profile storage. Costline makes no external
network requests and does not upload conversation data.
