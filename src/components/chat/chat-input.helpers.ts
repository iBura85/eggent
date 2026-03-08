export interface SubmitOnEnterOptions {
  isMobile: boolean;
  isShiftPressed: boolean;
  isComposing?: boolean;
  key: string;
}

export function shouldSubmitOnEnter({
  isMobile,
  isShiftPressed,
  isComposing = false,
  key,
}: SubmitOnEnterOptions): boolean {
  if (key !== "Enter") return false;
  if (isShiftPressed || isMobile || isComposing) return false;
  return true;
}

export function mergeTranscriptIntoInput(
  currentInput: string,
  transcript: string
): string {
  const trimmedTranscript = transcript.trim();
  if (!trimmedTranscript) {
    return currentInput;
  }

  if (!currentInput.trim()) {
    return trimmedTranscript;
  }

  if (/\s$/.test(currentInput)) {
    return `${currentInput}${trimmedTranscript}`;
  }

  return `${currentInput}\n${trimmedTranscript}`;
}

