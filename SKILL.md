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

### Relationship to domain skills

Pristine is a meta-law: it governs *how any change lands*, in any domain.
Domain skills (a knowledge system, a writing practice, a specific
codebase's rules) govern *what* is produced within their domain. Every
domain skill's output is still a change, so it still lands under these
seven laws — a domain skill may say "write the dictionary this way", it
may not say "leave this draft in place" or "append an as-of note". The
domain layer adds, the meta layer constrains. Domain skills do not need
to be public projects to benefit; the hierarchy is about discipline, not
distribution.

## The seven laws

### 1. No patching — 追溯根源

Fix the root, not the symptom. Do not accumulate special-case `if`s, copy
old logic and tweak parameters, or add switches to route around a problem —
a patch buys time and costs structure. Ask *where does the rule actually
live?*, fix it there once, and remove the workaround. If the patch pile is
worse than a clean rewrite, rewrite it.

Rewrite is structure repair, not behavior change: healthy structure is
fixed in place, only a patch pile is rewritten. Never rewrite code you
merely dislike, and never rewrite more than the one broken root at a
time.

### 2. Code explains itself — 代码自释

Names carry the "what". Comments are reserved for decisions not visible from
the code: business rules, constraints, history traps. Deliberate
simplifications (global lock, O(n²) scan, naive heuristic) carry their
ceiling and upgrade path in a `pristine:` comment — untold, a trade-off
reads as a bug; tagged, the debt stays greppable. No explanatory comments,
no "note:" annotations, no commented-out code blocks. If a reader needs an
explanation, the code needs a better name.

### 3. No residue — 不留残渣

No backups, drafts, dead code, or intermediate states — version control
keeps history, you keep the surface clean. Superseded rules are updated in
place (single source of truth), never appended as "as of …" notes: history
belongs in the changelog, not the rulebook.

### 4. Deployment parity — 部署如一

What runs in production is what was reviewed locally. A remote-only quick
fix mutates the truth: the repo no longer represents reality, the next
deploy silently overwrites the fix, and the next bug can't be reproduced.
Verify artifacts (e.g. checksums) where justified.

### 5. Nothing extra — 单一真源

Purity means nothing duplicated. Reuse the helper, util, or pattern that
already exists — stdlib, platform, installed dependency — before writing
it by hand.

Ask *does it need to exist at all* first; if it does, climb the reuse
ladder and stop at the first rung that holds:

1. Does the codebase already have it? Reuse, don't re-write.
2. Does the standard library cover it? Use it.
3. Does the platform provide it natively? Use it.
4. Does an installed dependency solve it? Use it.
5. Can it be one line? Make it one line.

Only then write the minimum that works. The ladder runs after you
understand the problem, not instead of it — a small diff you don't
understand is not purity, it's a second bug.

Purity is not skimping: understanding the problem, input validation at
trust boundaries, error handling that prevents data loss, security,
accessibility are never cut. Non-trivial logic leaves one runnable
mechanical verification — self-checks are a habit for humans, not a
mechanism for AI (see Adversarial verification).

### 6. Session cost — 会话成本

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

### 7. Before launch, everything is a first draft — 上线初稿

Until production goes live, there is no installed base: the codebase is a
first draft, and "because it used to be different" never applies. Change a
column? Edit the CREATE TABLE and rebuild the database — no migration
functions, no `ALTER TABLE` upgrade steps, no compatibility layers, no
snapshots for old structures. Found code that exists only to carry an old
shape forward? Delete it back to the root. The day before launch and the
day after must read the same: the schema is what the code says it is.

Migrations, fallbacks, and "old → new" translation layers are launch-day
machinery. Writing them before launch is writing residue.

The tell: any code, comment, or file that implies "previously",
"legacy", "old", "compat", "backward", "_old"/"_new", or a migration
step is a confession — in a pre-launch codebase it should not exist.
Signal-word hits are a starting point, not a verdict: business fallback
rules and docs that quote the signal words are noise — converge them by
hand (see Adversarial verification).

## Adversarial verification — self-assessment is not evidence

Self-checks are a habit for humans, not a mechanism for AI. A model
cannot police itself: the evaluator is the executor, so asking "is it
pristine?" always leans yes (confirmation bias), and the trigger words
never appear in its head at the moment of patching. AI relies on
systems, not discipline — the mechanical answer is the companion
script:

```
node scripts/pristine-scan.js <target-dir>    # scans for residue signal words
node scripts/pristine-scan.js --selftest      # verifies the rule table itself
```

The verdict is the output, not the self-assessment. Over-report on purpose,
converge false positives by hand: business fallback rules, test seeds, and
documentation that quotes the signal words are noise; code that carries an
old shape forward, compatibility layers, dead branches, and commented-out
code are real. A clean scan is the claim, the scan is the evidence.

### Memory drift — memory files rot the same way code does

Memory files are the bridge across sessions: the next agent reads whole
files, not diffs, so a stale entry is a false premise for a whole session.
Memory rots silently — file paths move or get deleted, counts change
(7 permissions become 9), old names linger.

The companion script makes the rot mechanical to find:

```
node scripts/memory-scan.js <memory-dir> <repo-dir>   # memory ↔ code drift
node scripts/memory-scan.js --selftest                # verify the rule table
```

What it checks:

- **断链 (dead reference)** — a memory file cites a code file path that
  does not exist (or is now a symlink). Reference rot is structured — a
  path either exists or it does not — so a machine beats self-report.
- **已删声称 (deleted claim)** — a memory file says a file "was deleted"
  but the file is back on disk.
- **漂移 (drift)** — numeric claims ("7 项权限") need human verification
  against code. Auto-verification would need a mapping table, and a
  hand-maintained table drifts into a fake source itself — so the scan
  reminds, the human checks.

Memory hygiene follows the same discipline as code: edits land as if for
the first time. Deleting a file means also checking the memory entries
that reference it — the scanner names the ones you missed. A clean scan
is the claim; the scan is the evidence. Run it after any memory edit that
touches file paths, counts, or "was deleted" claims.

### Map index — the map is not the territory

"Code is the single source of truth" has a practical problem: nobody can
hold the whole codebase in their head. The answer is not more documents —
a document that restates a rule is a duplicate source that will drift.
The answer is an index: a map that points to where rules live and how to
reach them, without ever containing the rule itself. A map can be
arbitrarily fine-grained and never becomes a second source of truth,
because it holds no content — only coordinates.

The map grows out of the code, not out of a hand-maintained table (a
hand table drifts and becomes a fake source itself). Three layers, each
with its own consumer:

- **机器层 (machine)** — `// SOURCE: name` annotations + the scanner's
  dead/duplicate verification. The source list is whatever the scan finds.
- **人类层 (human)** — an in-app docs page driven by an API that returns
  the rules themselves (e.g. `/api/meta/rules`); the page renders what the
  backend serves, never a hardcoded copy.
- **AI 层 (agent)** — memory entries point to files and values, they do
  not restate them; a memory that quotes a count or a path is a frozen
  moment that will rot.

The machine map is generated, not written:

```
node scripts/pristine-scan.js --map[=path] <target-dir>   # write SOURCE_MAP.md
```

The generated map lists every `// SOURCE:` annotation as healthy, dead,
or duplicated. A clean map is the claim, the map is the evidence — run it
after consolidating sources, deleting files, or moving rules.

### Dead-code and source verification

Beyond signal words, the scan extracts definitions and verifies them
mechanically:

- **Dead code** — a defined name that appears codebase-wide exactly once (its
  own definition line) has zero callers. The moment a definition stops being
  referenced, the scanner names it instead of waiting for a human to ask.
- **Source annotations** — a true single source marks itself with a comment:
  `// SOURCE: name`. The scanner collects every annotation and verifies it:
  - `真源（有调用）` — healthy, referenced somewhere
  - `死真源（标注但零调用）` — nothing uses it; it is not a source of anything
  - `重复定义（N 个文件都有定义形态）` — the truth has copies

Consolidating scattered copies into a single source is three moves, not one:

1. **Create the source** — one definition, marked `// SOURCE: name`
2. **Delete every duplicate** — grep the old copies and remove them all
3. **Verify the call sites** — every caller resolves to the new source

Done means provable, not intended: a `死代码` hit for the old name or a
`重复定义` hit on the annotation means the consolidation is incomplete. The
source list grows out of the code, not out of a hand-maintained table (a
hand table drifts out of sync and becomes a fake source itself). Two
consequences: consolidating requires annotating (an unmarked source is
invisible to the scan), and only full-codebase scans are scans (dead-code
counts are global; partial scans over-report).

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
| Column renamed (pre-launch) | Write a migration / `ALTER TABLE` step | Edit the CREATE TABLE, rebuild the database |
| Old shape found in code | Add a compatibility layer | Delete it — no installed base exists yet |

## Final check — before finishing any task

- [ ] Would I write it this way from scratch today? If not — rewrite, don't patch.
- [ ] Reused what exists, wrote only what's missing — nothing to delete?
- [ ] Do comments say *why* only, never *what*?
- [ ] Any backups, commented-out blocks, dead files? Remove them.
- [ ] Does local source match what's deployed? (proven, not assumed)
- [ ] Is every rule defined in exactly one place?
- [ ] Before launch: any migration, compat layer, or "old → new" fallback in the codebase? Remove it — the schema is what the code says it is.
