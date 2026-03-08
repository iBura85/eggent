# Telegram Voice STT Design

## Goal

Add Telegram voice and audio message support so Eggent can:

- accept `voice` and `audio` messages from Telegram;
- save the original media into chat files;
- transcribe the audio through a provider-agnostic speech-to-text layer;
- pass the recognized text into the existing agent flow as a normal user message;
- reply in Telegram with one message that contains a compact transcript block plus the agent response.

This is an MVP for Telegram only. It must not change behavior for plain text messages or other media types.

## Product Decisions

- Supported media in MVP: Telegram `voice` and `audio`.
- User-facing behavior: one Telegram reply containing:
  - a compact `Распознал: ...` block;
  - the main agent response below it.
- Transcript is used automatically as input to the agent.
- Original audio file is always saved into chat files, even on success.
- If transcription fails, the file remains saved and the user gets a short fallback error.
- Speech-to-text configuration lives in global app settings, not inside Telegram integration settings.
- The speech-to-text layer must be provider-agnostic from the start.
- First provider: Deepgram.

## Approaches Considered

### 1. Inline Telegram orchestration plus shared STT service

Keep Telegram webhook as the entrypoint. It downloads the media, saves the file, calls a shared speech-to-text service, and then forwards recognized text into `handleExternalMessage`.

Pros:

- minimal refactor of the current Telegram flow;
- fastest path to delivery;
- reuses current routing, session, and reply logic.

Cons:

- orchestration still begins in the Telegram route;
- route can become too large if responsibilities are not split carefully.

### 2. Generic media-ingestion pipeline

Create a shared media pipeline that Telegram calls into. The pipeline handles save, transcription, formatting, and agent input construction.

Pros:

- clean long-term architecture;
- easier to reuse for other channels later.

Cons:

- larger refactor now;
- unnecessary complexity for the Telegram-first MVP.

### 3. Async job model

Accept audio, enqueue transcription, and reply later when processing completes.

Pros:

- stronger for long-running audio or retries.

Cons:

- heavier implementation;
- worse MVP UX for conversational Telegram bot use.

## Recommendation

Use approach 1, but structure it so the internals are already reusable:

- Telegram route stays transport-specific.
- Media save, speech-to-text, and reply formatting live in separate modules.
- A later migration to approach 2 becomes mostly moving the coordinator up a level instead of rewriting business logic.

## Architecture

### Transport Layer

`src/app/api/integrations/telegram/route.ts` remains the Telegram transport entrypoint. It continues to:

- validate webhook secret and allowed user;
- resolve Telegram session and project context;
- download Telegram files;
- send Telegram chat actions and final replies.

It should not own provider-specific STT logic.

### New Speech-to-Text Layer

Add a shared speech-to-text application service with a provider interface, for example:

- `SpeechToTextProvider`
- `DeepgramSpeechToTextProvider`
- `transcribeAudioFile()` facade/service

The service accepts a local file path and normalized metadata, then returns a normalized result object such as:

- `text`
- `provider`
- `language?`
- `duration?`
- `confidence?`

### Media Handling Split

Keep the following responsibilities separate:

- Telegram route: receive update and send Telegram response.
- Incoming media service: save file and normalize metadata.
- Speech-to-text service: transcribe saved audio via selected provider.
- Voice reply composer: prepare agent input text and Telegram output text.

This keeps the MVP compatible with a future generic media-ingestion pipeline.

## Data Flow

### Successful Voice/Audio Request

1. Telegram webhook receives a private `voice` or `audio` message.
2. The media file is downloaded from Telegram.
3. The original file is saved to chat files.
4. The speech-to-text service transcribes the saved file.
5. Telegram route constructs the user message for the agent:
   - if there is a caption:
     - `Комментарий пользователя: ...`
     - `Распознанный текст: ...`
   - otherwise:
     - recognized transcript only
6. The route calls the existing `handleExternalMessage`.
7. Telegram sends one final message:
   - compact transcript preview;
   - blank line;
   - main agent response.

### Transcript Visibility

- The agent receives the full transcript.
- Telegram user sees a compact transcript preview.
- If transcript is long, the Telegram preview may be shortened, but the agent input stays complete.

### Non-Audio Behavior

- Plain text messages continue to work unchanged.
- Non-audio uploads keep the current behavior.
- `video` and `video_note` are out of scope for MVP.

## Error Handling

### Failure Rules

- If Telegram download fails, the request returns an audio-processing error and no agent call is made.
- If the file is saved but speech-to-text is disabled or not configured, the file remains available and the user gets a short configuration message.
- If provider transcription fails, the file remains saved and the user gets:
  `Не удалось распознать голосовое сообщение, попробуйте ещё раз или отправьте текст.`
- If transcription succeeds but agent execution fails, the user gets the existing agent error behavior.
- Speech-to-text failure must not crash the entire Telegram integration path.

### Logging

Log distinct failure categories:

- `download_failed`
- `save_failed`
- `provider_not_configured`
- `transcription_failed`
- `agent_failed`

## Configuration

Add a global `speechToText` block to app settings.

### MVP Settings

- `enabled: boolean`
- `provider: "none" | "deepgram" | "openai"`
- `apiKey: string`
- `model?: string`
- `language?: string`

The UI should render provider-specific fields based on the selected provider. Deepgram is the first real provider shipped by this design.

### Placement

The settings live in general app settings, not Telegram settings, because speech-to-text is a cross-channel capability even if Telegram is the first consumer.

## Telegram UX

### Reply Shape

Use a single Telegram reply message instead of two separate messages.

Example shape:

```text
Распознал: напомни мне завтра утром проверить логи продакшена

Хорошо. Я могу помочь сформулировать задачу, но сам reminder в Telegram сейчас не создаю...
```

### Typing Indicator

Keep Telegram `typing...` active during:

- file download;
- speech-to-text processing;
- agent response generation.

Quick commands such as `/start`, `/help`, and `/new` stay unchanged.

## Testing

### Unit Tests

- identify Telegram `voice` and `audio` as supported STT inputs;
- provider selection and disabled/misconfigured states in the speech-to-text facade;
- formatting of agent input and Telegram output.

### Integration Tests

- `voice` message: save file, transcribe, send transcript into `handleExternalMessage`, return one Telegram reply;
- `audio` message: same flow;
- caption plus audio: caption and transcript are combined correctly;
- transcription failure: file saved, fallback response sent, agent not called;
- plain text message: current behavior unchanged.

### Manual Validation

- short Telegram voice message;
- Telegram audio file;
- audio plus caption;
- STT disabled;
- invalid Deepgram API key;
- typing indicator visible until final reply.

## Rollout

- The new behavior is enabled only when `speechToText.enabled = true`.
- If disabled, Telegram continues to behave exactly as today.
- Deepgram ships first behind the provider abstraction.
- No MVP changes for `video`, `video_note`, or other channels.

## Implementation Notes

The chosen structure should make a future migration to a generic media-ingestion pipeline cheap:

- keep transport code in Telegram route;
- keep reusable behavior in shared services;
- avoid embedding provider logic directly in the route.

This preserves the fast delivery path of approach 1 while keeping the system ready for approach 2 later.
