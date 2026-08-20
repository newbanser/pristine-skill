# Pristine

**English** | [简体中文](README.md)

![Pristine cover](cover.png)

If memory loss is the root, let every AI agent rebirth follow the First-Time Principle.

Perhaps the only agent skill you need — your output, forever written for the first time. Pure, clear, economical.

Works with Claude Code, OpenAI Codex, OpenCode, and OpenClaw (open Agent
Skill format).

**Current version: v1.7.7**

## What you need to know

In vibe coding, your agent patching by habit is the norm — it is
responsible only for the current task, and will seek the solution with
the fewest steps, the least time, and the lowest cost, "treating the head
for a headache and the foot for a foot pain."

That is how the long-term codebase quietly entropy-increases: the code
gets messier, and the long-term memory needed to keep it "still working"
(context, special branches, stale conventions) gets more expensive.

So the agent needs to return to its original way of thinking — every
change written as if for the first time, a counterforce against entropy.
That is the First-Time Principle.

## What your AI needs to know

| Law | Meaning |
|-----|---------|
| **No patching — 追溯根源** | Fix the root cause, not the symptom. No `if` special cases, no copied-and-tweaked logic, no switches that route around a problem. Rewrite when the patch pile is worse than a clean rewrite. |
| **Code explains itself — 代码自释** | Names carry the "what". Comments only say "why": business rules, constraints, deliberate trade-offs. No explanatory comments, no commented-out code blocks. |
| **No residue — 不留残渣** | No backups, drafts, dead code, or intermediate states. Superseded rules are updated in place, never appended as "as of…" notes. |
| **Deployment parity — 部署如一** | What runs in production is exactly what was reviewed locally. No remote-only quick fixes — the repo must keep representing reality. |
| **Nothing extra — 单一真源** | One source for every behavior: reuse what exists, skip what doesn't need to exist. Non-trivial logic leaves one runnable mechanical verification — self-checks are a habit for humans, not a mechanism for AI. |
| **Session cost — 会话成本** | A session that grows without bound is the same entropy as a file that grows without bound. Turns are not the cost proxy — reset on **context water level** (70% soft reminder, 80% hard block; the platform auto-compacts at 83-84%), **two gauges**: the water level (how full the pool is) and the water meter (how much it consumed, accumulated `output + cache_creation` deltas). Write a **checkpoint** before every reset: state belongs on disk, not in the conversation. |
| **First draft before launch — 上线初稿** | Until production goes live there is no installed base: change the definition, not the compat. No migrations, no `ALTER TABLE` steps, no compatibility layers — delete anything that exists only to carry an old shape forward. |

## Install

Copy `SKILL.md` into your agent's skills directory:

```bash
# Claude Code
mkdir -p .claude/skills/pristine
cp SKILL.md .claude/skills/pristine/

# OpenAI Codex
mkdir -p .agents/skills/pristine
cp SKILL.md .agents/skills/pristine/

# OpenCode
mkdir -p .opencode/skills/pristine
cp SKILL.md .opencode/skills/pristine/
```

For the optional session watch (see below, "Companion tools"), copy `scripts/session-watch.js`
alongside `SKILL.md` — or clone the repo and point the hook at the clone —
so the hook path stays stable.

## Usage

The skill activates automatically when you start implementation, refactor,
or bug-fix work, and whenever the "just patch it" urge appears. You can also
invoke it by name:

- `pristine` — the formal name ("we work in pristine mode")
- `纯净原则` / `first-time` — aliases, recognized semantically via the skill
  description

## Companion tools

The seven laws are intent, not mechanism. Intent is executed by people
(models), and people's reminders and self-assessments are unreliable — so
purity lands on the codebase through scripts. Three companion scripts, for
three occasions where "counting on self-discipline" always fails.

### Session watch (session-watch)

A session that grows without bound is the same entropy as a file that
grows without bound, and dragging it out worsens twice over: **cost**
climbs with water level (the same history, past 75%, costs 3-5× per turn
— measured up to 150-167k tokens/turn), and **memory** is compressed by
the platform at 83-84% into a summary, details lost irrecoverably. Worse,
the reminder itself is unreliable — a busy model misses it, and a
completed compaction resets the water level so the reminder disappears
forever. So the watch is a hook, made mechanical, and the last line is
simply a door slam:

