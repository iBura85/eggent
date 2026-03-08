---
name: eggent-plans
description: "Use for implementation plans in eggent. Optimized for personal-project work: pragmatic scope, minimal necessary tests, and strong manual QA for UI, mobile, PWA, scrolling, and browser behavior."
---

# Eggent Plans

Create practical implementation plans for `eggent`.

This skill is specifically for this project and should reflect how work in `eggent` actually happens:

- mostly one developer
- fast iteration matters
- many tasks are chat, UI, mobile, PWA, scrolling, browser, and integration work
- strict production ceremony is usually overhead

**Announce at start:** "I'm using the eggent-plans skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Default Planning Mode

Default to a pragmatic plan, not a production-heavy plan.

Assume:

- the implementer already knows the project reasonably well
- the goal is to ship a good change quickly
- tests should exist only where they buy real safety
- manual QA is normal and expected for UI/mobile/PWA work

Do not force strict TDD unless the user explicitly asks for it.

## Project Context

When writing a plan for `eggent`, check these areas first when relevant:

- `src/app/dashboard/*` for dashboard routes and shell layout
- `src/components/chat/*` for chat UI and interaction behavior
- `src/app/api/*` for API routes
- `src/lib/*` for helper logic, storage, agent behavior, and integrations
- `src/app/globals.css` for shared layout and viewport behavior
- `docs/plans/*` for the approved design or prior plan

If the task is chat-related, strongly prefer inspecting:

- `src/app/dashboard/page.tsx`
- `src/components/chat/chat-panel.tsx`
- `src/components/chat/chat-input.tsx`
- `src/components/chat/chat-messages.tsx`
- `src/components/chat/message-bubble.tsx`

## What The Plan Should Optimize For

Optimize for:

- small number of meaningful tasks
- exact file paths
- minimal necessary refactoring
- DRY and YAGNI
- good manual validation for UI and browser behavior
- commit slices that match useful milestones

Avoid:

- micro-steps that create process noise
- full code listings unless the code is unusually tricky
- creating new infrastructure unless the feature clearly needs it
- test bureaucracy for layout polish work

## Plan Header

Every plan should start with:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing the outcome]

**Approach:** [Short explanation of implementation strategy]

**Constraints:** [Important product or technical constraints]

---
```

## Recommended Structure

For most `eggent` tasks, use this structure:

```markdown
### Task N: [Workstream Name]

**Why:**
[Why this workstream exists]

**Files:**
- Modify: `exact/path.tsx`
- Create: `exact/new-file.ts`

**Implementation:**
- Concrete change 1
- Concrete change 2
- Edge case or constraint

**Validation:**
- Automated: [only if genuinely useful]
- Manual:
  - Check 1
  - Check 2

**Commit:**
- `git commit -m "feat: useful milestone"`
```

Use 3-7 tasks for most features. Tasks should be meaningful chunks, not 2-minute actions.

## Testing Rules

Use targeted tests, not blanket TDD.

### Add Automated Tests For

- pure helper functions
- parsing and validation logic
- API routes with real branching and error handling
- state transitions that are easy to regress
- logic that is cheap to test and expensive to break

### Prefer Manual QA For

- layout changes
- responsive/mobile behavior
- scroll behavior
- keyboard behavior on real devices
- PWA behavior
- browser media APIs
- safe-area and viewport issues
- drawer, sheet, modal, and overlay interactions

### Special Rule For Chat/UI Work

If the task is mainly about chat UX, layout, mobile, or PWA:

- do not require setting up large UI test coverage first
- suggest 1-3 targeted tests only if there is a clean helper or API seam
- make manual QA the primary validation method

Examples:

- `Enter vs Shift+Enter` logic: test
- transcript text merge helper: test
- `/api/chat/transcribe` error handling: test
- sticky composer, iPhone keyboard, drawer overlay, overflow behavior: manual QA

## Validation Section

Every plan should include both:

- `Minimal automated tests`
- `Manual QA checklist`

Even if the automated test list is short.

For mobile/browser work, the manual QA checklist should explicitly mention likely environments when relevant:

- desktop browser
- Android Chrome
- iPhone Safari
- iPhone PWA

## Commit Guidance

Do not require a commit after every tiny step.

Prefer commits after real milestones, for example:

- shell/layout foundation
- input behavior changes
- API route added
- voice flow integrated
- final polish/fixes

## Tone And Detail

Write for a developer who already has project context.

Be concrete, but keep the plan lean:

- exact file paths
- realistic implementation order
- important risks
- practical validation

Do not write the plan like a handoff to an unfamiliar enterprise team.

## Good Eggent Defaults

For typical `eggent` features:

- check whether existing code already has partial support before proposing new abstractions
- preserve current navigation and dashboard structure unless the design explicitly changes it
- prefer isolated helper extraction over broad architecture cleanup
- call out when a change touches browser APIs or real-device behavior
- if tests would require large new infrastructure, prefer manual QA unless the logic is critical

## Finish

End with:

`Plan complete and saved to docs/plans/<filename>.md.`

Then offer the next step plainly:

- implement now in this session
- or keep the plan for later

## When To Use

Use this skill when:

- the task is in `eggent`
- the user wants a practical implementation plan
- the change is for a personal project or prototype workflow
- strict TDD would be unnecessary overhead
