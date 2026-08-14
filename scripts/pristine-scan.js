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
 * Dead-code detection:
 *   Definition shapes are extracted per file (export function / ALL_CAPS
 *   const / module.exports.name). A name that appears codebase-wide exactly
 *   once — its own definition line — has zero callers and is reported as
 *   dead code. This is the mechanical half of "收编必查调用": the moment a
 *   definition stops being referenced, the scanner names it instead of
 *   waiting for a human to ask.
 *   Note: camelCase consts (e.g. `const foo = () =>`) are not extracted —
 *   the scanner over-reports, never under-reports, but local setup-state
 *   consts are deliberately out of scope.
 *
 * SOURCE annotations (single-source verification):
 *   A true single source marks itself:  // SOURCE: name
 *   The scanner collects every annotation and cross-checks two things:
 *     - 死真源 (dead source): the name appears only once codebase-wide —
 *       nobody uses it, so it is not a source of anything.
 *     - 重复定义 (duplicate definitions): the name has definition shapes in
 *       two or more files — the mark is on the name, but the truth has
 *       copies (the machine read of a failed 收编).
 *   The annotation makes "single source of truth" machine-checkable: the
 *   source list grows out of the code, not out of a hand-maintained table
 *   (a hand table drifts and becomes a fake source itself).
 *
 * Usage:
 *   node pristine-scan.js [dir...]     scan targets (default: current dir)
 *   node pristine-scan.js --map[=path] also write a source map (markdown)
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

// ===== 定义提取：只在定义形态上识别名字（调用点不算定义） =====
const DEF_RE = /^(?:export\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|const\s+([A-Z_][A-Z0-9_]*)\s*=)|^module\.exports\.([A-Za-z_$][\w$]*)\s*=/

// ===== SOURCE 标注：真源用注释自证，机器核销调用点 =====
const SOURCE_RE = /\/\/\s*SOURCE:\s*([A-Za-z_$][\w$]*)/

const CODE_EXTS = new Set(['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt', 'sh', 'bash', 'zsh', 'sql', 'vue', 'svelte'])
const TEXT_EXTS = new Set([...CODE_EXTS, 'md', 'markdown', 'txt', 'json', 'yaml', 'yml', 'toml', 'ini', 'css', 'scss', 'less', 'html', 'htm'])

const SKIP_DIR_RE = /(^|\/)(node_modules|dist|build|coverage|\.git|\.next|\.nuxt|\.output|\.cache|\.venv|venv|__pycache__|vendor|target)(\/|$)/
const SKIP_FILE_RE = /(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|composer\.lock|\.DS_Store|pristine-scan\.js)$|\.min\.(?:js|css)$/

const MAX_FILE_SIZE = 2 * 1024 * 1024

// ===== 文件级收集：hits（关键词）+ defs（定义表）+ fileLines（供全库计数） =====
function scanFile(file, hits, defs, fileLines) {
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
  const defList = []
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
    if (CODE_EXTS.has(ext)) {
      const m = line.match(DEF_RE)
      if (m) {
        const name = m[1] || m[2] || m[3]
        if (name) defList.push({ name, line: i + 1, text: line.trim() })
      }
      if (line.includes('SOURCE:')) {
        const s = line.match(SOURCE_RE)
        if (s) defList.push({ name: s[1], line: i + 1, text: line.trim(), isSource: true })
      }
    }
  }
  if (defList.length) defs[rel] = defList
  if (CODE_EXTS.has(ext)) fileLines[rel] = lines
}

function walk(dir, hits, defs, fileLines) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_RE.test('/' + entry.name + '/')) continue
      walk(path.join(dir, entry.name), hits, defs, fileLines)
    } else if (entry.isFile()) {
      scanFile(path.join(dir, entry.name), hits, defs, fileLines)
    }
  }
}

