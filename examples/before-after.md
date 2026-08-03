# Patch instinct vs. First-time move

Side-by-side comparisons of the two reflexes.

## 1. Bug at the edge of the system

**Symptom**: a state transition is allowed that shouldn't be.

**Patch instinct** — special-case it at every call site:

```js
// route A
if (lead.stage === 'graduated') return res.status(400).json({ msg: 'terminal' })
// route B
if (lead.stage === 'graduated') return res.status(400).json({ msg: 'terminal' })
// route C
if (lead.stage === 'graduated') return res.status(400).json({ msg: 'terminal' })
```

**First-time move** — the rule lives in exactly one place; every path passes
through it:

```js
// helpers.js — one guard, one source of truth
function validateStageTransition(current, next) {
  // business rule: terminal states are irreversible
}
```

Three special cases removed, zero future drift.

## 2. Code that needs explaining

**Patch**: add a comment describing what the code does.

```js
// 处理状态转换
function process() { ... }
```

**First-time**: rename so the code says it — no comment needed.

```js
function validateStageTransition(current, next) { ... }
```

## 3. A rule changed last month

**Patch**: append history to the rulebook.

> ~~state 3 → 4 is allowed~~ (as of 2026-08-03, state 3 → 4 is NOT allowed)

**First-time**: edit the rule in place — the doc reads as if it was always
true. History belongs in the changelog, not the rulebook.

## 4. Production misbehaves

**Patch**: "let me just fix this quickly on the server."

- The repo no longer represents reality.
- The next deploy silently overwrites the fix.
- The next bug report can't be reproduced.

**First-time**: fix locally, deploy the exact source — local and remote
proven identical (e.g. checksum verification).

## 5. An unused block

**Patch**: "keep it, just in case."

**First-time**: delete it — version control remembers.
