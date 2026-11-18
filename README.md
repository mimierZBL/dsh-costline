# Reply token cost (回复用量与费用)

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

Real example from this session: the Turn that built this plugin ran 80 Steps
with 113 tool calls, recorded 10,494,193 tokens (only 1,276 characters of final
reply text), and estimates to about ¥0.692. A line computed from the final
"任务已完成" text alone would have shown a few hundred tokens instead.

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

Prices are the official DeepSeek API rates in `PRICES` (CNY per 1,000,000
tokens, as of 2026-10):

| Model | Window | Cache hit | Cache miss | Output |
| --- | --- | --- | --- | --- |
| `deepseek-flash` | peak | ¥0.04 | ¥2 | ¥8 |
| `deepseek-flash` | off-peak | ¥0.02 | ¥1 | ¥4 |
| `deepseek-v4-pro` | peak | ¥0.30 | ¥9 | ¥27 |
| `deepseek-v4-pro` | off-peak | ¥0.15 | ¥4.5 | ¥13.5 |

Peak is Monday-Friday 09:00-12:00 and 14:00-18:00 Asia/Shanghai; every other
time is off-peak, judged from the Turn's end time. Statutory Chinese holidays
are treated as peak. The value is a local estimate, never a bill: no cost is
shown when the Turn used an unpriced or non-official model, used models with
different rates, or lacks the cached/uncached split; the header then says
`费用未知` and the hover text explains why.

## Customizing

Edit `PRICES` and `MODEL_LABELS` in `client.js`. The table is keyed by the
route model id; display-name aliases such as `DeepSeek-V4.1-Flash` are matched
too. Cache writes, when a provider reports them, are priced at the cache-miss
rate; DeepSeek itself does not bill a separate cache-write price.
