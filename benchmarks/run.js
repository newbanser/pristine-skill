#!/usr/bin/env node
/**
 * 纯净原则实测脚本
 * 用法：ANTHROPIC_API_KEY=xxx node benchmarks/run.js
 *
 * 对照组：无 pristine skill
 * 实验组：加载 pristine SKILL.md
 * 每个任务跑 3 次，收集 tokens 和输出
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, 'tasks');
const RESULTS_DIR = path.join(__dirname, 'results');
const SKILL_PATH = path.join(__dirname, '..', 'SKILL.md');
const RUNS_PER_TASK = 3;
const MODEL = process.env.MODEL || 'deepseek-chat';
const API_BASE = process.env.API_BASE || 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
const IS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY && !process.env.DEEPSEEK_API_KEY;

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');

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
  const systemPrompt = group === 'pristine' ? skillContent : '';
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
}

async function main() {
  if (!API_KEY) {
    console.error('Error: DEEPSEEK_API_KEY or ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const tasks = listTasks();
  console.log(`Running ${tasks.length} tasks, ${RUNS_PER_TASK} runs each, 2 groups...`);

  const allResults = [];
  for (const task of tasks) {
    for (const group of ['control', 'pristine']) {
      for (let run = 1; run <= RUNS_PER_TASK; run++) {
        console.log(`  ${task.id} / ${group} / run ${run}...`);
        try {
          const r = await runTask(task, group, run);
          allResults.push(r);
          console.log(`    tokens: ${r.total_tokens}`);
        } catch (e) {
          console.error(`    FAILED: ${e.message}`);
        }
      }
    }
  }

  const summaryPath = path.join(RESULTS_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2));
  console.log(`\nDone. ${allResults.length} runs. Summary: ${summaryPath}`);

  // Print quick comparison
  console.log('\n=== Token comparison (median of 3 runs) ===');
  for (const task of tasks) {
    const control = allResults.filter(r => r.task === task.id && r.group === 'control').map(r => r.total_tokens).sort((a,b) => a-b)[1];
    const pristine = allResults.filter(r => r.task === task.id && r.group === 'pristine').map(r => r.total_tokens).sort((a,b) => a-b)[1];
    const diff = control && pristine ? ((pristine - control) / control * 100).toFixed(1) : 'N/A';
    console.log(`  ${task.id}: control=${control || 'N/A'}, pristine=${pristine || 'N/A'}, diff=${diff}%`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
