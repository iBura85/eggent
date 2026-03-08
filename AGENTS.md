# AGENTS.md

Operational instructions for coding agents in `eggent`.

Use this file for repo-specific behavior. Use `README.md` for setup and product overview.

## Core Rules

- Be pragmatic. This is a personal project, not an enterprise process repo.
- Prefer small, readable patches over broad refactors.
- Preserve existing behavior unless the task explicitly changes it.
- Reuse existing patterns before introducing new abstractions.
- Do not add heavy infrastructure just to support a small feature.
- Before changing behavior, check `docs/plans/*` for an existing design or plan.

## Prefer / Avoid

Prefer:

- minimal diffs
- helper extraction when logic is getting messy
- targeted tests for cheap, high-value logic
- manual QA for UI, mobile, PWA, scroll, keyboard, and browser API work

Avoid:

- speculative abstractions
- dependency churn
- broad cleanup refactors hidden inside feature work
- strict TDD unless the user explicitly asks for it
- test overengineering for layout polish

## Start Here

For most product work, inspect these areas first:

- `src/app/dashboard/*`
- `src/components/chat/*`
- `src/app/api/*`
- `src/lib/agent/*`
- `src/lib/tools/*`
- `src/lib/storage/*`
- `src/app/globals.css`

For chat work, inspect these files before editing:

- `src/app/dashboard/page.tsx`
- `src/components/chat/chat-panel.tsx`
- `src/components/chat/chat-input.tsx`
- `src/components/chat/chat-messages.tsx`
- `src/components/chat/message-bubble.tsx`
- `src/components/chat/tool-output.tsx`
- `src/components/chat/code-block.tsx`
- `src/app/api/chat/route.ts`
- `src/lib/agent/agent.ts`
- `src/lib/agent/prompts.ts`

Detailed chat lifecycle:

- `docs/request-flow.md`

## Planning

- For implementation plans in this repo, prefer `.meta/skills/eggent-plans/SKILL.md`.
- Keep plans short and executable.
- Default to targeted tests plus manual QA, not full TDD choreography.

## Commands

Prefer `pnpm` for local dev commands.

```bash
pnpm dev
pnpm build
pnpm lint
pnpm exec tsc --noEmit
curl http://localhost:3000/api/health
```

If you need new test tooling, keep it minimal and justify it with the feature scope.

## Validation

Add automated tests for:

- pure helpers
- parsing/validation logic
- API routes with branching
- state logic that is cheap to lock down

Use manual QA for:

- layout
- responsive behavior
- mobile behavior
- PWA behavior
- scrolling
- keyboard behavior
- media recording/transcription UI
- drawer/sheet/overlay interactions

For chat/mobile changes, manual QA should usually include:

- desktop browser
- Android Chrome
- iPhone Safari
- iPhone PWA

## Boundaries

- Do not edit `.env`, deployment secrets, or runtime credentials unless explicitly asked.
- Do not delete, reset, or bulk-modify `data/` unless explicitly asked.
- Do not touch `.next/` or cache directories.
- Do not rewrite `docs/releases/*` unless the task is release-related.
- Ask or justify clearly before adding production dependencies.

## Repo Conventions

- Keep changes ASCII unless the file already uses Unicode.
- Match the existing style and component patterns.
- Keep comments sparse and useful.
- Use exact file paths when documenting work.
- Preserve the dashboard + sidebar/drawer structure unless the task explicitly changes navigation.

## Done Means

A task is usually done when:

1. The requested behavior is implemented.
2. Relevant lint/type checks pass for the touched area.
3. Cheap high-value tests are added where appropriate.
4. Manual QA is done for UI/mobile/browser-sensitive changes.
5. Related docs/plans are updated if behavior materially changed.

## Skills

Project-local skills live under:

- `.meta/skills/<skill-name>/SKILL.md`

Current planning skill for this repo:

- `.meta/skills/eggent-plans/SKILL.md`

If a task clearly matches a local skill, use it.

## Growth Rule

If one subtree becomes significantly more complex, add a nested `AGENTS.md` there instead of bloating this root file.
