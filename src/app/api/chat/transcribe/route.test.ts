import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SpeechToTextError } from "../../../../lib/speech-to-text/types.ts";
import {
  buildTranscriptionSuccessResponse,
  mapTranscriptionError,
  validateAudioUpload,
} from "./route.helpers.ts";

describe("validateAudioUpload", () => {
  it("returns a readable error when file is missing", () => {
    const result = validateAudioUpload(null);
    assert.equal("response" in result, true);
    if (!("response" in result)) return;

    assert.equal(result.response.status, 400);
    assert.deepEqual(result.response.body, {
      error: "Audio file is required",
      reason: "missing_file",
    });
  });
});

describe("buildTranscriptionSuccessResponse", () => {
  it("returns transcript text in a success payload", () => {
    const response = buildTranscriptionSuccessResponse({
      text: "  transcript ready  ",
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      confidence: 0.98,
      durationSeconds: 1.2,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      text: "transcript ready",
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      confidence: 0.98,
      durationSeconds: 1.2,
    });
  });
});

describe("mapTranscriptionError", () => {
  it("maps disabled/provider errors to a readable client response", () => {
    const response = mapTranscriptionError(
      new SpeechToTextError(
        "provider_not_configured",
        "Deepgram API key is not configured"
      )
    );

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: "Deepgram API key is not configured",
      reason: "provider_not_configured",
    });
  });
});

