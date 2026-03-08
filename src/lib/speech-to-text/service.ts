import type { AppSettings } from "@/lib/types";
import {
  SpeechToTextError,
  type SpeechTranscriptResult,
  type TranscribeAudioFileInput,
} from "@/lib/speech-to-text/types";
import { DeepgramSpeechToTextProvider } from "@/lib/speech-to-text/providers/deepgram";

export async function transcribeAudioFile(
  input: TranscribeAudioFileInput,
  config: AppSettings["speechToText"]
): Promise<SpeechTranscriptResult> {
  if (!config.enabled) {
    throw new SpeechToTextError(
      "disabled",
      "Speech-to-text is disabled"
    );
  }

  switch (config.provider) {
    case "deepgram": {
      const provider = new DeepgramSpeechToTextProvider(config);
      return provider.transcribe(input);
    }
    case "none":
      throw new SpeechToTextError(
        "provider_not_configured",
        "Speech-to-text provider is not configured"
      );
    default:
      throw new SpeechToTextError(
        "unsupported_provider",
        `Speech-to-text provider "${config.provider}" is not supported yet`
      );
  }
}
