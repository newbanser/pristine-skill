#!/usr/bin/env node
/**
 * pristine-scan — adversarial residue scanner for the pristine skill.
 *
 * Self-assessment is unreliable: the evaluator is the executor, so asking
 * "is it pristine?" always leans yes (confirmation bias). This script is
 * the mechanical check — it scans a codebase for the confession words of
 * patch piles, residue, and pre-launch migration machinery, and prints
 * file:line hits. Output is the verdict; self-assessment is not.
 *
 * 宁可多报，人工收敛误报 — over-report on purpose, let a human converge
 * the false positives. A clean scan is the claim; the scan is the evidence.
 *
 * Exit code is always 0 — a reminder, not a gate (same as session-watch).
 *
 * Usage:
 *   node pristine-scan.js [dir...]     scan targets (default: current dir)
 *   node pristine-scan.js --selftest   verify the rule table against probes
 */
const fs = require('fs')
const path = require('path')

// ===== rule table（信号词第一版：宁可多报） =====
const RULES = [
  {
    law: 'law 7',
    title: 'migration / old-shape machinery',
    why: 'pre-launch code has no installed base — old→new translation layers are residue',
    patterns: [
      /\bmigrat(?:e|ion|ed|ing|es)\b/i,
      /\bALTER TABLE\b/i,
      /\blegacy\b/i,
      /\bbackward[-\s]?compat/i,
      /\bcompat(?:ibility)?\s+(?:layer|shim|adapter)\b/i,
      /(?:^|_)(?:old|new)(?:_|$)|\.(?:old|orig|bak)\b/,
      /old[-\s]?(?:version|logic|code|shape|schema|table|field|column)s?\b/i,
      /迁移|兼容|历史遗留/,
      /旧(?:版|结构|表|字段|代码|逻辑|数据|规则|方法|接口|方案)|老(?:版|结构|代码|逻辑|数据|方法)/,
    ],
  },
  {
    law: 'law 1',
    title: 'patch-pile signals',
    why: 'a patch buys time and costs structure — fix the root rule once',
    patterns: [
      /\b(?:workaround|hotfix|kludge)\b/i,
      /\bspecial[- ]case\b/i,
      /补丁|打补丁|特殊处理|特别处理|临时(?:方案|解决|处理|修复)|兜底|规避/,
    ],
  },
  {
    law: 'law 3',
    title: 'residue / leftovers',
    why: 'no backups, drafts, dead code, commented-out blocks — git keeps history',
    patterns: [
      /\b(?:backup|unused|dead|obsolete|deprecated|orphan|leftover)s?\b/i,
      /备份|副本|死代码|废弃|弃用|不再使用|不再需要/,
    ],
  },
  {
    law: 'law 2',
    title: 'comment tells',
    why: 'comments say why, never what — note: annotations and commented-out code are residue',
    patterns: [
      /\bnote\s*:/i,
    ],
  },
]

// 注释掉的可执行代码（仅代码文件，md/yaml 的 # 和 /* 是数据不是注释）
const COMMENTED_CODE_RE = /^\s*(?:\/\/|#|\/\*|\*)\s*(?:const|let|var|function|async\s+function|class|def\s+|if\s*\(|for\s*\(|while\s*\(|return\s+|import\s+|export\s+|require\s*\(|=>)/

const CODE_EXTS = new Set(['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt', 'sh', 'bash', 'zsh', 'sql', 'vue', 'svelte'])
const TEXT_EXTS = new Set([...CODE_EXTS, 'md', 'markdown', 'txt', 'json', 'yaml', 'yml', 'toml', 'ini', 'css', 'scss', 'less', 'html', 'htm'])

const SKIP_DIR_RE = /(^|\/)(node_modules|dist|build|coverage|\.git|\.next|\.nuxt|\.output|\.cache|\.venv|venv|__pycache__|vendor|target)(\/|$)/
const SKIP_FILE_RE = /(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|composer\.lock|\.DS_Store|pristine-scan\.js)$|\.min\.(?:js|css)$/

const MAX_FILE_SIZE = 2 * 1024 * 1024

function scanFile(file, hits) {
  const ext = path.extname(file).slice(1).toLowerCase()
  if (!TEXT_EXTS.has(ext) || SKIP_FILE_RE.test(file)) return
  let size
  try {
    size = fs.statSync(file).size
  } catch {
    return
  }
  if (size > MAX_FILE_SIZE) return

  const rel = path.relative(process.cwd(), file).split(path.sep).join('/')
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of RULES) {
      if (rule.patterns.some(re => re.test(line))) {
        hits.push({ file: rel, line: i + 1, law: rule.law, title: rule.title, text: line.trim() })
      }
    }
    if (CODE_EXTS.has(ext) && COMMENTED_CODE_RE.test(line)) {
      hits.push({ file: rel, line: i + 1, law: 'law 3', title: 'commented-out code', text: line.trim() })
    }
  }
}

