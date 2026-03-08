import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { transcribeAudioFile } from "@/lib/speech-to-text/service";
import { getSettings } from "@/lib/storage/settings-store";
import {
  buildTranscriptionSuccessResponse,
  mapTranscriptionError,
  validateAudioUpload,
} from "./route.helpers";

function sanitizeFileName(fileName: string): string {
  const trimmed = path.basename(fileName).trim();
  if (!trimmed) {
    return `chat-dictation-${Date.now()}.webm`;
  }
  return trimmed.replace(/\s+/g, "-");
}

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;

  try {
    const formData = await req.formData();
    const upload = validateAudioUpload(formData.get("file"));
    if ("response" in upload) {
      return Response.json(upload.response.body, {
        status: upload.response.status,
      });
    }

    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "eggent-chat-transcribe-")
    );
    const tempFilePath = path.join(tempDir, sanitizeFileName(upload.file.name));

    await fs.writeFile(tempFilePath, Buffer.from(await upload.file.arrayBuffer()));

    const settings = await getSettings();
    const transcript = await transcribeAudioFile(
      {
        filePath: tempFilePath,
        fileName: upload.file.name,
        mimeType: upload.file.type,
      },
      settings.speechToText
    );
    const response = buildTranscriptionSuccessResponse(transcript);

    return Response.json(response.body, { status: response.status });
  } catch (error) {
    const response = mapTranscriptionError(error);

    if (response.status >= 500) {
      console.error("Chat transcription error:", error);
    }

    return Response.json(response.body, { status: response.status });
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

