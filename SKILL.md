---
name: pristine
aliases:
  - virgin
  - first-time
description: >
  Enforce the First-Time Principle: write every line of code, every doc, and
  every memory entry as if it were being written for the first time — no
  patches, no "what"-comments, no leftovers, no local/deployed drift.
  Responds to all of its names: "pristine", "virgin" (the informal alias for
  the principle's original name), or "first-time". MUST trigger when starting
  any implementation, refactor, or bug fix, and whenever the urge arises to
  "just patch it", "just add a special case", "just wrap it in a flag",
  "leave this commented out", or "fix it quickly on the server". Also
  triggers on doc/memory edits that append workarounds, narratives, or stale
  notes instead of rewriting the root source. Works alongside the codebase's
  other engineering rules; this one governs how any change lands.
  Cross-platform: Claude Code, OpenAI Codex, OpenCode, OpenClaw.
---

# The First-Time Principle

> Write everything as if it were being written for the first time.

## What it is

The First-Time Principle (a.k.a. the "Virgin Principle") is a governing
philosophy for code, documentation, and agent memory. It rejects patch-based
evolution: **every modification should land as its final form**, not as a
quick fix stacked on top of earlier quick fixes. Each change is a first
draft and a final draft at the same time.

It applies to everything you touch:

- **Code** — functions, modules, migrations, refactors
- **Docs** — CLAUDE.md / AGENTS.md, README, docs/, changelogs
- **Memory** — agent memory files, notes, checklists, personal rules
- **Deployments** — what runs in production must be exactly what lives in the repo

## The four laws

### 1. No patching — go back to the root cause

When something is wrong, fix the root, not the symptom. Do not accumulate
`if` special cases, do not copy old logic and tweak parameters, do not add
switches to route around a problem. A patch buys time and costs structure:
every special case makes the next change harder and the next bug more likely.

When a defect is found, ask *where does the rule actually live?* — then fix
it there, once. If the accumulated patches have made the code worse than a
clean rewrite would be, rewrite it. Rewriting from a clear understanding is
cheaper than maintaining a patch pile.

### 2. Code explains itself — comments only say "why"

Names carry the "what". A function called `isValidPhone` needs no comment
saying it validates phones. Comments are reserved for:

- **Why** — decisions that are not visible from the code itself (business
  rules, regulatory constraints, performance trade-offs)
- **History traps** — things that look wrong but are intentional

No explanatory comments, no "note:" annotations, no commented-out code
blocks. If a reader needs an explanation, the code needs a better name, not
a comment.

### 3. No residue — nothing left behind

No backup files, no leftover drafts, no dead code, no intermediate states.
Wrong output is corrected, not preserved. If a file, branch, or block no
longer serves the current design, delete it — version control keeps the
history, you keep the surface clean.

This also applies to docs and memory: a superseded rule is updated in place
(single source of truth), not appended as "as of 2026-08-03..." — history
belongs in the changelog, not in the rulebook.

### 4. Deployment parity — local and remote are one

What runs in production is what was reviewed locally. No "let me just fix
this quickly on the server" — a remote-only edit is a mutation of the truth:
the repo no longer represents reality, and the next deploy silently
overwrites the fix (or the next bug report can't be reproduced). Verify
artifacts (e.g. checksums) where the cost is justified, so that local source,
built output, and deployed output can be proven identical.

## Why it matters for AI-assisted development

In AI-assisted development, the cost of patches compounds differently than
in human-only teams:

- Code is rewritten often, but **docs and memory are the only bridge across
  sessions**. A stale memory entry makes the next agent — Claude, Codex, or
  a human — decide on a false premise.
- Agents read the whole file, not a diff. Every commented-out block and
  leftover special case is noise that dilutes the signal of the real design.
- A patch that "works" is the easiest thing to reproduce in the future,
  because it requires the least understanding. Every round of patching
  teaches the next session to patch.

The First-Time Principle is the counterweight: each change, made as if for
the first time, keeps the system evolving toward clarity instead of toward
entropy.

## How it guides everyday work

### When implementing

Before writing a change, imagine the final state: *if this feature were the
only thing in the codebase, how would it look?* Write that. If the existing
code can't host it cleanly, refactor the host — the new feature is the
excuse, not the reason, to leave a wart.

### When fixing a bug

Reproduce → trace the root cause → fix the single source of truth → remove
the patch that was working around it. If the fix requires a special case,
suspect the root cause analysis, not the codebase.

### When writing docs

Docs keep only what is **high-value, stable, and not derivable from the
code**. Anything queryable from code (route lists, field names) is not
documented. Update in place; never append narrative history. Ask: *would the
next agent make a mistake if this line were missing?* If no, cut it.

### When writing memory

One memory, one fact. No incident postmortems as narrative — compress them
into a reusable rule or delete them. Absolute dates, no "today" or "recently".
Merge duplicates; a duplicated fact is two facts that will drift apart.

## Decision table

| Situation | Patch instinct | First-time move |
|---|---|---|
| Bug at the edge of the system | Add an `if` special case | Trace to the root rule, fix it once, remove the workaround |
| Code that needs explaining | Add a "what" comment | Rename the function / extract the logic |
| Unused file or block | Keep it "just in case" | Delete it; version control remembers |
| Rule changed last month | Append "as of …" note | Edit the original entry in place |
| Production misbehaves | Quick fix on the server | Fix locally, deploy the exact source |
| Docs out of sync with code | Add a note about the drift | Update the doc to match the code |

## Final check — run before finishing any task

- [ ] If I wrote this from scratch today, would it look like this? If not — rewrite, don't patch.
- [ ] Does every comment say *why*, and nothing comments on *what*?
- [ ] Are there backups, commented-out blocks, or dead files left behind? Remove them.
- [ ] Does local source match what is deployed? (proven, not assumed)
- [ ] Is every rule defined in exactly one place? (single source of truth)
