# Fullscreen Chat And Mobile Voice Input Design

## Summary

Eggent chat should move to a fullscreen shell that feels closer to Claude or ChatGPT on both desktop and mobile, with mobile usability treated as the primary constraint. The current chat experience has four pain points:

1. The message composer is not anchored firmly enough to the bottom.
2. The mobile layout can produce awkward page scrolling.
3. The mobile layout can produce horizontal overflow.
4. Voice input is missing for browser and PWA chat usage, especially on iPhone.

This design introduces a single fullscreen chat layout, a bottom-anchored composer, and voice dictation that transcribes audio into text before sending.

## Goals

- Use one fullscreen chat architecture on desktop, mobile browser, and PWA.
- Keep the message composer visible at the bottom of the screen.
- Allow voice dictation that inserts transcript text into the input field.
- Eliminate outer page scrolling on the chat screen.
- Eliminate whole-page horizontal overflow on mobile.
- Preserve the existing drawer and chat/project navigation behavior.

## Non-Goals

- Sending raw audio messages as chat history items.
- Redesigning the sidebar or drawer interaction model.
- Changing agent streaming behavior.
- Reworking desktop navigation beyond what is required by the fullscreen shell.

## User Experience Requirements

### Chat Shell

The chat route should render as a fullscreen shell inside the existing dashboard structure. The existing header and drawer trigger remain in place. Below the header, the page becomes a two-region layout:

- `messages-pane`: the only vertical scroll container
- `composer-pane`: permanently anchored at the bottom

The outer document and route container should not scroll while the user is in chat. Any content that needs scrolling must scroll inside the message pane or inside a local overflow region such as code blocks or tool output.

### Composer Layout

The composer should remain pinned to the bottom edge of the chat shell. Its control order should be:

1. Attachment button on the left
2. Growing textarea in the middle
3. Microphone button on the right side of the textarea cluster
4. Send button to the far right, with Stop replacing Send while streaming

The microphone button must sit immediately to the left of Send.

The composer should support safe-area padding on mobile and PWA so it stays visible above iPhone system UI.

### Text Entry

Desktop behavior:

- `Enter` sends the message
- `Shift+Enter` inserts a newline

Mobile behavior:

- `Enter` always inserts a newline
- Sending happens only when the user taps `Send`

The textarea can grow to a limited number of lines. When it grows, the messages pane shrinks accordingly rather than pushing the whole page taller.

### Voice Dictation

Voice input should behave as dictation rather than as a separate audio message:

1. User taps the microphone button to start recording
2. The composer shows a recording state with a visible indicator and timer
3. User taps again to stop
4. Audio is uploaded to a transcription API
5. The returned transcript is inserted into the textarea
6. The user can edit the text before tapping `Send`

If the textarea already contains text, the transcript should be appended cleanly instead of replacing existing input.

The transcript must never auto-send.

### Drawer And Navigation

The existing header and sidebar/drawer behavior must remain intact:

- The drawer trigger in the header continues to work
- On mobile, the drawer opens as an overlay above the fullscreen chat shell
- The chat shell must not block the drawer sheet or interfere with its layering

## Technical Design

### Layout Strategy

The fullscreen shell should be implemented inside the current dashboard chat page rather than as a completely separate route layout. This keeps header and navigation behavior consistent.

Layout constraints:

- The top-level chat page consumes viewport height below the header
- The chat shell uses `overflow-hidden`
- The messages pane uses `overflow-y-auto`
- The composer sits below the messages pane and never leaves the viewport

Use dynamic viewport-safe sizing where needed to support mobile browsers and PWA behavior. The design should account for iPhone Safari keyboard behavior and safe-area insets.

### Overflow Control

To remove horizontal scroll regressions:

- The chat shell should hide outer horizontal overflow
- Flex children in the shell should use `min-w-0`
- Message bubble wrappers should use `min-w-0`
- Code blocks and tool outputs keep local horizontal scroll instead of expanding the page width
- Long filenames, long tool output, and large code samples must stay inside bounded containers

### Voice Transcription Flow

The project already has server-side speech-to-text support. Browser chat should reuse that capability through a dedicated API endpoint for uploaded recordings.

High-level flow:

1. Browser records audio with user permission
2. Client uploads audio to a chat transcription endpoint
3. Server validates configuration and audio payload
4. Server uses the existing speech-to-text service
5. Server returns transcript text
6. Client merges transcript into the current textarea contents

This design avoids depending on browser-native speech recognition support, which is too inconsistent for iPhone and PWA use.

## Error Handling

The composer should keep working even when voice features fail.

Cases to handle:

- Microphone permission denied
- Recording unsupported by the current browser
- Speech-to-text disabled in settings
- Upload failure
- Transcription failure
- User cancellation during recording

Failure behavior:

- Show a short inline error near the composer
- Keep any existing textarea text intact
- Return the composer to a stable idle state

## Scroll Behavior

Autoscroll should remain user-friendly:

- When the user is already near the bottom, new messages should scroll into view
- When the user has scrolled upward to inspect history, new streaming content should not force-scroll the viewport
- Keyboard open/close on mobile should resize the visible message area without creating a second page scroll

## Testing

Required coverage:

- Desktop Chrome, Safari, Firefox
- Android Chrome in browser and PWA
- iPhone Safari and iPhone PWA

Scenarios:

- Composer remains bottom-anchored
- Drawer opens correctly over chat
- Mobile `Enter` inserts newline only
- Desktop `Enter` sends and `Shift+Enter` inserts newline
- Voice recording permission flow
- Transcript insertion into empty and non-empty textarea
- No outer page scroll on chat route
- No whole-page horizontal overflow with long code or tool output

## Recommendation

Use a single fullscreen chat shell plus server-backed transcription. This is the most reliable way to make browser and PWA chat feel close to ChatGPT or Claude while still supporting iPhone well.
