#!/usr/bin/env node
/**
 * source-drift — checks that frontend mirrors of backend truth sources
 * have not silently drifted.
 *
 * Some rules live once in the backend (helpers.js) and are mirrored into
 * the frontend (shared/types/student.ts) by hand, with a comment saying
 * "改动必须双向同步". Those mirrors drift silently when only one side is
 * edited. This script extracts the literal blocks by name on both sides
 * and compares them verbatim — normalized (whitespace/quote-style folded)
 * so the comparison is about the *value*, not the formatting.
 *
 * Verbatim value comparison, not execution: it reads the source text and
 * compares stringified JSON of the literal. A key missing on one side, an
 * extra value, a renamed label — all surface. Variable names may differ
 * (STAGE_FORWARD_ORDER vs FORWARD_ORDER) — the *names* are mapped below,
 * the *values* must match.
 *
 * Usage:
 *   node source-drift.js            # defaults: repo at D:/hd/hdp
 *   node source-drift.js --root <hdp>   # run from anywhere
 * Exit code 0 = clean, 1 = drift found. Prints a per-pair report.
 */
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const rootIdx = args.indexOf('--root')
const ROOT = rootIdx >= 0 ? args[rootIdx + 1] : 'D:/hd/hdp'

const BE = path.join(ROOT, 'server/src/helpers.js')
const FE = path.join(ROOT, 'teacher/src/shared/types/student.ts')
const BE_USERS = path.join(ROOT, 'server/src/routes/users.js')
const FE_EDIT = path.join(ROOT, 'teacher/src/pc/components/users/UserEditPanel.vue')
const FE_DOCS = path.join(ROOT, 'teacher/src/pc/pages/docs/index.vue')
const FE_REF = path.join(ROOT, 'teacher/src/pc/components/docs/DocReferencePanel.vue')

/** The pairs to compare: backend variable name -> frontend variable name */
const PAIRS = [
  { be: 'STAGE_FORWARD_ORDER', fe: 'FORWARD_ORDER' },
  { be: 'STAGE_BRANCHES', fe: 'SIDE_TRANSITIONS' },
  { be: 'TERMINAL_STATES', fe: 'TERMINAL_STATES' },
  { be: 'STAGE_REQUIREMENTS', fe: 'STAGE_REQUIREMENTS' },
]

/** Pairs in different files (backend var -> [file, frontend var]) */
const CROSS_FILE = [
  { be: 'ROLE_BANNED_PERMS', beFile: BE_USERS, feFile: FE_EDIT, fe: 'ROLE_BANNED_PERMS' },
  { be: 'ROLE_BANNED_PERMS', beFile: BE_USERS, feFile: FE_DOCS, fe: 'ROLE_BANNED', extraKeys: ['admin'] },
  { be: 'ROLE_BANNED_PERMS', beFile: BE_USERS, feFile: FE_REF, fe: 'ROLE_BANNED', extraKeys: ['admin'] },
]

function readOrDie(p) {
  if (!fs.existsSync(p)) {
    console.error(`✗ 找不到文件: ${p}`)
    process.exit(2)
  }
  return fs.readFileSync(p, 'utf8')
}

/** Extract the first top-level literal block assigned to a const with this name. */
function extractConst(src, name) {
  // match: (export) const NAME [: Type] = ... — the name may follow a
  // comment block, and TS annotations may sit between NAME and =.
  // Anchor on the word boundary, not the line start.
  const re = new RegExp(`\\bconst\\s+${name}[^=]*?=\\s*`, 'm')
  const m = src.match(re)
  if (!m) return null
  const start = m.index + m[0].length
  let depth = 0
  let i = start
  const openers = /[{\[(]/
  const closers = /[}\]]/
  const quote = /['"`]/
  for (; i < src.length; i++) {
    const ch = src[i]
    if (quote.test(ch)) {
      const q = ch
      i++
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++
        i++
      }
      continue
    }
    if (openers.test(ch)) depth++
    else if (closers.test(ch)) {
      depth--
      if (depth === 0) {
        i++
        break
      }
    }
  }
  return src.slice(start, i)
}

/** Fold formatting so value comparison ignores whitespace and quote style. */
function normalize(s) {
  return s
    .replace(/\s+/g, '')
    .replace(/'/g, '"')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/,([}\]])/g, '$1') // tolerate trailing commas in object/array literals
}

/** Parse a JS literal safely — bare keys and trailing commas are valid JS but
 *  not valid JSON; evaluating is more faithful than a JSON.parse regex hack. */
function parseLiteral(s) {
  try {
    return new Function('return (' + s + ')')()
  } catch {
    return null
  }
}

let failures = 0
const out = []
const log = s => out.push(s)

function comparePair(beSrc, feSrc, beName, feName, beFile, feFile, extraKeys = []) {
  const be = extractConst(beSrc, beName)
  const fe = extractConst(feSrc, feName)
  if (be === null) { log(`✗ ${beName}：后端未找到`); failures++; return }
  if (fe === null) { log(`✗ ${feName}：前端未找到`); failures++; return }
  const beN = normalize(be)
  const feN = normalize(fe)
  if (beN === feN) {
    log(`✓ ${beName} ↔ ${feName} 一致`)
    return
  }
  const b = parseLiteral(beN)
  const f = parseLiteral(feN)
  if (b !== null && f !== null && !Array.isArray(b)) {
    // Ignore known display-only keys on the frontend side (e.g. admin: [] shown
    // in docs but not listed in the backend map) — flag only real drift.
    const keys = new Set([...Object.keys(b), ...Object.keys(f)])
    const realDiff = [...keys].some(k => {
      if (extraKeys.includes(k) && b[k] === undefined) return false
      return JSON.stringify(b[k]) !== JSON.stringify(f[k])
    })
    if (!realDiff) {
      log(`✓ ${beName} ↔ ${feName} 一致（忽略展示层补充: ${extraKeys.join(', ')}）`)
      return
    }
  }
  failures++
  log(`✗ ${beName} ↔ ${feName} 漂移！`)
  if (b === null || f === null) {
    log(`    解析失败：后端=${b === null ? '失败' : 'ok'} 前端=${f === null ? '失败' : 'ok'}`)
    return
  }
  if (Array.isArray(b)) {
    const onlyB = b.filter(x => !f.includes(x))
    const onlyF = f.filter(x => !b.includes(x))
    if (onlyB.length) log(`    仅后端有: ${onlyB.join(', ')}`)
    if (onlyF.length) log(`    仅前端有: ${onlyF.join(', ')}`)
    return
  }
  const keys = new Set([...Object.keys(b), ...Object.keys(f)])
  for (const k of keys) {
    const bv = JSON.stringify(b[k])
    const fv = JSON.stringify(f[k])
    if (bv !== fv) log(`    ${k}: 后端=${bv} 前端=${fv}`)
  }
}

const beSrc = readOrDie(BE)
const feSrc = readOrDie(FE)

for (const pair of PAIRS) {
  comparePair(beSrc, feSrc, pair.be, pair.fe)
}

const beUsers = readOrDie(BE_USERS)
for (const pair of CROSS_FILE) {
  comparePair(beUsers, readOrDie(pair.feFile), pair.be, pair.fe, undefined, undefined, pair.extraKeys || [])
}

// Silent when clean — a reminder hook that prints every turn just burns tokens.
if (failures) {
  out.forEach(s => console.log(s))
  console.log(`\n✗ ${failures} 处漂移，需双向同步`)
  process.exit(1)
}
process.exit(0)
