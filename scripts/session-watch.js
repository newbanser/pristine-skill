#!/usr/bin/env node
/**
 * session-watch — companion script for the pristine skill.
 *
 * Measures the REAL context water level and prints a reminder when it
 * crosses the threshold — no more turn counting.
 *
 * How water level is measured: the last assistant message in the session
 * transcript carries a `usage` block with the exact token counts of the
 * most recent API call. `cache_read_input_tokens + input_tokens +
 * cache_creation_input_tokens + output_tokens` = the full context the
 * model is actually reading on the next turn. That number is the water
 * level. Turn count was only ever a proxy for it — the proxy is gone.
 *
 * With --checkpoint <path>, the reminder also tells the agent to write
 * the checkpoint before resetting, and a checkpoint already on disk
 * from a previous session prints a restore instruction at the start of
 * the next one.
 *
 * UserPromptSubmit hooks receive JSON on stdin; transcript_path points at
 * the current session's JSONL, so no session discovery is needed. Exit
 * code is always 0 — this is a reminder, not a gate.
 *
 * Wire it in settings.json:
 *   "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
 *     "command": "node /path/to/scripts/session-watch.js --threshold 70 \
 *     --checkpoint /path/to/.claude/checkpoint.md" } ] } ] }
 */
const fs = require('fs')

const args = process.argv.slice(2)
const thrIdx = args.indexOf('--threshold')
const THRESHOLD = thrIdx >= 0 ? parseFloat(args[thrIdx + 1]) : 70
const cpIdx = args.indexOf('--checkpoint')
const CHECKPOINT = cpIdx >= 0 ? args[cpIdx + 1] : null
const maxIdx = args.indexOf('--max')
const MAX = maxIdx >= 0 ? parseFloat(args[maxIdx + 1]) : 200000

let transcriptPath = null
try {
  const raw = fs.readFileSync(0, 'utf8').trim()
  if (raw) transcriptPath = JSON.parse(raw).transcript_path
} catch {}

if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0)

let turns = 0
let lastTokens = 0
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
    `Context water level ${pct.toFixed(0)}% (${Math.round(lastTokens / 1000)}k of ${Math.round(MAX / 1000)}k) ` +
    `— above threshold ${THRESHOLD}%. History is snowballing: write the checkpoint and ` +
    'start a fresh session (/clear) to keep context lean and cost flat.'
  if (CHECKPOINT) {
    msg += ` Write it at ${CHECKPOINT}: current task / progress / next step / open questions — then /clear, and the next session resumes from disk.`
  }
  console.log(msg)
}
