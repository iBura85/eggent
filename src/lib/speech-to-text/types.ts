import type { SpeechToTextProvider as SpeechToTextProviderId } from "@/lib/types";

export interface TranscribeAudioFileInput {
  filePath: string;
  fileName?: string;
  mimeType?: string;
}

export interface SpeechTranscriptResult {
  text: string;
  provider: SpeechToTextProviderId;
  model?: string;
  language?: string;
  confidence?: number;
  durationSeconds?: number;
}

export interface SpeechToTextProvider {
  readonly id: SpeechToTextProviderId;
  transcribe(input: TranscribeAudioFileInput): Promise<SpeechTranscriptResult>;
}

export type SpeechToTextErrorCode =
  | "disabled"
  | "provider_not_configured"
  | "unsupported_provider"
  | "transcription_failed";

export class SpeechToTextError extends Error {
  code: SpeechToTextErrorCode;

  constructor(code: SpeechToTextErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
