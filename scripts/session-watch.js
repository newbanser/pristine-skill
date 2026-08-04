#!/usr/bin/env node
/**
 * session-watch — companion script for the pristine skill.
 *
 * Counts user turns in the current Claude Code session and prints a
 * reminder when the session exceeds the threshold (default 15), backing
 * the skill's 15-turn rule with a mechanical check.
 *
 * Claude Code Stop hooks receive JSON on stdin; transcript_path points at
 * the current session's JSONL, so no session discovery is needed. Exit
 * code is always 0 — this is a reminder, not a gate.
 *
 * Wire it in settings.json:
 *   "hooks": { "Stop": [ { "matcher": "", "hooks": [ { "type": "command",
 *     "command": "node /path/to/session-watch.js --threshold 15" } ] } ] }
 */
const fs = require('fs')

const args = process.argv.slice(2)
const thresholdIdx = args.indexOf('--threshold')
const THRESHOLD = thresholdIdx >= 0 ? parseInt(args[thresholdIdx + 1], 10) : 15

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
      if (entry.type === 'user' || entry.message?.role === 'user') turns++
    } catch {}
  }
} catch {
  process.exit(0)
}

if (turns > THRESHOLD) {
  console.log(
    `Session is ${turns} turns in (threshold ${THRESHOLD}) — history is ` +
    'snowballing. Start a fresh session (/clear) to keep context lean and cost flat.'
  )
}
