# Fullscreen Chat And Voice Dictation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Eggent chat into a fullscreen shell with a bottom-anchored composer, mobile-safe scrolling, iPhone-friendly voice dictation to text, and no whole-page horizontal overflow.

**Architecture:** Keep the existing `SiteHeader` + `SidebarProvider` navigation model, but move chat into a viewport-bound shell where only the messages pane scrolls. Add a small set of testable helpers for keyboard/textarea behavior, add a dedicated `/api/chat/transcribe` route that reuses the existing speech-to-text service, and isolate browser recording logic in a `useVoiceDictation` hook so UI and recording state stay testable.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Zustand, AI SDK `useChat`, Vitest, React Testing Library, jsdom.

---

## Before You Start

- Read the approved design first: `docs/plans/2026-03-08-chat-fullscreen-mobile-design.md`
- Work on a fresh branch or worktree
- Follow TDD for every behavior change
- Keep commits small and scoped to the task you just completed
- Use `pnpm`, not `npm`

### Task 1: Add A Minimal Test Harness For Chat Work

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Test: `src/components/chat/chat-input.behavior.test.tsx`

**Step 1: Write the failing smoke test**

Create `src/components/chat/chat-input.behavior.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "@/components/chat/chat-input";

describe("ChatInput", () => {
  it("renders the send placeholder", () => {
    render(
      <ChatInput
        input=""
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        chatId="chat-1"
      />
    );

    expect(screen.getByPlaceholderText("Send a message...")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chat/chat-input.behavior.test.tsx`

Expected: FAIL because `vitest` and the testing environment are not configured yet.

**Step 3: Write minimal implementation**

Modify `package.json` to add the test scripts and dev dependencies:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.7.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Install the dependencies:

Run: `pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chat/chat-input.behavior.test.tsx`

Expected: PASS with `1 passed`.

Then run: `pnpm exec tsc --noEmit`

Expected: PASS with no TypeScript errors.

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test/setup.ts src/components/chat/chat-input.behavior.test.tsx
git commit -m "test: add vitest harness for chat ui"
```

### Task 2: Introduce The Fullscreen Chat Shell

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/chat/chat-panel.tsx`
- Modify: `src/components/chat/chat-messages.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/chat/chat-shell.layout.test.tsx`

**Step 1: Write the failing test**

Create `src/components/chat/chat-shell.layout.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessages } from "@/components/chat/chat-messages";

describe("chat shell layout", () => {
  it("renders the message list as the only scrollable pane", () => {
    render(<ChatMessages messages={[]} isLoading={false} />);

    const pane = screen.getByTestId("chat-messages-pane");
    expect(pane.className).toContain("overflow-y-auto");
    expect(pane.className).toContain("min-h-0");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chat/chat-shell.layout.test.tsx`

Expected: FAIL because `ChatMessages` does not expose a stable test target and does not yet enforce the final shell constraints.

**Step 3: Write minimal implementation**

Update `src/app/dashboard/page.tsx` so the chat route is explicitly viewport-bound below the header:

```tsx
<SidebarInset className="overflow-hidden">
  <div className="flex h-[calc(100dvh-var(--header-height))] min-h-0 flex-1 flex-col overflow-hidden">
    <ChatPanel />
  </div>
</SidebarInset>
```

Update `src/components/chat/chat-panel.tsx` so it becomes the fullscreen shell:

```tsx
return (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <ChatMessages messages={messages} isLoading={isLoading} />
    <ChatInput
      input={input}
      setInput={setInput}
      onSubmit={onSubmit}
      onStop={stop}
      isLoading={isLoading}
      chatId={activeChatId || internalChatId}
    />
  </div>
);
```

Update `src/components/chat/chat-messages.tsx` to mark the pane and keep it as the only scroll region:

```tsx
return (
  <div
    data-testid="chat-messages-pane"
    className="flex min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6"
  >
    <div className="mx-auto flex min-w-0 w-full max-w-3xl flex-col py-4">
      ...
    </div>
  </div>
);
```