function walk(dir, hits) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_RE.test('/' + entry.name + '/')) continue
      walk(path.join(dir, entry.name), hits)
    } else if (entry.isFile()) {
      scanFile(path.join(dir, entry.name), hits)
    }
  }
}

function report(hits, targets) {
  console.log('pristine-scan — adversarial residue scan')
  console.log(`targets: ${targets.join(', ')}`)
  for (const rule of RULES) {
    const list = hits.filter(h => h.law === rule.law)
    console.log(`\n── ${rule.law} · ${rule.title}（${list.length}）`)
    if (list.length === 0) continue
    console.log(`   ${rule.why}`)
    for (const h of list) {
      const t = h.text.length > 110 ? h.text.slice(0, 107) + '…' : h.text
      console.log(`   ${h.file}:${h.line}  ${t}`)
    }
  }
  console.log(`\n${hits.length} hits — 以输出为准，不以自评为准；宁可多报，人工收敛误报。`)
}

// ===== self-test：规则表自身也不自评，用正反探针验证 =====
const SELFTEST = [
  { law: 'law 7', pos: ['migrate to new schema', 'ALTER TABLE students', 'legacy code', 'backward-compat layer', 'compat shim', 'old_logic', 'file.old', '迁移旧版', '兼容历史遗留结构'], neg: ['handle errors gracefully', 'immigration status'] },
  { law: 'law 1', pos: ['workaround for now', 'hotfix applied', 'special case if', '特殊处理一下', '临时方案', '兜底策略'], neg: ['root cause fixed'] },
  { law: 'law 3', pos: ['backup file', 'dead code', 'deprecated api', '备份文件', '废弃字段', '不再使用'], neg: ['keep history in git'] },
  { law: 'law 2', pos: ['note: this is fragile'], neg: ['notes are stored in the table'] },
]

function selftest() {
  let fail = 0
  for (const c of SELFTEST) {
    const rules = RULES.filter(r => r.law === c.law)
    for (const s of c.pos) {
      if (!rules.some(r => r.patterns.some(re => re.test(s)))) { console.log(`FAIL  ${c.law} pos: ${s}`); fail++ }
    }
    for (const s of c.neg) {
      if (rules.some(r => r.patterns.some(re => re.test(s)))) { console.log(`FAIL  ${c.law} neg: ${s}`); fail++ }
    }
  }
  for (const s of ['  // const x = 1', '# function old() {}', '/* if (a) { */']) {
    if (!COMMENTED_CODE_RE.test(s)) { console.log(`FAIL  commented-code pos: ${s}`); fail++ }
  }
  for (const s of ['// 注释说明', 'const x = 1', '/* 普通注释 */', '# 普通注释']) {
    if (COMMENTED_CODE_RE.test(s)) { console.log(`FAIL  commented-code neg: ${s}`); fail++ }
  }
  console.log(fail ? `selftest: ${fail} failure(s)` : 'selftest: all rules pass')
  process.exit(fail ? 1 : 0)
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()

const targets = args.filter(a => !a.startsWith('-'))
if (targets.length === 0) targets.push('.')

const hits = []
for (const t of targets) {
  if (!fs.existsSync(t)) {
    console.error(`pristine-scan: target not found: ${t}`)
    continue
  }
  const st = fs.statSync(t)
  if (st.isFile()) scanFile(t, hits)
  else walk(t, hits)
}

hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
report(hits, targets)
