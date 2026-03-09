# Claude-Like Chat Readability Implementation Plan

**Goal:** Make the Eggent chat screen feel much closer to Claude by improving readability, reducing UI chrome, and treating assistant responses as a reading-first surface on both desktop and mobile.

**Approach:** Keep the existing chat data flow and message model, but restyle the chat shell, message presentation, markdown typography, and composer with minimal structural refactors in the existing chat components.

**Constraints:** Preserve current chat behavior, streaming, tool outputs, sidebar navigation, and mobile input fixes; avoid new dependencies or broad dashboard refactors.

---

### Task 1: Reshape the Chat Shell Into a Reading-First Layout

**Why:**
The current screen still reads like a dashboard panel. The Claude-like target needs a calmer shell, a lighter header, and a tighter central reading column.

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/chat/chat-panel.tsx`
- Modify: `src/app/globals.css`

**Implementation:**
- Reduce dashboard-like chrome around the chat route and make the chat area feel like a dedicated conversation surface.
- Lightly restyle the existing header so it feels quieter and less boxed-in.
- Introduce a warmer/dimmer chat backdrop and more intentional vertical spacing around the message list and composer.
- Keep the sidebar/drawer structure intact.

**Validation:**
- Automated: none.
- Manual:
  - Check desktop chat route still fills the viewport without double scrollbars.
  - Check mobile safe-area behavior still works with the updated shell.
  - Check sidebar toggle and layout still behave correctly.

**Commit:**
- `git commit -m "feat: reshape chat shell for reading layout"`

### Task 2: Rework Message Presentation Toward Claude-Like Reading Blocks

**Why:**
The main readability issue comes from the message structure: persistent avatars, tight type, and weak separation between user bubble, assistant text, and secondary UI.

**Files:**
- Modify: `src/components/chat/chat-messages.tsx`
- Modify: `src/components/chat/message-bubble.tsx`

**Implementation:**
- Remove avatars from the main message flow.
- Convert user messages into compact rounded bubbles with constrained width.
- Convert assistant messages into mostly unframed reading blocks with stronger vertical rhythm.
- Increase message spacing so long answers feel like composed content instead of dense chat rows.

**Validation:**
- Automated: none.
- Manual:
  - Check short user prompts and long assistant answers both look balanced.
  - Check message alignment still works for empty/new chats and while streaming.
  - Check scroll anchoring still feels correct when new assistant tokens arrive.

**Commit:**
- `git commit -m "feat: redesign chat message layout"`

### Task 3: Upgrade Markdown Typography and Secondary UI

**Why:**
Claude-like readability depends on text treatment more than decoration. The markdown output, code, and tool blocks need a clear primary/secondary hierarchy.

**Files:**
- Modify: `src/components/chat/message-bubble.tsx`
- Modify: `src/components/chat/code-block.tsx`
- Modify: `src/components/chat/tool-output.tsx`

**Implementation:**
- Increase assistant text size and improve line-height, paragraph spacing, list spacing, and emphasis weight.
- Make inline code and code blocks feel integrated with the calmer reading palette.
- De-emphasize tool outputs so they remain useful without competing with the answer text.
- Preserve current rendering behavior and supported markdown features.

**Validation:**
- Automated: none.
- Manual:
  - Check paragraphs, ordered lists, unordered lists, bold text, inline code, and fenced code blocks.
  - Check tool outputs still render clearly and remain expandable.
  - Check long lines and overflow handling on mobile.

**Commit:**
- `git commit -m "feat: improve chat typography and secondary UI"`

### Task 4: Restyle the Composer to Match the New Conversation Surface

**Why:**
If the message area becomes calmer but the composer keeps the old panel styling, the screen will feel visually split.

**Files:**
- Modify: `src/components/chat/chat-input.tsx`

**Implementation:**
- Simplify the composer chrome so it feels like one coherent surface.
- Quiet secondary actions and keep the primary send action readable but not dominant.
- Preserve upload, dictation, disabled, and loading states.
- Keep the existing mobile font-size fix in place.

**Validation:**
- Automated: none.
- Manual:
  - Check focus, keyboard, send, stop, upload, and dictation states.
  - Check iPhone Safari input focus still avoids unwanted zoom.
  - Check Android Chrome and desktop layouts remain consistent with the new visual language.

**Commit:**
- `git commit -m "feat: align chat composer with reading layout"`

### Task 5: Final Polish and Practical QA

**Why:**
This work is mostly presentation and browser behavior. The final pass should catch spacing, contrast, and overflow mismatches across devices.

**Files:**
- Modify: `src/components/chat/chat-panel.tsx`
- Modify: `src/components/chat/chat-messages.tsx`
- Modify: `src/components/chat/message-bubble.tsx`
- Modify: `src/components/chat/chat-input.tsx`
- Modify: `src/components/chat/tool-output.tsx`
- Modify: `src/components/chat/code-block.tsx`
- Modify: `src/app/globals.css`

**Implementation:**
- Tune spacing and contrast after the major layout changes land.
- Fix any regressions in empty states, streaming state, and viewport usage.
- Keep the diff tight; avoid opportunistic cleanup outside the chat redesign.

**Validation:**
- Minimal automated tests:
  - None required unless a small helper is extracted during implementation.
- Manual QA checklist:
  - Desktop browser: long conversation, markdown-heavy answer, code block, tool output, streaming response.
  - Android Chrome: scroll behavior, composer spacing, long-line overflow.
  - iPhone Safari: safe area, keyboard open/close, input focus, sticky composer.
  - iPhone PWA: same checks as Safari, plus viewport stability after repeated message sends.

**Commit:**
- `git commit -m "feat: polish Claude-like chat readability"`

Plan complete and saved to docs/plans/2026-03-09-claude-like-chat-redesign.md.