Add chat-route-safe overflow rules in `src/app/globals.css`:

```css
@layer base {
  html,
  body {
    min-height: 100%;
  }
}
```

Do not add global `overflow: hidden` to every route. Keep the overflow constraint local to the chat route shell.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chat/chat-shell.layout.test.tsx`

Expected: PASS.

Then run: `pnpm exec tsc --noEmit`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/chat/chat-panel.tsx src/components/chat/chat-messages.tsx src/app/globals.css src/components/chat/chat-shell.layout.test.tsx
git commit -m "refactor: introduce fullscreen chat shell"
```

### Task 3: Lock Down Composer Keyboard Rules And Transcript Merging

**Files:**
- Create: `src/components/chat/chat-input.helpers.ts`
- Modify: `src/components/chat/chat-input.tsx`
- Test: `src/components/chat/chat-input.helpers.test.ts`

**Step 1: Write the failing test**

Create `src/components/chat/chat-input.helpers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  mergeTranscriptIntoInput,
  shouldSubmitOnEnter,
} from "@/components/chat/chat-input.helpers";

describe("shouldSubmitOnEnter", () => {
  it("submits on desktop enter without shift", () => {
    expect(
      shouldSubmitOnEnter({
        isMobile: false,
        key: "Enter",
        shiftKey: false,
        isComposing: false,
      })
    ).toBe(true);
  });

  it("does not submit on mobile enter", () => {
    expect(
      shouldSubmitOnEnter({
        isMobile: true,
        key: "Enter",
        shiftKey: false,
        isComposing: false,
      })
    ).toBe(false);
  });
});

describe("mergeTranscriptIntoInput", () => {
  it("appends transcript to existing text with a separating newline", () => {
    expect(mergeTranscriptIntoInput("hello", "world")).toBe("hello\nworld");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chat/chat-input.helpers.test.ts`

Expected: FAIL because the helper file does not exist yet.

**Step 3: Write minimal implementation**

Create `src/components/chat/chat-input.helpers.ts`:

```ts
export function shouldSubmitOnEnter(input: {
  isMobile: boolean;
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
}): boolean {
  if (input.key !== "Enter") return false;
  if (input.isComposing) return false;
  if (input.isMobile) return false;
  return !input.shiftKey;
}

export function mergeTranscriptIntoInput(current: string, transcript: string): string {
  const next = transcript.trim();
  if (!next) return current;
  if (!current.trim()) return next;
  return `${current.replace(/\s+$/, "")}\n${next}`;
}
```

Update `src/components/chat/chat-input.tsx` to use the helper instead of inline `Enter` logic:

```tsx
if (shouldSubmitOnEnter({
  isMobile,
  key: e.key,
  shiftKey: e.shiftKey,
  isComposing: e.nativeEvent.isComposing,
}) && !isLoading && input.trim()) {
  e.preventDefault();
  onSubmit();
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chat/chat-input.helpers.test.ts`

Expected: PASS.

Then run: `pnpm exec vitest run src/components/chat/chat-input.behavior.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/chat/chat-input.helpers.ts src/components/chat/chat-input.tsx src/components/chat/chat-input.helpers.test.ts src/components/chat/chat-input.behavior.test.tsx
git commit -m "feat: add mobile-safe composer keyboard rules"
```

### Task 4: Add The Chat Transcription Route

**Files:**
- Create: `src/app/api/chat/transcribe/route.ts`
- Test: `src/app/api/chat/transcribe/route.test.ts`
- Reference: `src/lib/speech-to-text/service.ts`
- Reference: `src/lib/storage/settings-store.ts`

**Step 1: Write the failing test**

