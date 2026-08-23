#!/usr/bin/env node
/**
 * memory-scan — memory-drift scanner for the pristine skill.
 *
 * Memory files are the bridge across sessions: agents read whole files,
 * not diffs, so a stale entry makes the next agent decide on a false
 * premise. Memory rots silently — file paths move or get deleted,
 * counts change, old names linger. The scanner makes the rot mechanical:
 *
 *   1. 断链（dead reference）   — a memory file cites a code file path
 *                                that does not exist.
 *   2. 已删声称（deleted claim）— a memory file says a file "was deleted"
 *                                but the file is back on disk.
 *   3. 漂移（drift）            — a numeric claim that needs human
 *                                verification against code.
 *
 * Usage:
 *   node memory-scan.js <memory-dir> <repo-dir>   both required
 *   node memory-scan.js --selftest                verify the rule table
 */
const fs = require('fs')
const path = require('path')

const MEM_DIR = process.argv[2]
const REPO = process.argv[3]

const RULES = [
  {
    key: 'dead',
    title: '断链（代码路径声称但文件不存在）',
    why: '记忆里的代码引路是指针，文件删了就指空——下次会话在假前提上决策',
    patterns: [/`([^`]+\.(?:vue|js|ts|tsx|jsx|scss|css|md|json|mjs|cjs|sh|html))`/],
  },
  {
    key: 'deleted',
    title: '已删声称（说已删但文件还在）',
    why: '记忆说文件已删而它又回来，或根本没删干净——与「删除后必须验证」对立的残渣',
    patterns: [/已删|已删除|已废弃|已清除/, /delete(?:d)?|removed|deprecated|obsolete/],
  },
  {
    key: 'drift',
    title: '漂移（数字声称，需人工核销）',
    why: '「7 项权限」过时成「9 项」是最经典的腐化——数字声称随代码变，不随记忆变',
    patterns: [/(\d+)\s*个?\s*(权限|权限项|项|提醒|状态|等级|接口|表|文件|页面|组件|图标)|(\d+)\s*(permissions?|perm[ -]?items?|reminders?|stages?|levels?|interfaces?|tables?|files?|pages?|components?|icons?)/],
  },
]

const isFile = p => { try { return fs.statSync(p).isFile() } catch { return false } }

function claimedExists(claimed) {
  if (claimed.startsWith('~')) claimed = path.join(require('os').homedir(), claimed.slice(1))
  if (path.isAbsolute(claimed)) return isFile(claimed)
  if (!claimed.includes('/') && !claimed.includes('\\')) return null
  const variants = [claimed]
  if (claimed.startsWith('@shared/')) variants.push('src/' + claimed.slice(1))
  return ROOTS.some(root => variants.some(c => isFile(path.join(root, c))))
}

const CODE_EXTS = new Set(['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt', 'sh', 'bash', 'zsh', 'sql', 'vue', 'svelte'])
const TEXT_EXTS = new Set([...CODE_EXTS, 'md', 'markdown', 'txt', 'json', 'yaml', 'yml', 'toml', 'ini', 'css', 'scss', 'less', 'html', 'htm'])
const SKIP_DIR_RE = /(^|\/)(node_modules|dist|build|coverage|\.git|\.next|\.nuxt|\.output|\.cache|\.venv|venv|__pycache__|vendor|target)(\/|$)/
const SKIP_FILE_RE = /(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|composer\.lock|\.DS_Store|pristine-scan\.js|memory-scan\.js)$|\.min\.(?:js|css)$/

function scanFile(file, hits) {
  const ext = path.extname(file).slice(1).toLowerCase()
  if (!TEXT_EXTS.has(ext) || SKIP_FILE_RE.test(file)) return
  let size
  try { size = fs.statSync(file).size } catch { return }
  if (size > 2 * 1024 * 1024) return
  const rel = path.relative(process.cwd(), file).split(path.sep).join('/')
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of RULES) {
      const m = line.match(rule.patterns[0])
      if (!m) continue
      if (rule.key === 'dead') {
        const exists = claimedExists(m[1].replace(/\//g, path.sep))
        if (exists === false) hits.push({ file: rel, line: i + 1, kind: rule.key, text: line.trim() })
      } else if (rule.key === 'deleted') {
        const md = line.match(/`([^`]+\.(?:vue|js|ts|tsx|jsx|scss|css|md|json|mjs|cjs|sh|html))`/)
        if (!md) continue
        const exists = claimedExists(md[1].replace(/\//g, path.sep))
        if (exists === true) hits.push({ file: rel, line: i + 1, kind: rule.key, text: line.trim() })
      } else if (rule.key === 'drift') {
        hits.push({ file: rel, line: i + 1, kind: rule.key, text: line.trim(), claim: parseInt(m[1] || m[3], 10) })
      }
    }
  }
}