// ===== 全库出现次数：每个已知名字在全部代码行里数（含定义行自身） =====
function nameOccurrences(fileLines, defs) {
  const names = new Set()
  for (const file of Object.keys(defs)) {
    for (const d of defs[file]) names.add(d.name)
  }
  const count = new Map()
  for (const lines of Object.values(fileLines)) {
    for (const line of lines) {
      for (const name of names) {
        if (line.includes(name)) count.set(name, (count.get(name) || 0) + 1)
      }
    }
  }
  return { count, names }
}

// ===== 定义形态所在文件集合（≥2 文件 = 重复定义） =====
function nameDefFiles(defs) {
  const files = new Map()
  for (const file of Object.keys(defs)) {
    for (const d of defs[file]) {
      if (!files.has(d.name)) files.set(d.name, new Set())
      files.get(d.name).add(file)
    }
  }
  return files
}

function defReport(defs, count, defFiles) {
  const dead = []    // 全库只出现 1 次（定义行自己）——零调用
  const sources = [] // 标注过的真源
  for (const file of Object.keys(defs)) {
    for (const d of defs[file]) {
      const n = count.get(d.name) || 0
      const nf = defFiles.get(d.name)?.size || 0
      if (d.isSource) {
        // 重复定义只对自证真源报：未标注的名字无法区分「镜像」与「漏收编」——它是真源，
        // 就有核销义务；它不是真源，就无收编义务
        if (nf >= 2) dead.push({ file, line: d.line, name: d.name, text: d.text, kind: `重复定义（${nf} 个文件都有定义形态）` })
        if (n <= 1) dead.push({ file, line: d.line, name: d.name, text: d.text, kind: '死真源（标注但零调用）' })
        else sources.push({ file, line: d.line, name: d.name, text: d.text, kind: '真源（有调用）' })
      } else if (n <= 1) {
        dead.push({ file, line: d.line, name: d.name, text: d.text, kind: '死代码（定义零调用）' })
      }
    }
  }
  return { dead, sources }
}

function report(hits, defs, fileLines, targets) {
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

  const { count, names } = nameOccurrences(fileLines, defs)
  const defFiles = nameDefFiles(defs)
  const { dead, sources } = defReport(defs, count, defFiles)

  const dups = dead.filter(d => d.kind.startsWith('重复'))
  const noCall = dead.filter(d => !d.kind.startsWith('重复'))

  console.log(`\n── law 3 · dead definitions（${noCall.length}）`)
  for (const d of noCall) {
    console.log(`   ${d.file}:${d.line}  ${d.kind}: ${d.name}`)
  }
  console.log(`\n── SOURCE annotations · duplicate definitions（${dups.length}）`)
  for (const d of dups) {
    console.log(`   ${d.file}:${d.line}  ${d.kind}: ${d.name}`)
  }

  console.log(`\n── SOURCE annotations · single-source verify（${sources.length}）`)
  if (sources.length === 0) {
    console.log('   无标注 — 真源清单 = 空，代码里没有自证的真源')
  } else {
    for (const s of sources) console.log(`   ${s.file}:${s.line}  ${s.kind}: ${s.name}`)
  }

  console.log(`\n${hits.length + noCall.length + dups.length} hits — 以输出为准，不以自评为准；宁可多报，人工收敛误报。`)
}

// ===== self-test：规则表自身也不自评，用正反探针验证 =====
const SELFTEST = [
  { law: 'law 7', pos: ['migrate to new schema', 'ALTER TABLE students', 'legacy code', 'backward-compat layer', 'compat shim', 'old_logic', 'file.old', '迁移旧版', '兼容历史遗留结构'], neg: ['handle errors gracefully', 'immigration status'] },
  { law: 'law 1', pos: ['workaround for now', 'hotfix applied', 'special case if', '特殊处理一下', '临时方案', '兜底策略'], neg: ['root cause fixed'] },
  { law: 'law 3', pos: ['backup file', 'dead code', 'deprecated api', '备份文件', '废弃字段', '不再使用'], neg: ['keep history in git'] },
  { law: 'law 2', pos: ['note: this is fragile'], neg: ['notes are stored in the table'] },
]