Create `src/app/api/chat/transcribe/route.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/storage/settings-store", () => ({
  getSettings: vi.fn(),
}));

vi.mock("@/lib/speech-to-text/service", () => ({
  transcribeAudioFile: vi.fn(),
}));

import { POST } from "@/app/api/chat/transcribe/route";
import { getSettings } from "@/lib/storage/settings-store";
import { transcribeAudioFile } from "@/lib/speech-to-text/service";

describe("POST /api/chat/transcribe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns transcript text", async () => {
    vi.mocked(getSettings).mockResolvedValue({
      speechToText: { enabled: true, provider: "deepgram", model: "nova-3", language: "" },
    } as never);
    vi.mocked(transcribeAudioFile).mockResolvedValue({
      text: "hello from audio",
      provider: "deepgram",
    });

    const formData = new FormData();
    formData.append("file", new File(["audio"], "clip.webm", { type: "audio/webm" }));

    const req = new NextRequest("http://localhost/api/chat/transcribe", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/app/api/chat/transcribe/route.test.ts`

Expected: FAIL because the route does not exist yet.

**Step 3: Write minimal implementation**

Create `src/app/api/chat/transcribe/route.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { transcribeAudioFile } from "@/lib/speech-to-text/service";
import { SpeechToTextError } from "@/lib/speech-to-text/types";
import { getSettings } from "@/lib/storage/settings-store";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  const settings = await getSettings();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "eggent-stt-"));
  const filePath = path.join(tempDir, file.name || "recording.webm");

  try {
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    const transcript = await transcribeAudioFile(
      { filePath, fileName: file.name, mimeType: file.type },
      settings.speechToText
    );
    return Response.json({ text: transcript.text, provider: transcript.provider });
  } catch (error) {
    if (error instanceof SpeechToTextError) {
      return Response.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return Response.json({ error: "Failed to transcribe audio" }, { status: 500 });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
```

Expand the test file with two more cases:

- missing file returns `400`
- provider/configuration failure returns `400` with the `SpeechToTextError.code`

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/app/api/chat/transcribe/route.test.ts`

Expected: PASS.

Then run: `pnpm exec tsc --noEmit`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/chat/transcribe/route.ts src/app/api/chat/transcribe/route.test.ts
git commit -m "feat: add chat audio transcription route"
```

### Task 5: Add A Testable Voice Dictation Hook And Wire It Into The Composer

**Files:**
- Create: `src/components/chat/use-voice-dictation.ts`
- Modify: `src/components/chat/chat-input.tsx`
- Test: `src/components/chat/use-voice-dictation.test.tsx`

**Step 1: Write the failing test**

Create `src/components/chat/use-voice-dictation.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVoiceDictation } from "@/components/chat/use-voice-dictation";

describe("useVoiceDictation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("appends transcript text after a successful transcription", async () => {
    const onTranscript = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "dictated text" }),
    }) as typeof fetch;

    const { result } = renderHook(() =>
      useVoiceDictation({ onTranscript, onError: vi.fn() })
    );

    await act(async () => {
      await result.current.handleTranscriptResult(new Blob(["a"], { type: "audio/webm" }));
    });

    expect(onTranscript).toHaveBeenCalledWith("dictated text");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chat/use-voice-dictation.test.tsx`

Expected: FAIL because the hook does not exist yet.

**Step 3: Write minimal implementation**

Create `src/components/chat/use-voice-dictation.ts`:

```ts
import { useCallback, useRef, useState } from "react";

interface UseVoiceDictationInput {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}

export function useVoiceDictation({ onTranscript, onError }: UseVoiceDictationInput) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const streamRef = useRef<MediaStream | null>(null);

  const handleTranscriptResult = useCallback(async (blob: Blob) => {
    setState("transcribing");
    const formData = new FormData();
    formData.append("file", new File([blob], "voice.webm", { type: blob.type || "audio/webm" }));

    const response = await fetch("/api/chat/transcribe", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as { text?: string; error?: string };
    if (!response.ok || !payload.text) {
      onError(payload.error || "Failed to transcribe audio");
      setState("idle");
      return;
    }

    onTranscript(payload.text);
    setState("idle");
  }, [onError, onTranscript]);

  return {
    state,
    handleTranscriptResult,
    streamRef,
  };
}
```

Then update `src/components/chat/chat-input.tsx`:

