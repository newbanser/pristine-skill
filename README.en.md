# Pristine — The First-Time Principle

![Pristine](cover.png)

![LICENSE](https://img.shields.io/badge/LICENSE-MIT-333?style=flat-square)
![Agent Skills](https://img.shields.io/badge/Agent_Skills-Standard-8B5CF6?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Codex](https://img.shields.io/badge/Codex-Skill-10B981?style=flat-square&logo=openai&logoColor=white)
![40+ Agents](https://img.shields.io/badge/40%2B_Agents-Compatible-3B82F6?style=flat-square)

If memory loss is the root, let every AI agent rebirth follow the First-Time Principle.

Perhaps the only agent skill you need — your output, forever written as if for the first time. Pure, clear, economical.

Works with Claude Code, OpenAI Codex, OpenCode, OpenClaw, Doubao.

[简体中文](README.md) | **English**

---

## Before & After

> Measured: DeepSeek Chat, 6 tasks × 2 groups × 3 runs = 36 calls. Full data: `benchmarks/results/REPORT.md`.

### Output tokens reduced by 77.4% on average

| Task | Without pristine | With pristine | Reduction |
|---|---|---|---|
| Fix edge bug | 356 | 98 | 72.5% |
| Implement login | 4096 (truncated) | 795 | 80.6% |
| Answer vague premise | 1216 | 196 | 83.9% |
| Refactor duplicate code | 617 | 252 | 59.2% |
| Explain concept | 969 | 177 | 81.7% |
| Add feature | 1933 | 267 | 86.2% |

### Example: vague premise

User says: "The API returns 500, probably the database is slow."

**Without pristine (1216 tokens):** Accepts the premise, gives a six-dimension optimization plan (cache, index, SQL, architecture, hardware, monitoring).

**With pristine (196 tokens):**

> First enable slow query log, confirm it's actually the database.
>
> 1. Check slow query log: `SHOW VARIABLES LIKE 'slow_query_log'`
> 2. Analyze: `EXPLAIN` to see if there's a full table scan
> 3. Fix the slowest one: usually missing index
> 4. Verify: rerun `EXPLAIN`, check if `rows` dropped
>
> Send me the slowest SQL from the slow log when done.

### Example: implement login

**Without pristine:** Auto-adds registration, frontend pages (login.html/register.html/dashboard.html), hits 4096 token limit and gets truncated.

**With pristine (795 tokens):** Only login + register endpoints, uses better-sqlite3 prepared statements for injection prevention, Node built-in crypto for hashing (no bcrypt dependency), concrete next step.

### Key findings

- Output tokens reduced by 77.4% on average
- 1/6 tasks truncated without pristine (unbounded output)
- Thought purity works: questions premises before accepting
- Planning purity works: only does what's in scope, no auto-added features
- Small tasks have fixed cost: SKILL.md ~2800 tokens, total tokens increase for small tasks; large tasks benefit clearly

---

## What you need to know

### Entropy is physics

The second law of thermodynamics: closed systems move from order to disorder. Code, docs, memory, and conversations are information systems — unmaintained, they entropy-increase.

Humans spontaneously fight entropy with intuition and common sense: seeing two conflicting versions makes us stop and verify, seeing noise makes us skip it, seeing stale information makes us doubt it. AI has neither mechanism. It faithfully executes chaos. AI is not the cause of entropy; it is the amplifier.

### AI has three unhealable defects

Entropy alone is not dangerous — the inability to self-heal is.

| Defect | Consequence |
|---|---|
| **Memory loss** | No persistent memory; survives across sessions via files. Files rot (paths move, counts change, old names linger), and AI reads files whole, not diffs — one stale entry is a false premise for the next session |
| **Cost** | Context window is a hard constraint. Long sessions run on truncated/stale context late in life, equivalent to working in a half-amnesic state. Past 75% water level, each turn costs 3–5× the opening; in one 34-turn session the tail 25% was 50% of total cost |
| **Multiple sources of truth** | Same rule defined in multiple places — AI does not verify, it picks one at random or mixes them. Multiple sources = no source. Patching is writing a second bible |

These three problems AI cannot fix itself. An external discipline is required to reset entropy on every change.

### Pristine = the counterforce

The seven laws are concrete counter-measures. The four-layer framework is the scope of the fight (from thought to output). Mechanical verification is the landing mechanism (evaluator = executor, self-assessment is unreliable).

Core maxim: "Write everything as if for the first time" — reset entropy on every change, accumulate no historical baggage. Economy forces reliability.

Causal chain: Entropy (physics) → AI has no safety net (amplifies) → three defects (cannot self-heal) → Pristine (counterforce).

### What it doesn't do

Pristine is not a silver bullet. It does not guarantee correct code, complete features, or replace testing and review. It guarantees one thing: **the system does not entropy-increase**.

A pristine bug is still a bug. A pristine wrong architecture is still a wrong architecture. Purity is a floor, not a ceiling — it lets you go further in the right direction, it does not guarantee the direction is right.

It also does not fit every scenario: exploratory prototypes, one-off scripts, and throwaway code do not need purity. The cost of purity is thinking time — not worth paying for code that lives three days.

## What your AI needs to know

### The seven laws

| Law | Meaning |
|---|---|
| **No patching — 追溯根源** | Fix the root, not the symptom. No special-case `if`s, no copied-and-tweaked logic, no switches that route around a problem. Rewrite when the patch pile is worse than a clean rewrite |
| **Code explains itself — 代码自释** | Names carry the "what". Comments only say "why": business rules, constraints, deliberate trade-offs. No explanatory comments, no commented-out code |
| **No residue — 不留残渣** | No backups, drafts, dead code, or intermediate states. Superseded rules are updated in place, never appended as "as of…" notes |
| **Deployment parity — 部署如一** | What runs in production is exactly what was reviewed locally. No remote-only quick fixes |
| **Nothing extra — 单一真源** | One source for every behavior. Reuse what exists first; what doesn't need to exist, don't write |
| **Session cost — 会话成本** | An unbounded session is the same entropy as an unbounded file. Reset on context water level, not turn count; write a checkpoint before every reset |
| **First draft before launch — 上线初稿** | No installed base before launch. Change the definition, not the compat. No migrations, no compatibility layers |

### Four-layer framework (v2)

v2 extends purity from code to four layers, forming a causal chain: impure thought → impure planning → impure execution → impure output. Fixing output without fixing the layer above is patching.

| Layer | Governs | Maps to laws |
|---|---|---|
| **Thought purity** (input) | What premises to accept, reject, and not carry forward | 1, 5 |
| **Planning purity** (decision) | How goals decompose, what to include/exclude, how to validate before execution | 7 |
| **Execution purity** (action) | How actions are performed, what tools to use, how state is tracked, how sessions are managed | 1, 3, 4, 6 |
| **Output purity** (delivery) | Form and density of artifacts and conversation | 2, 5, 7 |

The output layer adds **conversation purity** — 9 rules: lead with the answer, number multi-step tasks, end with one concrete next step, suppress tangents, matter-of-fact tone, cap lists at 5, no preamble/recap/closers, specific time estimates, make wins visible. Full rules in `SKILL.md`.

## Install

**One-line install (recommended):** just tell your agent:

```
Install this skill for me: https://github.com/newbanser/pristine-skill
```

The agent clones it into the right directory — no path fiddling.

**Manual install:** copy `SKILL.md` into your agent's skills directory:

```bash
# Claude Code
mkdir -p .claude/skills/pristine && cp SKILL.md .claude/skills/pristine/

# OpenAI Codex
mkdir -p .agents/skills/pristine && cp SKILL.md .agents/skills/pristine/

# OpenCode
mkdir -p .opencode/skills/pristine && cp SKILL.md .opencode/skills/pristine/
```

Zero-install: send the full `SKILL.md` as a prompt — the AI enters pristine mode from then on.

## Usage

The skill auto-activates when you start implementation, refactor, or bug-fix work, and whenever the "just patch it" urge appears.

Invoke by name: `pristine`, `纯净原则`, or `first-time`.

Three trigger levels:

- **Pristine principle** — instant correction. "Does this follow the pristine principle?" → immediate对照 answer
- **Pristine self-check** — periodic audit. "Stop and self-check" → item-by-item report
- **Pristine scan** — mechanical fallback. "Scan it" → run the script, output is the verdict

## Companion tools

The seven laws are intent, not mechanism. Intent is executed by people (models), and people's reminders and self-assessments are unreliable — so purity lands on the codebase through scripts.

### Pristine scan (pristine-scan)

Scans a codebase for signal words of patch piles, residue, and pre-launch migration machinery, plus dead-code detection and SOURCE annotation verification. Over-report on purpose, converge false positives by hand.

```bash
node scripts/pristine-scan.js <target-dir>   # scan codebase
node scripts/pristine-scan.js --selftest     # verify the rule table itself
node scripts/pristine-scan.js --map <dir>    # generate SOURCE map
```

### Memory drift scan (memory-scan)

Memory is the only bridge across sessions — a stale entry makes the next agent decide on a false premise. Checks dead references, deleted claims, and numeric drift.

```bash
node scripts/memory-scan.js <memory-dir> <repo-dir>
```

### Session watch (session-watch)

Wired as a hook, mechanically monitors context water level. 70% soft reminder, 80% hard block (slams the door before the platform's 83–84% auto-compaction), auto-backs-up the last ~150 transcript lines at block moment. Two gauges: water level (how full the pool is) and water meter (how much this pool consumed).

```json
"hooks": {
  "UserPromptSubmit": [{
    "hooks": [{
      "type": "command",
      "command": "node /path/to/scripts/session-watch.js --threshold 70 --block 80 --max 200000 --checkpoint /path/to/.claude/checkpoint.md --backup /path/to/backup"
    }]
  }]
}
```

## One line

Self-checks are a habit for humans, not a mechanism for AI. Keeping an AI pristine is not discipline — it is system.

---

Brought to you by [Bailu](https://github.com/bailu-agent).

MIT License. Star if it saved you one patch.

[简体中文](README.md) | **English**
