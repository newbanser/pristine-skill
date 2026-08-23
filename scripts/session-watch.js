#!/usr/bin/env node
/**
 * session-watch — companion script for the pristine skill.
 *
 * Measures the REAL context water level AND the water meter, prints a
 * reminder when the level crosses the threshold — no turn counting.
 *
 * WATER LEVEL — how full the pool is. Last assistant message carries a
 * `usage` block: cache_read + input + cache_creation + output = the full
 * context the model reads on the next turn. Signal for "close the valve."
 *
 * WATER METER — how much water this pool consumed. Accumulates per-message
 * deltas: output_tokens + cache_creation_input_tokens. Cache reads are
 * nearly free, deliberately not counted. Tells whether the pool earned
 * its life: heavy task ≈ 1.5 pools normal; light chat ≈ 4 pools is a leak.
 *
 * THRESHOLD (default 70%) — soft reminder: stdout, model relays it.
 * BLOCK (default 80%) — hard reminder: user-facing message + exit 1,
 * aborts the prompt. Fires BEFORE platform compaction (observed 83-84%).
 *
 * With --checkpoint <path>, reminder also tells agent to write checkpoint
 * before resetting; existing checkpoint prints restore instruction next session.
 *
 * Wire it in settings.json:
 *   "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
 *     "command": "node /path/to/scripts/session-watch.js --threshold 70 \
 *     --block 80 --max 200000 --checkpoint /path/to/.claude/checkpoint.md \
 *     --backup /path/to/backup" } ] } ] }
 */
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const thrIdx = args.indexOf('--threshold')
const THRESHOLD = thrIdx >= 0 ? parseFloat(args[thrIdx + 1]) : 70
const cpIdx = args.indexOf('--checkpoint')
const CHECKPOINT = cpIdx >= 0 ? args[cpIdx + 1] : null
const maxIdx = args.indexOf('--max')
const MAX = maxIdx >= 0 ? parseFloat(args[maxIdx + 1]) : 200000
const blkIdx = args.indexOf('--block')
const BLOCK = blkIdx >= 0 ? parseFloat(args[blkIdx + 1]) : 80
const bkpIdx = args.indexOf('--backup')
const BACKUP = bkpIdx >= 0 ? args[bkpIdx + 1] : null
const isStop = args.includes('--stop')

let transcriptPath = null
try {
  const raw = fs.readFileSync(0, 'utf8').trim()
  if (raw) transcriptPath = JSON.parse(raw).transcript_path
} catch {}
if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0)

// ===== 读取 transcript，计算水位表 + 水表 + 轮次 =====
let lastTokens = 0
let usedTokens = 0
let turns = 0
for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
  if (!line.trim()) continue
  try {
    const entry = JSON.parse(line)
    if (entry.type === 'user') turns++
    const usage = (entry.message && entry.message.usage) || entry.usage
    if (usage) {
      lastTokens =
        (usage.input_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0) +
        (usage.output_tokens || 0)
      usedTokens += (usage.output_tokens || 0) + (usage.cache_creation_input_tokens || 0)
    }
  } catch {}
}
const pct = (lastTokens / MAX) * 100

// ===== Stop 时机：assistant 回复完成时测（只读提醒，不阻断） =====
// 实测水位单轮可暴涨 +22pp，80% 阻断必须在工具链跑完的当口拦截，
// 等下一轮用户消息时平台 83-84% 已先压缩。
if (isStop) {
  if (pct >= THRESHOLD) {
    console.log(
      `[pristine] 池水 ${pct.toFixed(0)}%（${Math.round(lastTokens / 1000)}k / ${Math.round(MAX / 1000)}k）— 超阈值 ${THRESHOLD}%；水表 ${Math.round(usedTokens / 1000)}k（约 ${(usedTokens / MAX).toFixed(1)} 池）。` +
      '会话已接近压缩线，本轮收尾请沉淀 + 写检查点 + /clear 开新会话。'
    )
  }
  process.exit(0)
}

// ===== UserPromptSubmit 时机：用户发消息时测 =====

// 上一会话留下的检查点 → 新会话开头打印恢复指引
if (CHECKPOINT && turns === 1 && fs.existsSync(CHECKPOINT)) {
  const firstLine = fs.readFileSync(CHECKPOINT, 'utf8').split('\n')[0].replace(/^#+\s*/, '')
  console.log(
    `[pristine] checkpoint found at ${CHECKPOINT} — resume from it (${firstLine}). ` +
    'Read it, do the next step, then overwrite/delete it — done is done.'
  )
}

// 软提醒：进上下文，模型转述
if (pct >= THRESHOLD) {
  let msg =
    `池水 ${pct.toFixed(0)}%（${Math.round(lastTokens / 1000)}k / ${Math.round(MAX / 1000)}k）` +
    `— 超阈值 ${THRESHOLD}%；水表 ${Math.round(usedTokens / 1000)}k（约 ${(usedTokens / MAX).toFixed(1)} 池）` +
    '. History is snowballing: write the checkpoint and start a fresh session (/clear) to keep context lean and cost flat.'
  if (CHECKPOINT) {
    msg += ` Write it at ${CHECKPOINT}: current task / progress / next step / open questions — then /clear, and the next session resumes from disk.`
  }
  console.log(msg)
}

// 硬阻断：exit 1 中止用户消息，抢在平台压缩前关门
// 阻断瞬间模型没有回合，写不了检查点——所以机器自己备份最近 150 行对话原文
if (pct >= BLOCK) {
  let saved = ''
  if (BACKUP) {
    try {
      fs.mkdirSync(BACKUP, { recursive: true })
      const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n')
      const tail = lines.filter(l => l.trim()).slice(-150)
      const md = tail.map(l => {
        try {
          const e = JSON.parse(l)
          const m = e.message || {}
          if (e.type === 'user') {
            if (m.role === 'user') {
              const c = m.content
              const text = Array.isArray(c)
                ? c.filter(b => b && b.type === 'text').map(b => b.text).join('\n').trim()
                : String(c || '')
              return text ? `## USER\n${text}` : ''
            }
            return `[tool results]`
          }
          if (e.type === 'assistant' && m.content) {
            const c = m.content
            const text = Array.isArray(c)
              ? c.filter(b => b && b.type === 'text').map(b => b.text).join('\n').trim()
              : String(c || '')
            return text ? `## ASSISTANT\n${text}` : ''
          }
          return ''
        } catch { return '' }
      }).filter(Boolean)
      if (md.length) {
        const file = path.join(BACKUP, `紧急对话备份-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.md`)
        fs.writeFileSync(file, `# 会话紧急备份（水位 ${pct.toFixed(0)}% 阻断时自动保存）\n\n> 机器落盘，未整理；新会话据此补沉淀/检查点。\n\n` + md.join('\n\n'))
        saved = file
      }
    } catch {}
  }
  console.error(
    `\n⚠️ 池水已到 ${pct.toFixed(0)}%（${Math.round(lastTokens / 1000)}k / ${Math.round(MAX / 1000)}k），` +
    `平台约在 83-84% 自动压缩，再继续就会丢记忆。` +
    (saved ? `\n最近对话已自动备份到：${saved}，无损失。` : '') +
    (CHECKPOINT
      ? `\n请 /clear 开新会话，从检查点（${CHECKPOINT}）继续。\n`
      : `\n请直接 /clear 开新会话。\n`)
  )
  process.exit(1)
}