- import `useIsMobile`
- import `mergeTranscriptIntoInput`
- import `useVoiceDictation`
- place the `Mic` button immediately left of `Send`
- use `mergeTranscriptIntoInput(input, transcript)` when dictation succeeds
- render inline states such as `Recording...` and `Transcribing...`

Use this shape for transcript insertion:

```tsx
const voice = useVoiceDictation({
  onTranscript: (transcript) => {
    setInput(mergeTranscriptIntoInput(inputRef.current, transcript));
  },
  onError: setVoiceError,
});
```

Keep the initial implementation intentionally small: a tap-to-start / tap-to-stop flow is enough for the first pass.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chat/use-voice-dictation.test.tsx src/components/chat/chat-input.helpers.test.ts src/components/chat/chat-input.behavior.test.tsx`

Expected: PASS.

Then run: `pnpm exec tsc --noEmit`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/chat/use-voice-dictation.ts src/components/chat/chat-input.tsx src/components/chat/use-voice-dictation.test.tsx src/components/chat/chat-input.helpers.ts src/components/chat/chat-input.helpers.test.ts
git commit -m "feat: add browser voice dictation to chat composer"
```

### Task 6: Finish The Browser Recording Flow For iPhone-Friendly UX

**Files:**
- Modify: `src/components/chat/use-voice-dictation.ts`
- Modify: `src/components/chat/chat-input.tsx`
- Test: `src/components/chat/use-voice-dictation.recording.test.tsx`

**Step 1: Write the failing test**

Create `src/components/chat/use-voice-dictation.recording.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVoiceDictation } from "@/components/chat/use-voice-dictation";

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: MediaStream) {
    FakeMediaRecorder.instances.push(this);
  }
  start() {}
  stop() {
    this.ondataavailable?.({ data: new Blob(["voice"], { type: "audio/webm" }) } as BlobEvent);
    this.onstop?.();
  }
}

describe("voice recording flow", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder as unknown as typeof MediaRecorder);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  it("moves from idle to recording to transcribing", async () => {
    const { result } = renderHook(() =>
      useVoiceDictation({ onTranscript: vi.fn(), onError: vi.fn() })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe("recording");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chat/use-voice-dictation.recording.test.tsx`

Expected: FAIL because `startRecording` and `stopRecording` are not implemented yet.

**Step 3: Write minimal implementation**

Extend `src/components/chat/use-voice-dictation.ts`:

```ts
const recorderRef = useRef<MediaRecorder | null>(null);
const chunksRef = useRef<Blob[]>([]);

const startRecording = useCallback(async () => {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    onError("Voice dictation is not supported in this browser");
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  streamRef.current = stream;
  chunksRef.current = [];

  const recorder = new MediaRecorder(stream);
  recorderRef.current = recorder;
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunksRef.current.push(event.data);
  };
  recorder.onstop = async () => {
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    await handleTranscriptResult(blob);
    stream.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };
  recorder.start();
  setState("recording");
}, [handleTranscriptResult, onError]);

const stopRecording = useCallback(() => {
  recorderRef.current?.stop();
}, []);
```

Update `src/components/chat/chat-input.tsx` so the mic button:

- starts recording when idle
- stops recording when active
- disables itself during `transcribing`
- shows inline error text and state text near the composer footer

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chat/use-voice-dictation.recording.test.tsx src/components/chat/use-voice-dictation.test.tsx`

Expected: PASS.

Then run: `pnpm exec tsc --noEmit`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/chat/use-voice-dictation.ts src/components/chat/chat-input.tsx src/components/chat/use-voice-dictation.recording.test.tsx
git commit -m "feat: finish chat recording flow for mobile dictation"
```

### Task 7: Harden Overflow, Message Rendering, And Safe-Area Layout

**Files:**
- Modify: `src/components/chat/chat-input.tsx`
- Modify: `src/components/chat/chat-messages.tsx`
- Modify: `src/components/chat/message-bubble.tsx`
- Modify: `src/components/chat/tool-output.tsx`
- Modify: `src/components/chat/code-block.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/chat/chat-overflow.test.tsx`

