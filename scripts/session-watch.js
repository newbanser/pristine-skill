#!/usr/bin/env node
/**
 * session-watch — companion script for the pristine skill.
 *
 * Measures the REAL context water level AND the water meter, and prints
 * a reminder when the level crosses the threshold — no turn counting.
 *
 * Two gauges (2026-08-18, 's water-meter framing):
 *
 *   WATER LEVEL  — how full the pool is. The last assistant message in the
 *   transcript carries a `usage` block with the exact token counts of the
 *   most recent API call: `cache_read_input_tokens + input_tokens +
 *   cache_creation_input_tokens + output_tokens` = the full context the
 *   model is actually reading on the next turn. This is the pool's current
 *   fill level — the signal for "close the valve and switch pools" (reset).
 *
 *   WATER METER  — how much water this pool has consumed. The transcript
 *   is a redundant store (every message re-embeds the full context), so
 *   file size is NOT consumption. True usage accumulates only the
 *   per-message deltas: `output_tokens` (what the model actually generated
 *   this turn) + `cache_creation_input_tokens` (first-time writes). Reading
 *   from cache is nearly free, so it is deliberately not counted — metering
 *   it would double-count the same water over and over. The meter tells
 *   whether the pool's useful life was earned (heavy task ≈ spent budget).
 *
 * Two levels of reminder (2026-08-20, : "如何做到肯定提醒"):
 *
 *   THRESHOLD (default 70%) — soft reminder: prints to stdout, lands in the
 *   next prompt's context, the model relays it. Missable if the model is
 *   deep in a task or the session compacts right after.
 *
 *   BLOCK (default 90%) — hard reminder: prints a user-facing message in
 *   Chinese and exits 1, which ABORTS the user's prompt in Claude Code —
 *   the message is shown to the user directly and the prompt won't run
 *   until they act (/clear). This is the guaranteed channel: at 90% the
 *   pool is about to compact anyway, so blocking is protective, not rude.
 *
 * With --checkpoint <path>, the reminder also tells the agent to write
 * the checkpoint before resetting, and a checkpoint already on disk
 * from a previous session prints a restore instruction at the start of
 * the next one.
 *
 * UserPromptSubmit hooks receive JSON on stdin; transcript_path points at
 * the current session's JSONL, so no session discovery is needed.
 *
 * Wire it in settings.json:
 *   "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
 *     "command": "node /path/to/scripts/session-watch.js --threshold 70 \
 *     --block 90 --checkpoint /path/to/.claude/checkpoint.md" } ] } ] }
 */
const fs = require('fs')

const args = process.argv.slice(2)
const thrIdx = args.indexOf('--threshold')
const THRESHOLD = thrIdx >= 0 ? parseFloat(args[thrIdx + 1]) : 70
const cpIdx = args.indexOf('--checkpoint')
const CHECKPOINT = cpIdx >= 0 ? args[cpIdx + 1] : null
const maxIdx = args.indexOf('--max')
const MAX = maxIdx >= 0 ? parseFloat(args[maxIdx + 1]) : 200000
const blkIdx = args.indexOf('--block')
const BLOCK = blkIdx >= 0 ? parseFloat(args[blkIdx + 1]) : 90

let transcriptPath = null
try {
  const raw = fs.readFileSync(0, 'utf8').trim()
  if (raw) transcriptPath = JSON.parse(raw).transcript_path
} catch {}

if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0)

let turns = 0
let lastTokens = 0
let usedTokens = 0
let pct = 0
try {
  for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      if (entry.type === 'user' && entry.message?.role === 'user') {
        const content = entry.message.content
        const isToolResult = Array.isArray(content) &&
          content.some(block => block?.type === 'tool_result')
        if (!isToolResult) turns++
      }
      // 水位：最后一条带 usage 的消息 = 最近一次 API 调用的真实上下文
      const usage = (entry.message && entry.message.usage) || entry.usage
      if (usage) {
        lastTokens =
          (usage.input_tokens || 0) +
          (usage.cache_creation_input_tokens || 0) +
          (usage.cache_read_input_tokens || 0) +
          (usage.output_tokens || 0)
        // 水表：逐条累计真实增量（输出 + 首次写入；缓存读≈免费不计，避免同一池水反复计量）
        usedTokens += (usage.output_tokens || 0) + (usage.cache_creation_input_tokens || 0)
      }
    } catch {}
  }
  pct = (lastTokens / MAX) * 100
} catch {
  process.exit(0)
}

// Checkpoint on disk from a previous session → print restore instruction
// at the start of the next one. Shown once, before any threshold talk.
if (CHECKPOINT && turns === 1 && fs.existsSync(CHECKPOINT)) {
  console.log(
    '[pristine] checkpoint found at ' + CHECKPOINT + ' — resume from it ' +
    '(' + fs.readFileSync(CHECKPOINT, 'utf8').split('\n')[0].replace(/^#+\s*/, '') +
    '). Read it, do the next step, then overwrite/delete it — done is done.'
  )
}

if (pct >= THRESHOLD) {
  let msg =
    `池水 ${pct.toFixed(0)}%（${Math.round(lastTokens / 1000)}k / ${Math.round(MAX / 1000)}k）` +
    `— 超阈值 ${THRESHOLD}%；水表 ${Math.round(usedTokens / 1000)}k（约 ${(usedTokens / MAX).toFixed(1)} 池）` +
    '. History is snowballing: write the checkpoint and ' +
    'start a fresh session (/clear) to keep context lean and cost flat.'
  if (CHECKPOINT) {
    msg += ` Write it at ${CHECKPOINT}: current task / progress / next step / open questions — then /clear, and the next session resumes from disk.`
  }
  console.log(msg)
}

// Hard block: 90%+ means the pool is about to compact anyway — abort the
// prompt with a user-facing message so the reminder CANNOT be missed
// (2026-08-20, : "如何做到肯定提醒"). Exit 1 = Claude Code shows the
// message to the user and refuses to run the prompt until they /clear.
if (pct >= BLOCK) {
  console.error(
    `\n⚠️ 池水已到 ${pct.toFixed(0)}%（${Math.round(lastTokens / 1000)}k / ${Math.round(MAX / 1000)}k），再往下就是压缩，越压越糊、越花越多。` +
    (CHECKPOINT
      ? `\n请先让 Claude 写检查点（${CHECKPOINT}），然后 /clear 开新会话，从检查点继续。\n`
      : `\n请直接 /clear 开新会话。\n`)
  )
  process.exit(1)
}

