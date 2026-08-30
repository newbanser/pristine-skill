#!/usr/bin/env node
/**
 * skillbench — skill / AGENTS.md 效果评测程序（v2）
 *
 * 回答的问题：我装的 skill / 写的 agent.md，到底有没有优化代理的效果？
 * 方法：在可插拔的 system 配置（空 / 任意 skill.md / 任意 AGENTS.md）下，
 * 跑同一组任务，用「校准过判定器」按验收标准核验输出达标率，再对比。
 *
 * 关键机制：
 * - 校准门禁：判定器先跑一组「已知该 PASS/该 FAIL」的样例，准确率低于阈值
 *   就拒绝跑全量——避免把「AI 评审放水/加码」的问题带进结论。
 * - 判定标准单一真源：每个任务的验收标准（criteria）只存在 calibration 里。
 * - 断点续跑：已生成的输出文件跳过，中途中断可续。
 *
 * 用法：
 *   node benchmarks/skillbench.js \
 *     --tasks <dir>                        任务目录（.md，``` 代码块内为 prompt）
 *     --systems empty,pristine             对比的系统配置名（逗号分隔）
 *     --system-prompt.pristine <file>      每个非 empty 系统的 prompt 文件
 *     --calibration <file>                 校准集：任务 + criteria + 好/坏样例
 *     --runs 3                             每系统每任务观测次数
 *     --threshold 0.85                     校准准确率阈值
 *     --model <m> --api-base <u> --api-key <k>
 *     --out <dir>                          输出 + 报告目录（默认 benchmarks/out/<时间戳>）
 */

const fs = require('fs');
const path = require('path');

// ---- 参数 ----
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i > -1 && process.argv[i + 1]) return process.argv[i + 1];
  return def;
}
const TASKS_DIR = arg('tasks', path.join(__dirname, 'tasks'));
const CALIBRATION_FILE = arg('calibration', path.join(__dirname, 'calibration.json'));
const RUNS = parseInt(arg('runs', '3'), 10);
const VOTES = parseInt(arg('votes', '3'), 10); // 校准每个样例判定次数，多数票（判定器有随机性）
const THRESHOLD = parseFloat(arg('threshold', '0.85'));
const MODEL = arg('model', process.env.MODEL || 'deepseek-chat');
const API_BASE = arg('api-base', process.env.API_BASE || 'https://api.deepseek.com/v1');
const API_KEY = arg('api-key', process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY);
const OUT_DIR = arg('out', path.join(__dirname, 'out', new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')));

// 解析 --systems 和 --system-prompt.<name>
const SYSTEMS = (arg('systems', 'empty')).split(',').map(s => s.trim()).filter(Boolean);
function collectSystemPrompts() {
  const map = {};
  for (let i = 0; i < process.argv.length; i++) {
    const m = /^--system-prompt\.(.+)$/.exec(process.argv[i]);
    if (m && process.argv[i + 1]) map[m[1]] = path.resolve(process.argv[i + 1]);
  }
  return map;
}
const SYSTEM_PROMPT_FILES = collectSystemPrompts();

// ---- API ----
async function callAPI(systemPrompt, userPrompt, maxTokens) {
  const messages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
    : [{ role: 'user', content: userPrompt }];
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages })
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { output: data.choices[0].message.content, output_tokens: data.usage.completion_tokens };
}
async function callWithRetry(sys, user, maxTokens, label) {
  let lastErr;
  for (let a = 1; a <= 3; a++) {
    try { return await callAPI(sys, user, maxTokens); }
    catch (e) { lastErr = e; if (a < 3) { console.log(`    [${label}] retry ${a}/2: ${e.message}`); await new Promise(r => setTimeout(r, 2000 * a)); } }
  }
  throw lastErr;
}

// ---- 判定器（AI 评审：任务边界 + 逐项核验 + 否定式标准）----
const REVIEW_PROMPT = `你是严格的质量评审。用户会给你【任务】、【验收标准】和【AI 的回答】。你的唯一职责：逐项核验验收标准。

规则：
1. 必须逐项判断，每项独立标注"满足"或"不满足"。不允许跳项、不允许因为回答看起来清晰就默认满足。
2. 判定标准：回答里是否明确包含了该项要求的内容。没有明确包含 = 不满足。简洁不等于满足，冗长也不等于满足——只按内容核验。
3. 只有全部满足才 PASS。任何一项不满足即 FAIL。
4. 只依据验收标准判定。禁止假设任务未提及的场景，禁止无限深挖，禁止要求"更完美"。
5. 否定式标准（表述为"没有 X"、"不混入 Y"、"禁止 Z"）：核验方式是检查回答里是否出现了被禁止的内容。未出现 = 该项满足。回答不需要主动声明"我没有 X"。只有回答里明确出现了被禁止的内容才算不满足。

输出严格按以下格式（不要有其它内容）：
- 全部满足：
VERDICT: PASS
- 有缺项：
VERDICT: FAIL
MISSING: <缺失项的编号，逗号分隔，如 2,3>`;

