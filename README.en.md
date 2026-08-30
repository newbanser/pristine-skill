# Pristine — The First-Time Principle

![Pristine](cover.png)

![LICENSE](https://img.shields.io/badge/LICENSE-MIT-333?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.2-8B5CF6?style=flat-square)
![Agent Skills](https://img.shields.io/badge/Agent_Skills-Standard-8B5CF6?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Codex](https://img.shields.io/badge/Codex-Skill-10B981?style=flat-square&logo=openai&logoColor=white)
![40+ Agents](https://img.shields.io/badge/40%2B_Agents-Compatible-3B82F6?style=flat-square)

If memory loss is the root, let every AI agent rebirth follow the First-Time Principle.

Perhaps the only agent skill you need — your output, forever written as if for the first time. Pure, clear, economical, objective, adversarial.

Works with Claude Code, OpenAI Codex, OpenCode, OpenClaw, Doubao.

> Current version **v2.2** · See [CHANGELOG](CHANGELOG.md) for updates

[简体中文](README.md) | **English**

---

## Before & After

Same model, same tasks. We compared three setups: nothing installed, Pristine installed, and a popular minimalist skill from GitHub with 110k+ stars.

Pristine: **78% less output · 8/8 code tasks pass execution verification with zero failures · complete but not bloated.**

The popular skill compresses harder (LOC down to 55%), but over-compresses on one task and drops error handling for dirty data; Pristine passes 8/8 with zero failures — **"complete" is stability, not just brevity.**

![Deterministic benchmark: three-way comparison](benchmarks/results/benchmark-deter.svg)

### Example: vague premise

User says: "The API returns 500, probably the database is slow."

- **Without pristine (1545):** Also questions the premise, but buries it in padding and SQL examples for every step — low information density
- **Just "be concise" (21):** "Add index, optimize SQL, cache, shard" — buzzwords, not actionable
- **With pristine (226):** Questions the premise first, then gives actionable steps:

> First, confirm: a 500 doesn't mean the database is slow. Check logs for the actual error stack and slow queries before optimizing.
>
> 1. Check logs: identify the 500 error type (connection timeout, lock wait, pool exhaustion)
> 2. Check slow queries: `EXPLAIN ANALYZE` to find the costliest SQL
> 3. Check connection pool: `SHOW PROCESSLIST` for connection backlog
> 4. Check system metrics: high CPU = heavy queries, high IO = missing indexes, high memory = cache issues
>
> Send me the slow query log and `SHOW PROCESSLIST` when done, and I'll give the specific fix.

### Example: implement login

- **Without pristine (4096, truncated):** Auto-adds registration, frontend pages, a tutorial — hits max_tokens, core code unfinished
- **Just "be concise" (499):** Tight code but stores passwords in plaintext
- **With pristine (593):** Only the endpoint, salt + pbkdf2 hashing, input sanitization for injection prevention

### Key findings

- Fixes default defects: **accepting premises** (question unverified assumptions), **scope creep** (don't do what wasn't asked), **unbounded output** (stop when done)
- **Pristine ≠ terse:** just asking for brevity saves until it's unusable; pristine demands "necessary completeness"
- Fewer tokens is a side effect, not the goal; what's really saved is **human time** (reading, filtering, follow-ups, rework)

<sub>Reproduce: `python3 benchmarks/deter/skillbench-deter.py`; full data and methodology in `benchmarks/results/REPORT.md`.</sub>

---

## What you need to know

### Entropy is physics

The second law of thermodynamics: closed systems move from order to disorder. Code, docs, memory, and conversations are information systems — unmaintained, they entropy-increase.

> Strictly a metaphor: information does not "rot" the way a thermodynamic system does; it degrades because requirements change and no one maintains it. But the direction is real — what is not actively counteracted always drifts toward chaos, never toward tidiness. We use "entropy" for this one-way decay, not as a physics claim.

Humans spontaneously fight entropy with intuition and common sense: seeing two conflicting versions makes us stop and verify, seeing noise makes us skip it, seeing stale information makes us doubt it. AI has neither mechanism. It faithfully executes chaos. AI is not the cause of entropy; it is the amplifier.

### AI has three unhealable defects

Entropy alone is not dangerous — the inability to self-heal is.

| Defect | Consequence |
|---|---|
| **Memory loss** | No persistent memory; survives across sessions via files. Files rot (paths move, counts change, old names linger), and AI reads files whole, not diffs — one stale entry is a false premise for the next session |
| **Cost** | Context window is a hard constraint. Long sessions run on truncated/stale context late in life, equivalent to working in a half-amnesic state. Past 75% water level, each turn costs 3–5× the opening; in one observed 34-turn session the tail 25% was ~50% of total cost (single observation, not a benchmark) |
| **Multiple sources of truth** | Same rule defined in multiple places — AI does not verify, it picks one at random or mixes them. Multiple sources = no source. Patching is writing a second bible |

These three problems AI cannot fix itself. An external discipline is required to reset entropy on every change.

### Pristine = the counterforce

The seven laws are concrete counter-measures. The four-layer framework is the scope of the fight (from thought to output). Mechanical verification is the landing mechanism (evaluator = executor, self-assessment is unreliable).

Core maxim: "Write everything as if for the first time" — reset entropy on every change, accumulate no historical baggage. Economy forces reliability.

Causal chain: Entropy (physics) → AI has no safety net (amplifies) → three defects (cannot self-heal) → Pristine (counterforce).

### Objectivity and adversariality (core philosophy)

AI has three default tendencies that pollute judgment: **sycophancy** (when a conclusion agrees with the user, it goes unexamined), **answering on impulse** (concluding before seeking a counterexample), and **accepting premises** (not questioning input). These are entropy showing up at the thought layer.

"Write everything as if for the first time" inherently contains objectivity and adversariality: no pre-existing stance is objectivity; not being led by historical answers is adversariality. Adversariality is the means to objectivity — actively seek the strongest counterargument and check whether a conclusion merely echoes the user, rather than passively staying neutral.

Landing as two executable rules (see `SKILL.md`): **refutation first**, **sycophancy check**. They are trigger signals, not a procedure — no step template, so they cannot be performed performatively.

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

- **Pristine principle** — instant correction. "Does this follow the pristine principle?" → answer against the principle on the spot
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

### Session cost playbook

An unbounded session is the same entropy as an unbounded file. Every turn re-sends the whole history under a harsh cost model: first mention is full price, later mentions are cached-read price only.

**Turn count is not the cost proxy.** The real trigger is the **context water level**: when the working context nears 70–80% of capacity, the session is at end of life — later turns run on stale or truncated context, paying again for facts that were already evicted.

**Two gauges: water level and water meter.** Water level = the exact context size of the last API call (`cache_read + input + cache_creation + output`), read from the `usage` block of the session record. It says **when** to close the valve. Water meter = the sum of per-turn increments (`output_tokens + cache_creation_input_tokens`), cached reads are near-free and uncounted. It says **whether it's worth it**: heavy tasks at 1.5 pools are normal; light chat at 4 pools is a leaky-budget habit.

**Thresholds are tunable, principles are law.** The 70–80% level and the 1.5/4-pool figures are empirical values for today's mainstream context windows and pricing — when models change, contexts double, or pricing shifts, the numbers move, but "reset on water level, not turn count" and "write a checkpoint before every reset" stay.

**Five session-hygiene laws:**
1. One session, one task. When the task is done, start a new session.
2. Reset on water level, not turn count. When done or context is heavy, propose a checkpoint then `/clear`. No silent continuation.
3. Write a checkpoint before every reset — never clear without a record.
4. Cost is a habit, not a tool. Choose a workflow, not a vendor.
5. Don't restart mid-task for frugality. Finish the task, then reset.

**Checkpoint:** state lives on disk, not in the conversation. File `<vault>/.claude/checkpoint.md`, overwritten in place, never appended. Exactly four items: current task (one line), progress, next step (concrete enough to resume without the session), open items. Read and overwrite in the next session. A checkpoint is a workbench, not a source of truth: persistent content moves to its real home before being overwritten.

## Decision table

| Situation | Patch instinct | Pristine action |
|---|---|---|
| Edge bug | Add an `if` special case | Trace the root rule, fix once, remove the workaround |
| Code needs explanation | Add a "what" comment | Rename the function / extract the logic |
| Unused file or block | Keep it "just in case" | Delete — version control remembers |
| A rule changed | Append an "as of…" note | Edit the original entry in place |
| Production anomaly | Quick-fix on the server | Fix locally, deploy the exact source |
| Docs out of sync | Add a drift note | Update the docs to match the code |
| New feature | Build a new module | Reuse what exists, write only the missing part — or skip |
| Rename column before launch | Write migration / `ALTER TABLE` | Edit the CREATE TABLE, rebuild the database |
| Old form in the code | Add a compatibility layer | Delete — no installed base yet |
| User asks a question | Bury the answer in context | Lead with the answer, explain if needed |
| Multi-step task | Narrate steps in prose | Numbered list, one bounded action per step |
| Notices a side issue | Fix it "by the way" | Finish the current task, raise it separately |

## One line

Self-checks are a habit for humans, not a mechanism for AI. Keeping an AI pristine is not discipline — it is system.

---

Brought to you by [Bailu](https://github.com/bailu-agent).

MIT License. Star if it saved you one patch.

[简体中文](README.md) | **English**
