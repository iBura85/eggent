import { streamText, type ModelMessage } from "ai";

type StreamTextOptions = Parameters<typeof streamText>[0];

export interface BlockingStreamTextResult {
  text: string;
  responseMessages: ModelMessage[];
  finishReason?: string;
}

function extractResponseMessages(value: unknown): ModelMessage[] {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as { messages?: unknown })
      : null;
  return Array.isArray(record?.messages) ? (record.messages as ModelMessage[]) : [];
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

// Codex backend currently requires streaming requests, even for call sites that
// semantically need a blocking text result.
export async function runBlockingStreamText(
  options: StreamTextOptions
): Promise<BlockingStreamTextResult> {
  let streamError: unknown;
  let finalText = "";
  let finishReason: string | undefined;
  let responseMessages: ModelMessage[] = [];

  const result = streamText({
    ...options,
    onError: ({ error }) => {
      if (streamError === undefined) {
        streamError = error;
      }
    },
    onFinish: ({ text, finishReason: reason, response }) => {
      finalText = text;
      finishReason = reason;
      responseMessages = extractResponseMessages(response);
    },
  });

  for await (const _ of result.fullStream) {
    // Drain the stream so the provider call fully completes.
  }

  if (streamError !== undefined) {
    throw toError(streamError);
  }

  if (!finalText) {
    finalText = await result.text;
  }
  if (!finishReason) {
    const resolvedFinishReason = await result.finishReason;
    finishReason =
      typeof resolvedFinishReason === "string" ? resolvedFinishReason : undefined;
  }
  if (responseMessages.length === 0) {
    const response = await result.response;
    responseMessages = extractResponseMessages(response);
  }

  return {
    text: finalText,
    responseMessages,
    finishReason,
  };
}
