#!/usr/bin/env node
/**
 * session-watch — companion script for the pristine skill.
 *
 * Counts real user turns in the current Claude Code session and prints a
 * reminder when the session exceeds the threshold (default 15), backing
 * the skill's session-cost law with a mechanical check.
 *
 * The turn count is a proxy — the real trigger is context water level —
 * but a hook cannot measure context directly, so the threshold stands in
 * for it (see SKILL.md §6). With --checkpoint <path>, the reminder also
 * tells the agent to write the checkpoint before resetting, and a
 * checkpoint already on disk from a previous session prints a restore
 * instruction at the start of the next session.
 *
 * Only genuine user messages count — tool results are also recorded as
 * user-typed entries in the transcript (type "user" with a tool_result
 * block), and counting them would inflate the turn count.
 *
 * UserPromptSubmit hooks receive JSON on stdin; transcript_path points at
 * the current session's JSONL, so no session discovery is needed. Exit
 * code is always 0 — this is a reminder, not a gate.
 *
 * Wire it in settings.json:
 *   "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
 *     "command": "node /path/to/scripts/session-watch.js --threshold 15 \
 *     --checkpoint /path/to/.claude/checkpoint.md" } ] } ] }
 */
const fs = require('fs')

const args = process.argv.slice(2)
const thresholdIdx = args.indexOf('--threshold')
const THRESHOLD = thresholdIdx >= 0 ? parseInt(args[thresholdIdx + 1], 10) : 15
const cpIdx = args.indexOf('--checkpoint')
const CHECKPOINT = cpIdx >= 0 ? args[cpIdx + 1] : null

let transcriptPath = null
try {
  const raw = fs.readFileSync(0, 'utf8').trim()
  if (raw) transcriptPath = JSON.parse(raw).transcript_path
} catch {}

if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0)

let turns = 0
try {
  for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      if (entry.type !== 'user' || entry.message?.role !== 'user') continue
      const content = entry.message.content
      const isToolResult = Array.isArray(content) &&
        content.some(block => block?.type === 'tool_result')
      if (!isToolResult) turns++
    } catch {}
  }
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

if (turns > THRESHOLD) {
  let msg =
    `Session is ${turns} turns in (threshold ${THRESHOLD}) — history is ` +
    'snowballing. Context water level is high: write the checkpoint and ' +
    'start a fresh session (/clear) to keep context lean and cost flat.'
  if (CHECKPOINT) {
    msg += ` Write it at ${CHECKPOINT}: current task / progress / next step / open questions — then /clear, and the next session resumes from disk.`
  }
  console.log(msg)
}
