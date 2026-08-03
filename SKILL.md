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

A governing philosophy for code, docs, and agent memory: every modification
lands as its final form — a first draft and a final draft at the same time.
It applies to everything you touch: code, docs (CLAUDE.md/AGENTS.md, README,
docs/), memory files, and deployments.

## The four laws

### 1. No patching — go back to the root cause

Fix the root, not the symptom. Do not accumulate special-case `if`s, copy
old logic and tweak parameters, or add switches to route around a problem —
a patch buys time and costs structure. Ask *where does the rule actually
live?*, fix it there once, and remove the workaround. If the patch pile is
worse than a clean rewrite, rewrite it.

### 2. Code explains itself — comments only say "why"

Names carry the "what". Comments are reserved for decisions not visible from
the code: business rules, constraints, history traps. No explanatory
comments, no "note:" annotations, no commented-out code blocks. If a reader
needs an explanation, the code needs a better name.

### 3. No residue — nothing left behind

No backups, drafts, dead code, or intermediate states — version control
keeps history, you keep the surface clean. Superseded rules are updated in
place (single source of truth), never appended as "as of …" notes: history
belongs in the changelog, not the rulebook.

### 4. Deployment parity — local and remote are one

What runs in production is what was reviewed locally. A remote-only quick
fix mutates the truth: the repo no longer represents reality, the next
deploy silently overwrites the fix, and the next bug can't be reproduced.
Verify artifacts (e.g. checksums) where justified.

## Why it matters for AI-assisted development

Code is rewritten often, but **docs and memory are the only bridge across
sessions** — a stale entry makes the next agent decide on a false premise.
Agents read whole files, not diffs, so every leftover special case dilutes
the real design. And a patch that works is the easiest thing to reproduce,
because it needs the least understanding — each round of patching teaches
the next session to patch. Pristine is the counterweight: changes made as if
for the first time keep the system evolving toward clarity, not entropy.

## Decision table

| Situation | Patch instinct | First-time move |
|---|---|---|
| Bug at the edge | Add an `if` special case | Trace to the root rule, fix once, remove the workaround |
| Code needs explaining | Add a "what" comment | Rename the function / extract the logic |
| Unused file or block | Keep it "just in case" | Delete it — version control remembers |
| Rule changed last month | Append "as of …" note | Edit the original entry in place |
| Production misbehaves | Quick fix on the server | Fix locally, deploy the exact source |
| Docs out of sync | Add a note about the drift | Update the doc to match the code |

## Final check — before finishing any task

- [ ] Would I write it this way from scratch today? If not — rewrite, don't patch.
- [ ] Do comments say *why* only, never *what*?
- [ ] Any backups, commented-out blocks, dead files? Remove them.
- [ ] Does local source match what's deployed? (proven, not assumed)
- [ ] Is every rule defined in exactly one place?
