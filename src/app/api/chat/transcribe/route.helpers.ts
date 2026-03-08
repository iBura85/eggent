import {
  SpeechToTextError,
  type SpeechTranscriptResult,
} from "../../../../lib/speech-to-text/types.ts";

export interface ChatTranscribeResponseSpec {
  body: Record<string, unknown>;
  status: number;
}

export function buildTranscriptionSuccessResponse(
  result: SpeechTranscriptResult
): ChatTranscribeResponseSpec {
  return {
    status: 200,
    body: {
      ...result,
      text: result.text.trim(),
    },
  };
}

export function mapTranscriptionError(
  error: unknown
): ChatTranscribeResponseSpec {
  if (error instanceof SpeechToTextError) {
    if (
      error.code === "disabled" ||
      error.code === "provider_not_configured" ||
      error.code === "unsupported_provider"
    ) {
      return {
        status: 400,
        body: {
          error: error.message,
          reason: error.code,
        },
      };
    }

    return {
      status: 502,
      body: {
        error: error.message,
        reason: error.code,
      },
    };
  }

  return {
    status: 500,
    body: {
      error:
        error instanceof Error
          ? error.message
          : "Failed to transcribe audio",
      reason: "internal_error",
    },
  };
}

export function validateAudioUpload(
  value: FormDataEntryValue | null
): { file: File } | { response: ChatTranscribeResponseSpec } {
  if (!(value instanceof File)) {
    return {
      response: {
        status: 400,
        body: {
          error: "Audio file is required",
          reason: "missing_file",
        },
      },
    };
  }

  if (value.size === 0) {
    return {
      response: {
        status: 400,
        body: {
          error: "Audio file is empty",
          reason: "empty_file",
        },
      },
    };
  }

  return { file: value };
}

