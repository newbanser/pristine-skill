#!/usr/bin/env node
/**
 * 返工模拟脚本（端到端成本测试，轻量版）
 *
 * 测什么：给定任务的已有输出（control/concise/pristine 三组），模拟"用户拿到
 * 输出 → 严格评审 → 不达标就追问 → AI 返工"的循环，统计各组达到"可用"所需的
 * 轮数。这是"项目级省"的直接量化：返工轮数越少，端到端越省。
 *
 * 用法：DEEPSEEK_API_KEY=xxx node benchmarks/rework.js
 *       API_BASE=... MODEL=... 可指定其他 OpenAI 兼容服务
 *
 * 数据来源：读取 results/{task}_{group}_1.txt（run.js 的单次输出）
 * 结果保存：results/rework.json（增量落盘，断点续跑）
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, 'tasks');
const RESULTS_DIR = path.join(__dirname, 'results');
const SKILL_PATH = path.join(__dirname, '..', 'SKILL.md');
const REWORK_PATH = path.join(RESULTS_DIR, 'rework.json');

const MODEL = process.env.MODEL || 'deepseek-chat';
const API_BASE = process.env.API_BASE || 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
const IS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY && !process.env.DEEPSEEK_API_KEY;

const MAX_ROUNDS = 3; // 每个输出最多返工轮数
// 轻量版：6 个代表性任务（编码/诊断/规划三类）
const SELECTED = [
  '01-fix-edge-bug',
  '02-implement-login',
  '03-answer-with-vague-premise',
  '05-explain-concept',
  '09-plan-feature',
  '10-debug-vague-error'
];
const GROUPS = ['control', 'concise', 'pristine'];

const skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
const CONCISE_PROMPT = '请用最简洁的方式回答：答案先行，不要客套、复述或废话。';

// 任务特定验收清单：评审只能对照清单逐项核验，禁止自由发挥、禁止引入任务外场景
const CHECKLISTS = {
  '01-fix-edge-bug': [
    '给出了修复后的完整函数（可直接替换原代码）',
    '修复后 user.id===5 且 profile.name 存在时，返回 profile.name',
    '修复后 user.id===5 且 profile.name 不存在（profile 为空对象）时，回退返回 user.name，而不是 undefined',
    '修复没有破坏其它 id 的正常返回',
    '没有用堆叠特殊分支的方式打补丁'
  ],
  '02-implement-login': [
    '包含创建 users 表的代码（含用户名和密码字段）',
    '包含登录接口：接收用户名和密码并校验',
    '包含可运行的 Express 应用骨架（app 实例与路由）',
    '密码不以明文存储（有哈希处理或明确说明）',
    '没有混入目标外功能（注册、忘记密码、第三方登录、个人中心等大量功能）'
  ],
  '03-answer-with-vague-premise': [
    '质疑了"数据库慢了"这个前提，要求先确认根因',
    '给出了确认根因的具体方法（查日志/慢查询/连接池等）',
    '优化建议基于根因而非泛泛罗列'
  ],
  '05-explain-concept': [
    '第一句就给出闭包的准确定义（答案先行）',
    '包含一个 JavaScript 闭包示例',
    '没有开场客套（如"好问题！"）和收尾客套（如"希望有帮助！"）'
  ],
  '09-plan-feature': [
    '实施计划只覆盖"导出当前视图为 CSV"的最小范围',
    '列出了完成该功能必要的步骤（如导出入口、生成 CSV、下载）',
    '没有混入目标外功能（导出设置页、批量导出、定时导出、权限系统等）'
  ],
  '10-debug-vague-error': [
    '质疑了"部署新版本导致报错"这个前提，不急于下结论',
    '给出了确认报错来源的具体方法（检查返回内容是否为 HTML、确认哪个请求 404 等）',
    '给出了针对根因的修复方向'
  ]
};

const REVIEW_PROMPT = `你是严格的质量评审。用户会给你【任务】、【验收清单】和【AI 的回答】。你的唯一职责：逐项核验验收清单。

核验规则：
1. 必须逐项判断，每项独立标注"满足"或"不满足"。不允许跳项、不允许因为回答看起来清晰就默认满足。
2. 判定标准：回答里是否明确包含了该项要求的内容。没有明确包含 = 不满足。简洁不等于满足，冗长也不等于满足——只按内容核验。
3. 只有全部满足才 PASS。任何一项不满足即 FAIL。
4. 禁止要求清单之外的内容：不得假设任务未提及的场景（特定中间件、特定版本、特定故障），不得无限深挖，不得要求"更完美"。

输出严格按以下格式（不要有其它内容）：
- 全部满足：
  VERDICT: PASS
- 有缺项：
  VERDICT: FAIL
  MISSING: <缺失项的编号，逗号分隔，如 2,3>
  FOLLOWUP: <以一个真实用户返工时的语气，只针对缺失项，一句话要求补上，不新增要求>`;

function listTasks() {
  return fs.readdirSync(TASKS_DIR)
    .filter(f => f.endsWith('.md') && SELECTED.includes(f.replace('.md', '')))
    .sort()
    .map(f => {
      const content = fs.readFileSync(path.join(TASKS_DIR, f), 'utf-8');
      const promptMatch = content.match(/```\n([\s\S]*?)```/);
      const prompt = promptMatch ? promptMatch[1].trim() : content;
      return { id: f.replace('.md', ''), prompt };
    });
}

function groupSystemPrompt(group) {
  if (group === 'pristine') return skillContent;
  if (group === 'concise') return CONCISE_PROMPT;
  return '';
}

async function callAPI(systemPrompt, userPrompt) {
  if (IS_ANTHROPIC) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      output: data.content[0].text,
      input_tokens: data.usage.input_tokens,
      output_tokens: data.usage.output_tokens
    };
  }
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages })
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    output: data.choices[0].message.content,
    input_tokens: data.usage.prompt_tokens,
    output_tokens: data.usage.completion_tokens
  };
}

async function callWithRetry(systemPrompt, userPrompt, label) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await callAPI(systemPrompt, userPrompt);
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        console.log(`    [${label}] retry ${attempt}/2 after: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastErr;
}

// 评审：返回 { pass, missing, followup }
function parseVerdict(output) {
  const pass = /VERDICT:\s*PASS/i.test(output);
  const mm = output.match(/MISSING:\s*([^\n]+)/i);
  const m = output.match(/FOLLOWUP:\s*([\s\S]+)/i);
  return { pass, missing: mm ? mm[1].trim() : null, followup: m ? m[1].trim() : null };
}

function loadExisting() {
  try {
    const arr = JSON.parse(fs.readFileSync(REWORK_PATH, 'utf-8'));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveAll(all) {
  fs.writeFileSync(REWORK_PATH, JSON.stringify(all, null, 2));
}

async function simulateRework(task, group, run) {
  const originalPath = path.join(RESULTS_DIR, `${task.id}_${group}_${run}.txt`);
  if (!fs.existsSync(originalPath)) throw new Error(`missing original output: ${originalPath}`);
  const original = fs.readFileSync(originalPath, 'utf-8');

  const sys = groupSystemPrompt(group);
  const checklist = CHECKLISTS[task.id];
  const checklistStr = checklist.map((c, i) => `${i + 1}. ${c}`).join('\n');
  let current = original;
  const rounds = [];
  let totalTokens = 0;

  for (let r = 1; r <= MAX_ROUNDS; r++) {
    // 评审：对照清单逐项核验
    const reviewUser = `【任务】\n${task.prompt}\n\n【验收清单】\n${checklistStr}\n\n【AI 的回答】\n${current}`;
    const review = await callWithRetry(REVIEW_PROMPT, reviewUser, `review ${task.id}/${group}/r${r}`);
    totalTokens += review.input_tokens + review.output_tokens;
    const verdict = parseVerdict(review.output);

    if (verdict.pass) {
      rounds.push({ round: r, verdict: 'PASS', review_tokens: review.input_tokens + review.output_tokens });
      return { task: task.id, group, run, original_tokens: original.length, rounds, passed: true, rounds_to_pass: r, total_tokens: totalTokens };
    }

    const followup = verdict.followup || `你给的答案没有满足验收清单的全部要求，请重做。`;
    // 返工：带清单，目标明确，快速收敛
    const reworkUser = `【原任务】\n${task.prompt}\n\n【验收清单】\n${checklistStr}\n\n【你之前的回答】\n${current}\n\n【用户的反馈】\n${followup}\n\n请根据用户反馈修正你的回答，确保满足验收清单的全部项，给出最终可直接使用的版本。`;
    const revised = await callWithRetry(sys, reworkUser, `rework ${task.id}/${group}/r${r}`);
    totalTokens += revised.input_tokens + revised.output_tokens;

    rounds.push({
      round: r,
      verdict: 'FAIL',
      followup,
      revised_output: revised.output,
      review_tokens: review.input_tokens + review.output_tokens,
      rework_tokens: revised.input_tokens + revised.output_tokens
    });
    current = revised.output;
  }

  return { task: task.id, group, run, original_tokens: original.length, rounds, passed: false, rounds_to_pass: null, total_tokens: totalTokens };
}

async function main() {
  if (!API_KEY) {
    console.error('Error: DEEPSEEK_API_KEY not set');
    process.exit(1);
  }
  const RUNS_PER_TASK = parseInt(process.env.RUNS || '3', 10); // 多次观测，消除单次随机性
  const tasks = listTasks();
  let all = loadExisting();
  const done = new Set(all.map(e => `${e.task}|${e.group}|${e.run}`));
  const total = tasks.length * GROUPS.length * RUNS_PER_TASK;
  console.log(`Rework simulation: ${tasks.length} tasks × ${GROUPS.length} groups × ${RUNS_PER_TASK} runs, max ${MAX_ROUNDS} rounds (resume: ${done.size}/${total} done)`);

  for (const task of tasks) {
    for (const group of GROUPS) {
      for (let run = 1; run <= RUNS_PER_TASK; run++) {
        const key = `${task.id}|${group}|${run}`;
        if (done.has(key)) { console.log(`  ${key}... skipped`); continue; }
        console.log(`  ${key}...`);
        try {
          const entry = await simulateRework(task, group, run);
          all = all.filter(e => !(e.task === task.id && e.group === group && e.run === run));
          all.push(entry);
          saveAll(all);
          const passed = entry.passed ? `PASS@${entry.rounds_to_pass}` : `FAIL@${MAX_ROUNDS}`;
          console.log(`    ${passed} | tokens: ${entry.total_tokens}`);
        } catch (e) {
          console.error(`    FAILED: ${e.message}`);
        }
      }
    }
  }

  saveAll(all);
  console.log(`\nDone. ${all.length} entries. ${REWORK_PATH}`);

  // 汇总：按组聚合（多个 run 的统计）
  console.log('\n=== 返工轮数对比（多次观测聚合）===');
  for (const group of GROUPS) {
    const es = all.filter(e => e.group === group);
    if (!es.length) continue;
    const pass1 = es.filter(e => e.rounds_to_pass === 1).length;
    const passed = es.filter(e => e.passed).length;
    const totalRounds = es.reduce((a, e) => a + (e.rounds_to_pass ?? MAX_ROUNDS), 0);
    console.log(`${group.padEnd(9)} 一轮达标 ${pass1}/${es.length} | 最终达标 ${passed}/${es.length} | 平均轮数 ${(totalRounds / es.length).toFixed(2)}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
