---
name: eggent-execution
description: "Use to implement an approved plan in eggent. Optimized for pragmatic execution: workstream-based progress, targeted verification, manual QA for UI/mobile work, and minimal process overhead."
---

# Eggent Execution

Implement an approved plan in `eggent`.

This skill is for executing plans in the style this project actually needs:

- pragmatic
- fast-moving
- one developer
- lots of chat, UI, mobile, PWA, and integration work
- no unnecessary process ceremony

**Announce at start:** "I'm using the eggent-execution skill to implement this plan."

## Default Execution Mode

Default to finishing the work in this session if it is feasible.

Do not artificially stop after a tiny batch unless:

- the user asked for checkpoints
- you hit a real blocker
- the plan is wrong or incomplete
- manual validation requires user/device access you do not have

## Step 1: Load And Review The Plan

1. Read the plan file.
2. Review it critically before touching code.
3. Check whether the plan still matches the current codebase.
4. If something important is off, say so briefly and adjust execution accordingly.

Do not follow the plan blindly if the repo has moved or if part of the plan is clearly overkill.

## Step 2: Execute By Workstream

Execute by meaningful workstreams, not by tiny ceremonial steps.

Typical workstreams in `eggent`:

- layout/shell changes
- chat input behavior
- helper extraction
- API route work
- integration wiring
- UI polish and overflow cleanup

For each workstream:

1. confirm the files involved
2. implement the smallest coherent slice
3. run the most relevant verification
4. continue unless blocked

## Step 3: Verify Pragmatically

Use targeted verification based on the type of change.

### Prefer Automated Checks For

- helper functions
- parsing and validation logic
- API routes
- logic with branching
- type safety

Typical checks:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Run more focused tests only when they already exist or are cheap to add.

### Prefer Manual QA For

- layout
- mobile behavior
- PWA behavior
- scrolling
- keyboard behavior
- media recording
- drawer/sheet/modal interactions

When UI/mobile work is involved, explicitly report what you verified locally and what still needs device testing.

## Step 4: Keep Momentum

Keep going until one of these happens:

- the task is complete
- you hit a real blocker
- the plan needs a material redesign
- the user asked to pause

Do not stop just to ask for permission to continue normal implementation.

## When To Stop And Ask

Stop and ask only when:

- the plan conflicts with the current code in an important way
- a dependency or environment constraint blocks execution
- browser/device behavior cannot be validated without the user
- the change would require a risky product decision not covered by the plan

If blocked, explain:

1. what you tried
2. what is blocked
3. the smallest decision needed from the user

## How To Report Progress

Keep updates short and practical.

Good progress updates:

- what workstream you are on
- what changed
- what verification you ran
- what remains

## Completion

A task is usually complete when:

1. the requested behavior is implemented
2. relevant checks pass for the touched area
3. cheap high-value tests are added where appropriate
4. manual QA is done for UI/mobile/browser-sensitive work as far as possible in-session
5. remaining external checks are clearly listed

## Eggent-Specific Defaults

- Preserve the current dashboard + drawer structure unless the plan explicitly changes navigation.
- For chat work, inspect `src/app/dashboard/page.tsx`, `src/components/chat/*`, `src/app/api/chat/route.ts`, and `src/lib/agent/*` first.
- Prefer using `.meta/skills/eggent-plans/SKILL.md` plans as guidance, not as rigid scripts.
- For mobile/PWA tasks, value real UX behavior over test completeness.
- Avoid introducing heavy testing infrastructure just to satisfy process.
- Prefer finishing with a working result plus a clear note on any remaining real-device QA.

## When To Use

Use this skill when:

- there is an approved plan for `eggent`
- the user wants implementation, not more planning
- the work is best done pragmatically in one session