function walk(dir, hits) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_RE.test('/' + entry.name + '/')) continue
      walk(path.join(dir, entry.name), hits)
    } else if (entry.isFile()) scanFile(path.join(dir, entry.name), hits)
  }
}

function report(hits, targets) {
  console.log('memory-scan — memory drift scan')
  console.log(`memory: ${targets.join(', ')}  repo: ${REPO}`)
  for (const rule of RULES) {
    const list = hits.filter(h => h.kind === rule.key)
    console.log(`\n── ${rule.key} · ${rule.title}（${list.length}）`)
    if (list.length === 0) continue
    console.log(`   ${rule.why}`)
    for (const h of list) {
      const t = h.text.length > 110 ? h.text.slice(0, 107) + '…' : h.text
      console.log(`   ${h.file}:${h.line}  ${t}${h.claim ? `  (声称 ${h.claim})` : ''}`)
    }
  }
  console.log(`\n${hits.length} hits — 以输出为准，不以自评为准；宁可多报，人工收敛误报。`)
}

const SELFTEST = [
  { key: 'dead', pos: ['路径 `src/pc/components/common/PageStatusBar.vue` 存在', '引用 `server/src/helpers.js` 真源'], neg: ['这是个普通描述', '没有路径'] },
  { key: 'deleted', pos: ['旧抽屉 `StudentDetailDrawer.vue` 已删', '`add-card.vue` 已删除'], neg: ['这是正常文件，无删除语义', '文件仍在用'] },
  { key: 'drift', pos: ['权限项现状（7 项）', 'reminders 有 4 个等级'], neg: ['7 个苹果', '无数字声称'] },
]

function selftest() {
  let fail = 0
  for (const c of SELFTEST) {
    const rules = RULES.filter(r => r.key === c.key)
    for (const s of c.pos) {
      if (!rules.some(r => r.patterns[0].test(s))) { console.log(`FAIL  ${c.key} pos: ${s}`); fail++ }
    }
    for (const s of c.neg) {
      if (rules.some(r => r.patterns[0].test(s))) { console.log(`FAIL  ${c.key} neg: ${s}`); fail++ }
    }
  }
  console.log(fail ? `selftest: ${fail} failure(s)` : 'selftest: all rules pass')
  process.exit(fail ? 1 : 0)
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
if (!MEM_DIR || !REPO) {
  console.error('用法: node memory-scan.js <memory-dir> <repo-dir>')
  process.exit(2)
}

const ROOTS = [
  REPO,
  path.join(REPO, 'src'),
  path.join(REPO, 'server'),
  path.join(REPO, 'client'),
  path.join(REPO, 'backend'),
  path.join(REPO, 'frontend'),
]
const targets = args.filter(a => !a.startsWith('-') && a !== MEM_DIR && a !== REPO)
if (targets.length === 0) targets.push(MEM_DIR)
const hits = []
for (const t of targets) {
  if (!fs.existsSync(t)) { console.error(`memory-scan: target not found: ${t}`); continue }
  const st = fs.statSync(t)
  if (st.isFile()) scanFile(t, hits)
  else walk(t, hits)
}
hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
report(hits, targets)