function parseVerdict(output) {
  const pass = /VERDICT:\s*PASS/i.test(output);
  const m = output.match(/MISSING:\s*([^\n]+)/i);
  return { pass, missing: m ? m[1].trim() : null };
}

async function judge(taskPrompt, criteria, answer) {
  const std = criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const user = `【任务】\n${taskPrompt}\n\n【验收标准】\n${std}\n\n【AI 的回答】\n${answer}`;
  const r = await callWithRetry(REVIEW_PROMPT, user, 512, 'judge');
  const v = parseVerdict(r.output);
  return { pass: v.pass, missing: v.missing, tokens: r.output_tokens };
}

// 多次判定取多数票，抑制判定器随机性
async function judgeWithVotes(taskPrompt, criteria, answer, votes) {
  let pass = 0, fail = 0;
  for (let v = 0; v < votes; v++) {
    const j = await judge(taskPrompt, criteria, answer);
    if (j.pass) pass++; else fail++;
  }
  return { pass: pass >= Math.ceil(votes / 2), votes: { pass, fail } };
}

// ---- 加载 ----
function loadTasks() {
  return fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md')).sort().map(f => {
    const content = fs.readFileSync(path.join(TASKS_DIR, f), 'utf-8');
    const m = content.match(/```\n([\s\S]*?)```/);
    return { id: f.replace('.md', ''), prompt: m ? m[1].trim() : content };
  });
}
const calibration = JSON.parse(fs.readFileSync(CALIBRATION_FILE, 'utf-8'));
const taskById = new Map(loadTasks().map(t => [t.id, t]));

// system prompt 加载：empty = 空；其余从文件读
function loadSystemPrompts() {
  const map = {};
  for (const name of SYSTEMS) {
    if (name === 'empty') { map[name] = ''; continue; }
    const file = SYSTEM_PROMPT_FILES[name];
    if (!file) throw new Error(`system '${name}' 缺少 --system-prompt.${name} <file>`);
    if (!fs.existsSync(file)) throw new Error(`system prompt 文件不存在: ${file}`);
    map[name] = fs.readFileSync(file, 'utf-8');
  }
  return map;
}

// ---- 校准门禁 ----
async function calibrate() {
  const results = [];
  for (const spec of calibration) {
    for (const s of spec.samples) {
      const j = await judgeWithVotes(spec.task_prompt, spec.criteria, s.output, VOTES);
      const ok = (j.pass && s.expected === 'pass') || (!j.pass && s.expected === 'fail');
      results.push({ task: spec.task_id, expected: s.expected, got: j.pass ? 'pass' : 'fail', ok, votes: j.votes, reason: s.reason });
    }
  }
  const correct = results.filter(r => r.ok).length;
  return { acc: correct / results.length, results };
}

// ---- 统计 ----
const median = arr => { const v = [...arr].sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };

