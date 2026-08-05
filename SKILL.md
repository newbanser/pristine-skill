---
name: pristine
aliases:
  - 纯净原则
  - first-time
description: >
  Enforce the First-Time Principle: write every line of code, every doc, and
  every memory entry as if it were being written for the first time — no
  patches, no "what"-comments, no leftovers, no local/deployed drift.
  Responds to all of its names: "pristine", "纯净原则", or "first-time". MUST
  trigger when starting any implementation, refactor, or bug fix, and whenever
  the urge arises to "just patch it", "just add a special case", "just wrap it
  in a flag", "leave this commented out", or "fix it quickly on the server".
  Also triggers on doc/memory edits that append workarounds, narratives, or
  stale notes instead of rewriting the root source. Also triggers when a
  session is getting long and its context is drifting — see the session-cost
  section for the 15-turn rule. Works alongside the codebase's other
  engineering rules; this one governs how any change lands.
  Cross-platform: Claude Code, OpenAI Codex, OpenCode, OpenClaw.
---

# The First-Time Principle

> Write everything as if it were being written for the first time.
>
> 纯净、清晰、节约 — pure, clear, economical: nothing patched, nothing
> hidden, nothing wasted.

A governing philosophy for code, docs, and agent memory. It applies to
everything you touch: code, docs (CLAUDE.md/AGENTS.md, README, docs/),
memory files, and deployments.

## The six laws

### 1. No patching — go back to the root cause

Fix the root, not the symptom. Do not accumulate special-case `if`s, copy
old logic and tweak parameters, or add switches to route around a problem —
a patch buys time and costs structure. Ask *where does the rule actually
live?*, fix it there once, and remove the workaround. If the patch pile is
worse than a clean rewrite, rewrite it.

Rewrite is structure repair, not behavior change: healthy structure is
fixed in place, only a patch pile is rewritten. Never rewrite code you
merely dislike, and never rewrite more than the one broken root at a
time.

### 2. Code explains itself — comments only say "why"

Names carry the "what". Comments are reserved for decisions not visible from
the code: business rules, constraints, history traps. Deliberate
simplifications (global lock, O(n²) scan, naive heuristic) carry their
ceiling and upgrade path in a comment — untold, a trade-off reads as a
bug. No explanatory comments, no "note:" annotations, no commented-out
code blocks. If a reader needs an explanation, the code needs a better
name.

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

### 5. Nothing extra — one source for every behavior

Purity means nothing duplicated. Reuse the helper, util, or pattern that
already exists — stdlib, platform, installed dependency — before writing
it by hand. Ask whether the feature needs to exist at all (YAGNI) first:
the cleanest code is the code never written.

Purity is not skimping: understanding the problem, input validation at
trust boundaries, error handling that prevents data loss, security,
accessibility are never cut. Non-trivial logic leaves one runnable
self-check.

### 6. Session cost — keep sessions lean

A session that grows without bound is the same entropy as a file that grows
without bound. Every new turn re-sends the full history, and the cost model
is harsh: history is charged at full price on the first mention, then only
at cache-read rates on later turns — so each added turn costs roughly the
new tokens at full price plus the accumulated history at a fraction.

Measured on real workloads, the per-turn cost curve has a clear sweet spot:
short sessions never build a useful cache; long sessions pay to re-ship
thousands of tokens that the model has already seen. Around **15 turns per
session**, cache is saturated and marginal cost is near its floor — beyond
that, every extra turn buys less and less.

#### The laws of session hygiene

1. **One task per session.** When a task is done, start fresh. Do not let a
   session accumulate unrelated turns.
2. **Around 15 turns, propose a reset.** When a session approaches its
   sweet spot and the task still needs more work, say so: "this session is
   getting long — /clear and continue, the context will be leaner and
   cheaper." Do not silently keep going.
3. **Cost belongs to the habit, not the tool.** The per-turn cost of
   carrying history is identical across tools — an editor that keeps one
   long-lived chat panel invites drift; a context-switched one fragments
   naturally. Choose the workflow, not the vendor.
4. **A fresh session is not a lost session.** Persist conclusions in
   notes/docs before resetting — memory is the bridge across sessions, same
   as law 3 says for files.

These are not pricing trivia: a session that runs to hundreds of turns
costs an order of magnitude more than fifteen disciplined ones doing the
same work, and the tail turns run on stale context. Treat session length
like any other residue — cut it at the root. The companion script
`scripts/session-watch.js` enforces the 15-turn rule mechanically via a
Claude Code `UserPromptSubmit` hook (see README).

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
| New feature | Build a fresh module | Reuse what exists, write only what's missing — or skip it (YAGNI) |

## Final check — before finishing any task

- [ ] Would I write it this way from scratch today? If not — rewrite, don't patch.
- [ ] Reused what exists, wrote only what's missing — nothing to delete?
- [ ] Do comments say *why* only, never *what*?
- [ ] Any backups, commented-out blocks, dead files? Remove them.
- [ ] Does local source match what's deployed? (proven, not assumed)
- [ ] Is every rule defined in exactly one place?
