#!/usr/bin/env node
/**
 * sync-skills.js — pristine SKILL.md 三位置同步
 *
 * 真源：pristine-skill/SKILL.md
 * 目标：全局skill + 项目skill
 * 用法：node scripts/sync-skills.js [--verify]
 *   --verify 只校验不一致，不同步
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const SOURCE = path.join(__dirname, '..', 'SKILL.md')
const TARGETS = [
  'C:/Users/Administrator/.claude/skills/pristine/SKILL.md',
  'D:/qingfeng/.claude/skills/pristine/SKILL.md',
]

function md5(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')
}

const verifyOnly = process.argv.includes('--verify')
const srcHash = md5(SOURCE)
let mismatches = 0

for (const t of TARGETS) {
  if (!fs.existsSync(t)) { console.log(`MISSING: ${t}`); mismatches++; continue }
  const h = md5(t)
  if (h !== srcHash) {
    console.log(`DRIFT: ${t}`)
    if (!verifyOnly) {
      fs.copyFileSync(SOURCE, t)
      console.log(`  -> synced`)
    }
    mismatches++
  } else {
    console.log(`OK: ${t}`)
  }
}

if (verifyOnly && mismatches > 0) {
  console.log(`\n${mismatches} file(s) out of sync — run without --verify to sync`)
  process.exit(1)
}
console.log(verifyOnly ? '\nAll in sync' : `\nSynced ${TARGETS.length - mismatches} file(s)`)