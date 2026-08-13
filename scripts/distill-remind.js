#!/usr/bin/env node
/**
 * distill-remind — companion script for the bailu skill.
 *
 * Reminds the assistant to distill (沉淀) when the draft box has been
 * silent too long. Mechanical timing only: it answers WHEN, never WHAT
 * (what to capture is the model's job). Prints one reminder line when
 * the newest draft in 03-episodic is older than --days (default 1) and
 * the session has seen enough real user turns (>= --min-turns, default 3)
 * to have material worth distilling. Silent otherwise — a reminder hook
 * that fires every turn would just burn tokens.
 *
 * UserPromptSubmit hooks receive JSON on stdin; transcript_path points at
 * the current session's JSONL, so no session discovery is needed. Exit
 * code is always 0 — this is a reminder, not a gate.
 *
 * Wire it in settings.local.json alongside session-watch:
 *   "hooks": { "UserPromptSubmit": [ { "hooks": [
 *     { "type": "command", "command": "node .../session-watch.js --threshold 15" },
 *     { "type": "command", "command": "node .../distill-remind.js --days 1 --min-turns 3" } ] } ] }
 */
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const dayIdx = args.indexOf('--days')
const DAYS = dayIdx >= 0 ? parseInt(args[dayIdx + 1], 10) : 1
const turnIdx = args.indexOf('--min-turns')
const MIN_TURNS = turnIdx >= 0 ? parseInt(args[turnIdx + 1], 10) : 3
const dirIdx = args.indexOf('--dir')
const DIR_ARG = dirIdx >= 0 ? args[dirIdx + 1] : null

// The draft box — newest file there is the "last distilled" marker
const DRAFT_DIR = DIR_ARG || (process.env.HD_VAULT
  ? path.join(process.env.HD_VAULT, 'bailu/03-episodic')
  : 'D:/hd/bailu/03-episodic')

function newestDraftMtime() {
  try {
    const files = fs.readdirSync(DRAFT_DIR).filter(f => f.endsWith('.md'))
    if (files.length === 0) return null
    let newest = 0
    for (const f of files) {
      const m = fs.statSync(path.join(DRAFT_DIR, f)).mtimeMs
      if (m > newest) newest = m
    }
    return newest
  } catch {
    return null
  }
}

let transcriptPath = null
try {
  const raw = fs.readFileSync(0, 'utf8').trim()
  if (raw) transcriptPath = JSON.parse(raw).transcript_path
} catch {
  /* no stdin JSON — fall through, still run the check */
}

// Count genuine user turns (tool results are also user entries with a
// tool_result block; same filter as session-watch)
let turns = 0
if (transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const entry = JSON.parse(line)
        if (entry.type === 'user' && entry.message?.content) {
          const c = entry.message.content
          const isToolResult = Array.isArray(c) && c.some(b => b.type === 'tool_result')
          if (!isToolResult) turns++
        }
      } catch { /* skip malformed lines */ }
    }
  } catch {
    turns = MIN_TURNS + 1 // transcript unreadable — don't block the reminder
  }
}
if (turns < MIN_TURNS) process.exit(0)

const mtime = newestDraftMtime()
const silenceMs = mtime ? Date.now() - mtime : Infinity
if (silenceMs < DAYS * 24 * 60 * 60 * 1000) process.exit(0)

// Reminder fires — one line, model decides WHAT to distill
console.log(
  `[distill-remind] 草稿箱已 ${mtime ? Math.floor(silenceMs / 86400000) + ' 天' : '从未'} 未更新（阈值 ${DAYS} 天）。` +
  `本轮有值得沉淀的吗（的习惯/表达/思维/金句/缺点/里程碑/交付产出）？有则按检查清单入草稿箱。`
)
