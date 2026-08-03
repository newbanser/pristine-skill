# Pristine

![Pristine cover](cover.png)

> Write everything as if it were being written for the first time.

A cross-platform agent skill that enforces the **First-Time Principle** — the
discipline of landing every change in its final form: no patches, no
"what"-comments, no leftovers, no local/deployed drift.

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

## The four laws

| Law | Meaning |
|-----|---------|
| **No patching** | Fix the root cause, not the symptom. No `if` special cases, no copied-and-tweaked logic, no switches that route around a problem. Rewrite when the patch pile is worse than a clean rewrite. |
| **Code explains itself** | Names carry the "what". Comments only say "why": business rules, constraints, history traps. No explanatory comments, no commented-out code blocks. |
| **No residue** | No backups, drafts, dead code, or intermediate states. Superseded rules are updated in place, never appended as "as of…" notes. |
| **Deployment parity** | What runs in production is exactly what was reviewed locally. No remote-only quick fixes — the repo must keep representing reality. |

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

## Usage

The skill activates automatically when you start implementation, refactor,
or bug-fix work, and whenever the "just patch it" urge appears. You can also
invoke it by name:

- `pristine` — the formal name ("we work in pristine mode")
- `virgin` / `first-time` — aliases, recognized semantically via the skill
  description

## Examples

See [examples/before-after.md](examples/before-after.md) for
patch-instinct vs. first-time-move side-by-side comparisons.

## License

MIT © 2026