function testDef(line, expect) {
  const m = line.match(DEF_RE)
  const got = !!(m && (m[1] || m[2] || m[3]))
  if (got !== expect) console.log(`FAIL  def ${expect ? 'pos' : 'neg'}: ${line}`)
  return got !== expect
}

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
  // 定义提取：正反探针
  for (const s of ['export function roleLabel(role) {', 'function isValidPhone(phone) {', 'export const ROLE_LABELS = {', 'const STAGE_REQUIREMENTS = {', 'module.exports.PERMISSION_LABELS = PERMISSION_LABELS']) {
    if (testDef(s, true)) fail++
  }
  for (const s of ['roleLabel(role)', 'const x = ROLE_LABELS', 'return STAGE_REQUIREMENTS', '// 注释里的 function foo() {']) {
    if (testDef(s, false)) fail++
  }
  // SOURCE 标注
  for (const s of ['// SOURCE: roleLabel', '  // SOURCE: PERMISSION_LABELS']) {
    if (!SOURCE_RE.test(s)) { console.log(`FAIL  source pos: ${s}`); fail++ }
  }
  console.log(fail ? `selftest: ${fail} failure(s)` : 'selftest: all rules pass')
  process.exit(fail ? 1 : 0)
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()

// ===== --map[=path]：导出真源地图（markdown）——地图是索引不是领土 =====
const mapIdx = args.findIndex(a => a.startsWith('--map'))
let mapFile = null
if (mapIdx >= 0) {
  const raw = args[mapIdx].split('=')
  mapFile = raw[1] || 'SOURCE_MAP.md'
  args.splice(mapIdx, 1)
}

const targets = args.filter(a => !a.startsWith('-'))
if (targets.length === 0) targets.push('.')

const hits = []
const defs = {}
const fileLines = {}
for (const t of targets) {
  if (!fs.existsSync(t)) {
    console.error(`pristine-scan: target not found: ${t}`)
    continue
  }
  const st = fs.statSync(t)
  if (st.isFile()) scanFile(t, hits, defs, fileLines)
  else walk(t, hits, defs, fileLines)
}

hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
report(hits, defs, fileLines, targets)

if (mapFile) {
  const { count, names } = nameOccurrences(fileLines, defs)
  const defFiles = nameDefFiles(defs)
  const { dead, sources } = defReport(defs, count, defFiles)
  const dups = dead.filter(d => d.kind.startsWith('重复'))
  const noCall = dead.filter(d => !d.kind.startsWith('重复'))

  const lines = []
  lines.push('# 真源地图（SOURCE MAP）')
  lines.push('')
  lines.push('> 由 `pristine-scan.js --map` 从代码自动生成 —— 地图是索引不是领土，')
  lines.push('> 只指向规则在哪、如何访问，从不复制规则本体。生成后不要手改。')
  lines.push('')
  lines.push(`生成目标：\`${targets.join('`, `')}\``)
  lines.push('')
  lines.push('## 真源（有调用）')
  lines.push('')
  if (sources.length === 0) lines.push('_无_')
  else for (const s of sources) lines.push(`- \`${s.name}\` — ${s.file}:${s.line}`)
  lines.push('')
  lines.push('## 死真源 / 重复定义（需处理）')
  lines.push('')
  if (noCall.length === 0 && dups.length === 0) lines.push('_无_')
  else {
    for (const d of noCall) lines.push(`- ⚠️ ${d.kind}: \`${d.name}\` — ${d.file}:${d.line}`)
    for (const d of dups) lines.push(`- ⚠️ ${d.kind}: \`${d.name}\` — ${d.file}:${d.line}`)
  }
  lines.push('')
  fs.writeFileSync(mapFile, lines.join('\n'), 'utf8')
  console.log(`\n真源地图已写入 ${mapFile}`)
}