- **Water level** — the real context size of the latest API call
  (`cache_read + input + cache_creation + output`, from the transcript's
  `usage` block): how full the pool is; reminds when over threshold.
- **Water meter** — accumulated real deltas (`output_tokens +
  cache_creation_input_tokens`; cache reads are ~free and deliberately
  not metered, avoiding double-counting the same water): how much this
  pool consumed, in pools, to judge whether it earned its life. No turn
  counting (turns are a coarse proxy).
- **Three lines of defense** — 70% (`--threshold`) soft reminder into the
  next prompt's context, relayed by the model; **80% (`--block`) hard
  block** — exit 1 aborts your message and shows the notice directly,
  slamming the door before the platform compacts (83-84%); **the block
  itself auto-backs-up** the last ~150 transcript lines as markdown to
  `--backup` (drafts) — after exit 1 the model gets no turn and cannot
  write a checkpoint, so the machine puts the raw material on disk and the
  fresh session distills it. The machine preserves activity; the model
  preserves quality.

Wire it as a Claude Code `UserPromptSubmit` hook (fires on every user
message; a `Stop` hook also works):

```json
"hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
  "command": "node /path/to/scripts/session-watch.js --threshold 70 --block 80 --max 200000 --checkpoint /path/to/.claude/checkpoint.md --backup /path/to/03-episodic" } ] } ] }
```

With `--checkpoint`, the reminder also tells the agent to write the
checkpoint before resetting, and a checkpoint left on disk by a previous
session prints a restore instruction at the start of the next one. The
checkpoint file (default `<project root>/.claude/checkpoint.md`) holds
exactly four lines: current task / progress / next step / open questions.
Overwritten in place, never appended — it is a working surface, not a
log; anything durable that surfaces in it (a decision, a rule, a new
convention) is moved to its real home (memory / docs / code) before the
checkpoint is overwritten. Exit code: below 80% it is 0 (a reminder, not
a gate); at `--block` it is 1 (a hard gate, slamming the door before the
platform compacts).

### Pristine scan (pristine-scan)

Self-assessment is not evidence — the evaluator is the executor, so "is
it pristine?" always leans yes. The scan is the **adversarial
verification** layer of the skill: it scans a codebase for the signal
words of patch piles, residue, and pre-launch migration machinery —
`migrate`/`ALTER TABLE`/`legacy`/`_old`/`_new`, `workaround`/`hotfix`/
`special case`, `backup`/`dead`/`obsolete`, `note:` annotations and
commented-out code — and prints `file:line` hits grouped by law.

```bash
node scripts/pristine-scan.js <target-dir>   # scan a codebase
node scripts/pristine-scan.js --selftest     # verify the rule table itself
```

Over-report on purpose, converge false positives by hand (business
fallback rules and docs that quote the signal words are noise). Exit code
always 0 — a reminder, not a gate.

**For users: self-checks are a habit for humans, not an AI mechanism.** Keeping an AI
pristine is not discipline but system — wire the scan into your CI or
pre-commit hook.

### Memory drift scan (memory-scan)

Memory is the only bridge across sessions — a stale entry makes the next
agent decide on a false premise. So memory is scanned like code: **dead
reference** (a memory cites a code file that no longer exists), **deleted
claim** (a memory says a file "was deleted" but it is back on disk), and
**drift** (numeric claims like "7 permissions" that need human
verification against code).

```bash
node scripts/memory-scan.js <memory-dir> <repo-dir>   # memory ↔ code drift
node scripts/memory-scan.js --selftest                # verify the rule table
```

Run it after deleting files, changing paths, or count changes; historical
context ("implemented and deleted") converges by hand as noise. Exit code
always 0 — a reminder, not a gate.

## Examples

See [examples/before-after.md](examples/before-after.md) for
patch-instinct vs. first-time-move side-by-side comparisons.

## Credits

The reuse ladder and the `pristine:` comment tag are inspired by
[ponytail](https://github.com/DietrichGebert/ponytail) (MIT).

## License

MIT © 2026

**English** | [简体中文](README.md)
