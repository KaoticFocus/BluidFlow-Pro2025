/**
 * OpenAI Whisper transcription service
 */

import OpenAI from "openai";
import { getOpenAIClient } from "./openai-client";
import { AIResponseMetadata, calculateWhisperCost } from "./types";

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avgLogprob: number;
  compressionRatio: number;
  noSpeechProb: number;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: TranscriptionSegment[];
  metadata: AIResponseMetadata;
}

export interface TranscribeOptions {
  /** Audio file as Buffer or File */
  audio: Buffer | File;
  /** Filename for the audio (required for Buffer) */
  filename?: string;
  /** Language hint (ISO 639-1 code) */
  language?: string;
  /** Prompt to guide the model's style */
  prompt?: string;
  /** Temperature for sampling (0-1) */
  temperature?: number;
  /** Response format */
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribe(options: TranscribeOptions): Promise<TranscriptionResult> {
  const client = getOpenAIClient();
  const startTime = Date.now();

  // Convert Buffer to File if needed
  let file: File;
  if (options.audio instanceof Buffer) {
    const filename = options.filename || "audio.mp3";
    file = new File([options.audio], filename, { 
      type: getMimeType(filename) 
    });
  } else {
    file = options.audio;
  }

  try {
    const response = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: options.language,
      prompt: options.prompt,
      temperature: options.temperature ?? 0,
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const latencyMs = Date.now() - startTime;
    const duration = (response as unknown as { duration?: number }).duration || 0;

    // Map response segments
    const segments: TranscriptionSegment[] = (
      (response as unknown as { segments?: TranscriptionSegment[] }).segments || []
    ).map((seg, idx) => ({
      id: idx,
      seek: seg.seek || 0,
      start: seg.start,
      end: seg.end,
      text: seg.text,
      tokens: seg.tokens || [],
      temperature: seg.temperature || 0,
      avgLogprob: seg.avgLogprob || 0,
      compressionRatio: seg.compressionRatio || 0,
      noSpeechProb: seg.noSpeechProb || 0,
    }));

    const metadata: AIResponseMetadata = {
      model: "whisper-1",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs,
      estimatedCostUsd: calculateWhisperCost(duration),
    };

    return {
      text: response.text,
      language: (response as unknown as { language?: string }).language || "en",
      duration,
      segments,
      metadata,
    };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw error;
  }
}

/**
 * Translate audio to English using OpenAI Whisper
 */
export async function translateAudio(options: TranscribeOptions): Promise<TranscriptionResult> {
  const client = getOpenAIClient();
  const startTime = Date.now();

  let file: File;
  if (options.audio instanceof Buffer) {
    const filename = options.filename || "audio.mp3";
    file = new File([options.audio], filename, { 
      type: getMimeType(filename) 
    });
  } else {
    file = options.audio;
  }

  try {
    const response = await client.audio.translations.create({
      file,
      model: "whisper-1",
      prompt: options.prompt,
      temperature: options.temperature ?? 0,
      response_format: "verbose_json",
    });

    const latencyMs = Date.now() - startTime;
    const duration = (response as unknown as { duration?: number }).duration || 0;

    const segments: TranscriptionSegment[] = (
      (response as unknown as { segments?: TranscriptionSegment[] }).segments || []
    ).map((seg, idx) => ({
      id: idx,
      seek: seg.seek || 0,
      start: seg.start,
      end: seg.end,
      text: seg.text,
      tokens: seg.tokens || [],
      temperature: seg.temperature || 0,
      avgLogprob: seg.avgLogprob || 0,
      compressionRatio: seg.compressionRatio || 0,
      noSpeechProb: seg.noSpeechProb || 0,
    }));

    const metadata: AIResponseMetadata = {
      model: "whisper-1",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs,
      estimatedCostUsd: calculateWhisperCost(duration),
    };

    return {
      text: response.text,
      language: "en",
      duration,
      segments,
      metadata,
    };
  } catch (error) {
    console.error("Whisper translation error:", error);
    throw error;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    mpeg: "audio/mpeg",
    mpga: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };
  return mimeTypes[ext || ""] || "audio/mpeg";
}

/**
 * Check if file size is within Whisper limits (25MB)
 */
export function isFileSizeValid(sizeBytes: number): boolean {
  return sizeBytes <= 25 * 1024 * 1024;
}

/**
 * Get maximum file size in bytes
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

