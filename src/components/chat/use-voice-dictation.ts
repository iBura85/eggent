"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DictationStatus =
  | "idle"
  | "unsupported"
  | "recording"
  | "transcribing"
  | "error";

interface UseVoiceDictationOptions {
  disabled?: boolean;
  onTranscript: (text: string) => void;
}

interface DictationState {
  canRecord: boolean;
  error: string | null;
  status: DictationStatus;
  toggleRecording: () => Promise<void>;
}

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  for (const candidate of AUDIO_MIME_CANDIDATES) {
    if (typeof MediaRecorder.isTypeSupported !== "function") {
      return candidate;
    }
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "";
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function getRecordingErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Microphone permission was denied.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found on this device.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Recording failed. Try again.";
}

export function useVoiceDictation({
  disabled = false,
  onTranscript,
}: UseVoiceDictationOptions): DictationState {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [canRecord, setCanRecord] = useState(false);
  const [supportedMimeType, setSupportedMimeType] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const resetMediaState = useCallback(() => {
    recorderRef.current = null;
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }
    streamRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    setCanRecord(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia
    );
    setSupportedMimeType(getSupportedMimeType());
  }, []);

  useEffect(() => {
    return () => {
      resetMediaState();
    };
  }, [resetMediaState]);

  const stopAndTranscribe = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    setError(null);
    setStatus("transcribing");

    await new Promise<void>((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          resolve();
        },
        { once: true }
      );
      recorder.stop();
    });

    try {
      const mimeType =
        recorder.mimeType || supportedMimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File(
        [blob],
        `chat-dictation.${extensionForMimeType(mimeType)}`,
        { type: mimeType }
      );
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/chat/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; text?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Transcription failed");
      }

      const transcript = payload?.text?.trim() || "";
      if (!transcript) {
        throw new Error("Transcript is empty");
      }

      onTranscript(transcript);
      setStatus("idle");
    } catch (transcriptionError) {
      setStatus("error");
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Transcription failed"
      );
    } finally {
      resetMediaState();
    }
  }, [onTranscript, resetMediaState, supportedMimeType]);

  const startRecording = useCallback(async () => {
    if (
      disabled ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setStatus("unsupported");
      setError("Voice dictation is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });
      recorder.addEventListener("error", () => {
        setStatus("error");
        setError("Recording failed. Try again.");
        resetMediaState();
      });

      recorder.start();
      setStatus("recording");
    } catch (recordingError) {
      setStatus("error");
      setError(getRecordingErrorMessage(recordingError));
      resetMediaState();
    }
  }, [disabled, resetMediaState, supportedMimeType]);

  const toggleRecording = useCallback(async () => {
    if (disabled || status === "transcribing") {
      return;
    }

    if (status === "recording") {
      await stopAndTranscribe();
      return;
    }

    await startRecording();
  }, [disabled, startRecording, status, stopAndTranscribe]);

  return {
    canRecord,
    error,
    status,
    toggleRecording,
  };
}
