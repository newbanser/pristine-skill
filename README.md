# Pristine

![Pristine cover](cover.png)

> Write everything as if it were being written for the first time.
> 纯净、清晰、节约 — pure, clear, economical: nothing patched, nothing hidden,
> nothing wasted.

A cross-platform agent skill enforcing the **First-Time Principle**: no
patches, no "what"-comments, no leftovers, no local/deployed drift.

Works with Claude Code, OpenAI Codex, OpenCode, and OpenClaw (open Agent
Skill format).

## Why

In AI-assisted development, patches compound differently than in
human-only teams:

- Code is rewritten often, but **docs and memory are the only bridge across
  sessions** — a stale note makes the next agent decide on a false premise.
- Agents read the whole file, not a diff — every leftover special case
  dilutes the signal of the real design.
- A patch that "works" is the easiest thing to reproduce, because it
  requires the least understanding. Each round of patching teaches the next
  session to patch.

Pristine is the counterweight: each change, made as if for the first time,
keeps the system evolving toward clarity instead of entropy.

## The seven laws

| Law | Meaning |
|-----|---------|
| **No patching** | Fix the root cause, not the symptom. No `if` special cases, no copied-and-tweaked logic, no switches that route around a problem. Rewrite when the patch pile is worse than a clean rewrite. |
| **Code explains itself** | Names carry the "what". Comments only say "why": business rules, constraints, deliberate trade-offs. No explanatory comments, no commented-out code blocks. |
| **No residue** | No backups, drafts, dead code, or intermediate states. Superseded rules are updated in place, never appended as "as of…" notes. |
| **Deployment parity** | What runs in production is exactly what was reviewed locally. No remote-only quick fixes — the repo must keep representing reality. |
| **Nothing extra** | One source for every behavior: reuse what exists, skip what doesn't need to exist. |
| **Session cost** | A session that grows without bound is the same entropy as a file that grows without bound. Around 15 turns, propose a reset. |
| **First draft before launch** | Until production goes live there is no installed base: change the definition, not the compat. No migrations, no `ALTER TABLE` steps, no compatibility layers — delete anything that exists only to carry an old shape forward. |

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

For the optional session watch (see below), copy `scripts/session-watch.js`
alongside `SKILL.md` — or clone the repo and point the hook at the clone —
so the hook path stays stable.

## Usage

The skill activates automatically when you start implementation, refactor,
or bug-fix work, and whenever the "just patch it" urge appears. You can also
invoke it by name:

- `pristine` — the formal name ("we work in pristine mode")
- `纯净原则` / `first-time` — aliases, recognized semantically via the skill
  description

## Session watch (optional companion)

[`scripts/session-watch.js`](scripts/session-watch.js) enforces the 15-turn
rule mechanically: it counts real user turns in the current session and
prints a reminder when the threshold is crossed. Wire it as a Claude Code
`UserPromptSubmit` hook (fires on every user message; a `Stop` hook also
works):

```json
"hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
  "command": "node /path/to/scripts/session-watch.js --threshold 15" } ] } ] }
```

The script reads the session transcript path from the hook's stdin — no
session discovery, no hardcoded paths, exit code always 0 (a reminder, not
a gate).

## Examples

See [examples/before-after.md](examples/before-after.md) for
patch-instinct vs. first-time-move side-by-side comparisons.

## Credits

The reuse ladder and the `pristine:` comment tag are inspired by
[ponytail](https://github.com/DietrichGebert/ponytail) (MIT).

## License

MIT © 2026