**Step 1: Write the failing test**

Create `src/components/chat/chat-overflow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "@/components/chat/code-block";
import { ToolOutput } from "@/components/chat/tool-output";

describe("chat overflow safety", () => {
  it("keeps code blocks inside a bounded overflow container", () => {
    render(<CodeBlock code={"x".repeat(500)} language="tsx" />);
    expect(screen.getByText("code").closest("div")?.className).toContain("overflow-hidden");
  });

  it("keeps tool output horizontally scrollable locally", () => {
    render(<ToolOutput toolName="search_web" args={{}} result={"y".repeat(500)} />);
    expect(screen.getByText("Output:").parentElement?.innerHTML).toContain("overflow-x-auto");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chat/chat-overflow.test.tsx`

Expected: FAIL because the layout is not yet consistently hardened with `min-w-0`, safe-area padding, and local overflow boundaries.

**Step 3: Write minimal implementation**

Update `src/components/chat/chat-input.tsx`:

```tsx
<div className="border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
  <div className="mx-auto flex min-w-0 max-w-3xl flex-col">
    ...
  </div>
</div>
```

Update `src/components/chat/message-bubble.tsx`:

```tsx
<div className="space-y-1 min-w-0">
  ...
  <div className="flex-1 min-w-0 text-sm leading-7 pt-0.5">
```

Update `src/components/chat/tool-output.tsx`:

```tsx
<div className="my-2 min-w-0 overflow-hidden rounded-lg border bg-card">
```

Update `src/components/chat/code-block.tsx`:

```tsx
<div className="group relative my-2 min-w-0 overflow-hidden rounded-lg border bg-muted/50">
```

If needed, add a narrow chat-only helper rule in `src/app/globals.css` for safe viewport behavior:

```css
@supports (padding: env(safe-area-inset-bottom)) {
  .supports-safe-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

Use local classes if that is cleaner than a global helper.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chat/chat-overflow.test.tsx src/components/chat/chat-shell.layout.test.tsx`

Expected: PASS.

Then run: `pnpm exec tsc --noEmit && pnpm lint`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/chat/chat-input.tsx src/components/chat/chat-messages.tsx src/components/chat/message-bubble.tsx src/components/chat/tool-output.tsx src/components/chat/code-block.tsx src/app/globals.css src/components/chat/chat-overflow.test.tsx
git commit -m "fix: harden chat layout against mobile overflow"
```

### Task 8: Manual Cross-Device Verification

**Files:**
- No code changes required unless a bug is found
- Reference: `docs/plans/2026-03-08-chat-fullscreen-mobile-design.md`

**Step 1: Start the app locally**

Run: `pnpm dev`

Expected: local Next.js server starts successfully.

**Step 2: Verify desktop behavior**

Use `@playwright-cli` or a real browser.

Check:

- drawer still opens from the header
- composer stays pinned to the bottom
- desktop `Enter` sends
- desktop `Shift+Enter` inserts newline
- long code blocks do not widen the page

**Step 3: Verify mobile viewport behavior**

Use a real phone if possible. If not, use `@playwright-cli` with a narrow viewport as a smoke test.

Check:

- no outer page scroll on the chat route
- no whole-page horizontal scroll
- mobile `Enter` inserts newline only
- send works only from the button
- drawer overlays the chat shell correctly

**Step 4: Verify iPhone voice flow**

On iPhone Safari and iPhone PWA, check:

- mic permission prompt appears
- recording starts and stops from the same mic button
- transcript is inserted into the textarea
- transcript does not auto-send
- existing textarea text is preserved and transcript appends cleanly
- disabled or broken transcription shows an inline error, not a blank failure

If a bug appears, fix it immediately with a test before continuing.

**Step 5: Commit**

If no code changes were needed, do not create a commit.

If fixes were needed:

```bash
git add <fixed-files>
git commit -m "fix: polish chat fullscreen and dictation qa issues"
```
