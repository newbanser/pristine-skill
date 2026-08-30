#!/usr/bin/env node
/**
 * 纯净原则实测脚本
 * 用法：DEEPSEEK_API_KEY=xxx node benchmarks/run.js
 *       API_BASE=... MODEL=... 可指定其他 OpenAI 兼容服务
 *
 * 对照组：空 system prompt（无任何输出约束）
 * 简洁组：仅"请简洁回答"一句（拆出"纯净框架 vs 单纯要求简洁"的差异）
 * 实验组：加载 pristine SKILL.md
 * 每个任务跑 RUNS_PER_TASK 次（当前 1 次，因 agnes 为确定性输出；换随机性模型调回 5）
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, 'tasks');
const RESULTS_DIR = path.join(__dirname, 'results');
const SKILL_PATH = path.join(__dirname, '..', 'SKILL.md');
// DeepSeek 官方为随机模型，每组跑 3 次取中位数，消除单次随机性
const RUNS_PER_TASK = 3;
const MODEL = process.env.MODEL || 'deepseek-chat';
const API_BASE = process.env.API_BASE || 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
const IS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY && !process.env.DEEPSEEK_API_KEY;

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
const CONCISE_PROMPT = '请用最简洁的方式回答：答案先行，不要客套、复述或废话。';

function listTasks() {
  return fs.readdirSync(TASKS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => {
      const content = fs.readFileSync(path.join(TASKS_DIR, f), 'utf-8');
      const promptMatch = content.match(/```\n([\s\S]*?)```/);
      const prompt = promptMatch ? promptMatch[1].trim() : content;
      return { id: f.replace('.md', ''), prompt, file: f };
    });
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
  } else {
    // OpenAI-compatible (DeepSeek, etc.)
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages
      })
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      output: data.choices[0].message.content,
      input_tokens: data.usage.prompt_tokens,
      output_tokens: data.usage.completion_tokens
    };
  }
}

async function runTask(task, group, run) {
  const systemPrompt = group === 'pristine' ? skillContent : (group === 'concise' ? CONCISE_PROMPT : '');
  // 网络抖动/限流重试：最多 3 次，指数退避
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callAPI(systemPrompt, task.prompt);
      const output = result.output;
      const outPath = path.join(RESULTS_DIR, `${task.id}_${group}_${run}.txt`);
      fs.writeFileSync(outPath, output);
      return {
        task: task.id,
        group,
        run,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        total_tokens: result.input_tokens + result.output_tokens,
        output_file: outPath
      };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        console.log(`    retry ${attempt}/2 after: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastErr;
}

const GROUPS = ['control', 'concise', 'pristine'];

// 断点续跑：读取已有 summary，只保留属于当前任务集的条目（旧结构自动清理）
function loadExistingResults(tasks) {
  const knownGroups = new Set(GROUPS);
  const knownTasks = new Set(tasks.map(t => t.id));
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, 'summary.json'), 'utf-8'));
    if (Array.isArray(arr)) {
      return arr.filter(r => knownTasks.has(r.task) && knownGroups.has(r.group));
    }
  } catch {}
  return [];
}

function saveSummary(allResults) {
  fs.writeFileSync(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify(allResults, null, 2));
}

async function main() {
  if (!API_KEY) {
    console.error('Error: DEEPSEEK_API_KEY or ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const tasks = listTasks();
  let allResults = loadExistingResults(tasks);
  console.log(`Running ${tasks.length} tasks, ${RUNS_PER_TASK} runs each, ${GROUPS.length} groups (resume: ${allResults.length} done)...`);

  for (const task of tasks) {
    for (const group of GROUPS) {
      for (let run = 1; run <= RUNS_PER_TASK; run++) {
        const outPath = path.join(RESULTS_DIR, `${task.id}_${group}_${run}.txt`);
        const done = fs.existsSync(outPath) && allResults.some(r => r.task === task.id && r.group === group && r.run === run);
        if (done) {
          console.log(`  ${task.id} / ${group} / run ${run}... skipped`);
          continue;
        }
        console.log(`  ${task.id} / ${group} / run ${run}...`);
        try {
          const r = await runTask(task, group, run);
          allResults = allResults.filter(x => !(x.task === task.id && x.group === group && x.run === run));
          allResults.push(r);
          saveSummary(allResults); // 增量落盘，中断不丢
          console.log(`    tokens: ${r.total_tokens}`);
        } catch (e) {
          console.error(`    FAILED: ${e.message}`);
        }
      }
    }
  }

  saveSummary(allResults);
  console.log(`\nDone. ${allResults.length} runs. Summary: ${RESULTS_DIR}/summary.json`);

  // Print quick comparison (median of runs)
  const median = (runs) => {
    const vals = runs.map(r => r.output_tokens).sort((a, b) => a - b);
    return vals.length ? vals[Math.floor(vals.length / 2)] : null;
  };
  console.log('\n=== Output-token comparison (median of runs) ===');
  for (const task of tasks) {
    const c = median(allResults.filter(r => r.task === task.id && r.group === 'control'));
    const s = median(allResults.filter(r => r.task === task.id && r.group === 'concise'));
    const p = median(allResults.filter(r => r.task === task.id && r.group === 'pristine'));
    const d1 = (c && p) ? ((p - c) / c * 100).toFixed(1) : 'N/A';
    const d2 = (s && p) ? ((p - s) / s * 100).toFixed(1) : 'N/A';
    console.log(`  ${task.id}: control=${c ?? 'N/A'}, concise=${s ?? 'N/A'}, pristine=${p ?? 'N/A'}  (vs control ${d1}%, vs concise ${d2}%)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
