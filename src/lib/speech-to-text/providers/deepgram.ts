import fs from "fs/promises";
import type { AppSettings } from "@/lib/types";
import type {
  SpeechToTextProvider,
  SpeechTranscriptResult,
  TranscribeAudioFileInput,
} from "@/lib/speech-to-text/types";
import { SpeechToTextError } from "@/lib/speech-to-text/types";

interface DeepgramListenResponse {
  metadata?: {
    duration?: unknown;
    model_info?: Record<
      string,
      {
        name?: unknown;
        version?: unknown;
        arch?: unknown;
      }
    >;
  };
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: unknown;
        confidence?: unknown;
        detected_language?: unknown;
      }>;
      detected_language?: unknown;
    }>;
  };
  err_code?: unknown;
  err_msg?: unknown;
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function resolveDeepgramApiKey(config: AppSettings["speechToText"]): string {
  return config.apiKey?.trim() || process.env.DEEPGRAM_API_KEY?.trim() || "";
}

export class DeepgramSpeechToTextProvider implements SpeechToTextProvider {
  readonly id = "deepgram" as const;
  private readonly config: AppSettings["speechToText"];

  constructor(config: AppSettings["speechToText"]) {
    this.config = config;
  }

  async transcribe(
    input: TranscribeAudioFileInput
  ): Promise<SpeechTranscriptResult> {
    const apiKey = resolveDeepgramApiKey(this.config);
    if (!apiKey) {
      throw new SpeechToTextError(
        "provider_not_configured",
        "Deepgram API key is not configured"
      );
    }

    const audio = await fs.readFile(input.filePath);
    const params = new URLSearchParams({
      model: trimString(this.config.model) || "nova-3",
      smart_format: "true",
      punctuate: "true",
    });

    const configuredLanguage = trimString(this.config.language);
    if (configuredLanguage) {
      params.set("language", configuredLanguage);
    } else {
      params.set("detect_language", "true");
    }

    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": input.mimeType?.trim() || "application/octet-stream",
      },
      body: audio,
    });

    const payload = (await response.json().catch(() => null)) as
      | DeepgramListenResponse
      | null;

    if (!response.ok) {
      const errorMessage =
        trimString(payload?.err_msg) ||
        `Deepgram transcription failed (${response.status})`;
      throw new SpeechToTextError("transcription_failed", errorMessage);
    }

    const firstChannel = Array.isArray(payload?.results?.channels)
      ? payload?.results?.channels[0]
      : undefined;
    const firstAlternative = Array.isArray(firstChannel?.alternatives)
      ? firstChannel?.alternatives[0]
      : undefined;
    const transcript = trimString(firstAlternative?.transcript);
    if (!transcript) {
      throw new SpeechToTextError(
        "transcription_failed",
        "Deepgram returned an empty transcript"
      );
    }

    const modelInfo = payload?.metadata?.model_info
      ? Object.values(payload.metadata.model_info)[0]
      : undefined;

    return {
      text: transcript,
      provider: this.id,
      model:
        trimString(modelInfo?.name) ||
        trimString(modelInfo?.arch) ||
        trimString(this.config.model) ||
        "nova-3",
      language:
        trimString(firstChannel?.detected_language) ||
        trimString(firstAlternative?.detected_language) ||
        configuredLanguage ||
        undefined,
      confidence: parseNumber(firstAlternative?.confidence),
      durationSeconds: parseNumber(payload?.metadata?.duration),
    };
  }
}
