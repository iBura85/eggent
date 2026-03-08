# Fullscreen Chat And Mobile Voice Input Implementation Plan

## Note

The `writing-plans` skill referenced by the brainstorming workflow is not available in this workspace. This implementation plan is the fallback artifact for the approved design.

## Scope

Implement the approved fullscreen chat shell, bottom-anchored composer, mobile newline behavior, and browser voice dictation without changing the current drawer/sidebar navigation model.

## Workstreams

### 1. Fullscreen Chat Layout

Update the chat route and chat container so the chat experience is rendered as a viewport-bound shell with a single internal scroll region.

Likely files:

- `src/app/dashboard/page.tsx`
- `src/components/chat/chat-panel.tsx`
- `src/components/chat/chat-messages.tsx`
- `src/components/site-header.tsx`
- `src/app/globals.css`

Tasks:

- Make the chat page height explicitly viewport-bound below the header
- Prevent route-level scrolling while in chat
- Ensure the chat shell uses `overflow-hidden`
- Ensure only the messages pane scrolls vertically
- Add safe-area handling for bottom padding

### 2. Composer Refinement

Rework the composer into a bottom-anchored panel with the final control order:

- attachment
- textarea
- microphone
- send/stop

Likely files:

- `src/components/chat/chat-input.tsx`

Tasks:

- Move the microphone button immediately left of Send
- Keep the textarea auto-grow behavior within a bounded height
- Preserve file upload behavior
- Ensure the composer remains visible while the textarea grows

### 3. Mobile Keyboard Behavior

Adjust submit behavior so mobile uses newline-on-enter and button-only send.

Likely files:

- `src/components/chat/chat-input.tsx`
- `src/hooks/use-mobile.ts`

Tasks:

- Detect mobile interaction mode using existing breakpoint logic
- Change key handling so mobile `Enter` inserts newline
- Keep desktop `Enter` send and `Shift+Enter` newline behavior
- Verify IME and multiline behavior is not regressed

### 4. Voice Dictation Endpoint

Add an API route that accepts recorded audio and returns transcript text using the existing speech-to-text service.

Likely files:

- `src/app/api/chat/transcribe/route.ts` or similar
- `src/lib/speech-to-text/service.ts`
- `src/lib/storage/settings-store.ts` if configuration access is needed

Tasks:

- Accept multipart audio upload
- Validate the payload and settings
- Persist the upload temporarily if required by the transcription provider
- Invoke the speech-to-text service
- Return transcript text in a simple JSON response
- Map configuration or provider failures into clean client-facing errors

### 5. Voice Recording UI

Add browser-side recording to the composer and merge the resulting transcript into the textarea.

Likely files:

- `src/components/chat/chat-input.tsx`

Tasks:

- Add microphone idle, recording, uploading, and transcribing states
- Use browser recording APIs behind a user gesture
- Stop and clean up media streams correctly
- Upload the recording to the transcription endpoint
- Append transcript text into the existing input value
- Show inline feedback for permission or transcription failures

### 6. Overflow Hardening

Prevent the entire page from growing wider than the viewport on mobile.

Likely files:

- `src/components/chat/chat-panel.tsx`
- `src/components/chat/chat-messages.tsx`
- `src/components/chat/message-bubble.tsx`
- `src/components/chat/tool-output.tsx`
- `src/components/chat/code-block.tsx`
- `src/app/globals.css`

Tasks:

- Add `min-w-0` to relevant flex containers
- Add shell-level `overflow-x-hidden`
- Keep local horizontal scroll only in code and tool output containers
- Verify long filenames and long message content do not stretch the viewport

## Suggested Order

1. Fullscreen shell and scroll architecture
2. Composer restructuring
3. Mobile enter/newline behavior
4. Voice transcription API
5. Voice recording UI
6. Overflow hardening
7. Cross-device verification

## Validation Plan

### Functional Checks

- Chat screen has no outer page scroll
- Composer stays pinned to the bottom
- Drawer still opens from the header on mobile
- Desktop send behavior remains familiar
- Mobile send works only via button
- Voice dictation inserts transcript into the textarea without auto-send

### Regression Checks

- File uploads still work
- Streaming/stop button still works
- Existing chat history loading still works
- Long code and tool output remain readable

### Device Checks

- Desktop Chrome
- Android Chrome
- iPhone Safari
- iPhone PWA

## Risks

- iPhone keyboard and viewport resizing can still be tricky even with `dvh` and safe-area handling
- Audio MIME support may vary by browser, so the server endpoint should accept a practical range of audio formats
- Autoscroll logic may need refinement once streaming and mobile keyboard resizing interact

## Definition Of Done

- Chat uses a fullscreen shell on all devices
- Composer is anchored at the bottom with safe-area support
- Mobile no longer shows awkward page scroll or whole-page horizontal scroll
- Mobile `Enter` inserts a newline instead of sending
- Voice dictation works on iPhone and inserts transcript text into the input
- Existing drawer/chat navigation still works as before
