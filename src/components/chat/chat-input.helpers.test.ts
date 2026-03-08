import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mergeTranscriptIntoInput,
  shouldSubmitOnEnter,
} from "./chat-input.helpers.ts";

describe("shouldSubmitOnEnter", () => {
  it("submits on desktop Enter", () => {
    assert.equal(
      shouldSubmitOnEnter({
        isMobile: false,
        isShiftPressed: false,
        key: "Enter",
      }),
      true
    );
  });

  it("keeps Shift+Enter as newline on desktop", () => {
    assert.equal(
      shouldSubmitOnEnter({
        isMobile: false,
        isShiftPressed: true,
        key: "Enter",
      }),
      false
    );
  });

  it("keeps Enter as newline on mobile", () => {
    assert.equal(
      shouldSubmitOnEnter({
        isMobile: true,
        isShiftPressed: false,
        key: "Enter",
      }),
      false
    );
  });
});

describe("mergeTranscriptIntoInput", () => {
  it("uses transcript when input is empty", () => {
    assert.equal(mergeTranscriptIntoInput("", "hello world"), "hello world");
  });

  it("appends transcript on a new line when input already has text", () => {
    assert.equal(
      mergeTranscriptIntoInput("Existing note", "dictated text"),
      "Existing note\ndictated text"
    );
  });
});