async function main() {
  if (!API_KEY) { console.error('Error: API key missing'); process.exit(1); }
  if (!calibration.length) { console.error('Error: empty calibration'); process.exit(1); }
  const systemPrompts = loadSystemPrompts();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`输出目录: ${OUT_DIR}\n`);

  // 1. 校准
  console.log('=== 1/4 校准判定器 ===');
  const cal = await calibrate();
  for (const r of cal.results) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.task} expected=${r.expected} got=${r.got} [${r.votes.pass}pass/${r.votes.fail}fail]${r.ok ? '' : '  (' + r.reason + ')'}`);
  }
  console.log(`  校准准确率: ${(cal.acc * 100).toFixed(1)}% (${cal.results.filter(r => r.ok).length}/${cal.results.length}, ${VOTES} 次观测/样例) 阈值 ${(THRESHOLD * 100).toFixed(0)}%`);
  if (cal.acc < THRESHOLD) {
    console.error(`\n判定器未通过校准门禁（${(cal.acc * 100).toFixed(1)}% < ${(THRESHOLD * 100).toFixed(0)}%）。判定器不可靠，拒绝跑全量。`);
    console.error('请检查：判定 prompt、校准集样例质量。不要带着不可靠的判定器跑 benchmark。');
    process.exit(1);
  }
  console.log('判定器通过校准门禁，继续。\n');

  // 2. 生成输出（断点续跑）
  console.log('=== 2/4 生成输出 ===');
  const summary = [];
  for (const spec of calibration) {
    const task = taskById.get(spec.task_id);
    if (!task) { console.log(`  跳过（任务不存在）: ${spec.task_id}`); continue; }
    for (const system of SYSTEMS) {
      for (let run = 1; run <= RUNS; run++) {
        const file = path.join(OUT_DIR, `${spec.task_id}_${system}_${run}.txt`);
        let all = [];
        try { all = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'summary.json'), 'utf-8') || '[]'); } catch (e) {}
        if (fs.existsSync(file)) {
          const hit = all.find(p => p.task === spec.task_id && p.system === system && p.run === run);
          if (hit) { summary.push(hit); console.log(`  复用 ${spec.task_id}/${system}/run${run}`); continue; }
        }
        try {
          const r = await callWithRetry(systemPrompts[system], task.prompt, 4096, `${spec.task_id}/${system}`);
          fs.writeFileSync(file, r.output);
          const rec = { task: spec.task_id, system, run, output_tokens: r.output_tokens };
          summary.push(rec);
          all.push(rec);
          fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(all, null, 2));
          console.log(`  生成 ${spec.task_id}/${system}/run${run} (${r.output_tokens} tok)`);
        } catch (e) {
          console.error(`  FAIL ${spec.task_id}/${system}/run${run}: ${e.message}`);
        }
      }
    }
  }

  // 3. 判定输出
  console.log('\n=== 3/4 判定输出 ===');
  const judged = [];
  for (const spec of calibration) {
    for (const system of SYSTEMS) {
      for (let run = 1; run <= RUNS; run++) {
        const p = path.join(OUT_DIR, `${spec.task_id}_${system}_${run}.txt`);
        if (!fs.existsSync(p)) continue;
        const answer = fs.readFileSync(p, 'utf-8');
        const j = await judgeWithVotes(spec.task_prompt, spec.criteria, answer, VOTES);
        judged.push({ task: spec.task_id, system, run, pass: j.pass, missing: j.missing, votes: j.votes });
        console.log(`  ${spec.task_id}/${system}/run${run}... ${j.pass ? 'PASS' : 'FAIL'} [${j.votes.pass}p/${j.votes.fail}f]`);
      }
    }
  }

  // 4. 报告
  console.log('\n=== 4/4 结果 ===');
  const lines = [];
  lines.push('# skillbench 评测报告');
  lines.push('');
  lines.push(`> ${new Date().toISOString().slice(0, 10)} · ${MODEL} · 校准准确率 ${(cal.acc * 100).toFixed(1)}% · ${judged.length} 个输出 · ${RUNS} 次观测/任务`);
  lines.push('');
  lines.push('## 达标率（判定器按验收标准核验，已过校准门禁）');
  lines.push('');
  lines.push('| 系统配置 | 达标数 | 达标率 | 平均输出 tokens（中位数） |');
  lines.push('|---|---|---|---|');
  for (const system of SYSTEMS) {
    const es = judged.filter(j => j.system === system);
    if (!es.length) continue;
    const pass = es.filter(j => j.pass).length;
    const tok = summary.filter(s => s.system === system).map(s => s.output_tokens);
    lines.push(`| ${system} | ${pass}/${es.length} | ${(pass / es.length * 100).toFixed(0)}% | ${median(tok) ?? 'N/A'} |`);
  }
  lines.push('');
  lines.push('## 说明');
  lines.push('');
  lines.push('- 判定标准（验收标准）定义于 calibration 文件，每个任务一份，单一真源');
  lines.push('- 判定器为 AI 评审，已通过校准门禁（对已知好/坏样例一致率 ≥ 阈值）');
  lines.push('- 达标 = 满足该任务全部验收标准项，不考核验方式、不看表达风格');
  lines.push('- 校准与判定均 ' + VOTES + ' 次观测取多数票，抑制判定器随机性');
  const report = lines.join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'report.md'), report);
  console.log(report);
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
module.exports = { REVIEW_PROMPT, judge, parseVerdict, calibrate };
