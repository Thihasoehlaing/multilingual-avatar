import { api } from "@/services/api";
import type { BackendViseme } from "@/types/viseme";

/** Flat payload your UI wants to consume */
export type SpeakResponse = {
  s3_url: string;
  visemes_mapped: BackendViseme[];
  visemes_raw?: { time_ms: number; viseme: string }[];
  transcript?: string;
  source_text?: string;
  translated_text?: string;
};

/** Common API envelope from backend */
type ApiEnvelope<T> = {
  data: T;
  message: string;
  status?: boolean; // some stacks use "status"
  ok?: boolean;     // some stacks use "ok"
};

/** Type guard + unwrap that tolerates both wrapped and unwrapped shapes */
function unwrap<T>(raw: unknown): T {
  const obj = raw as Record<string, unknown> | null;
  if (obj && "data" in obj) {
    return (obj.data as T);
  }
  return raw as T;
}

/* ------------------- TEXT ------------------- */

export async function tts_speak_text(
  text: string,
  currentLang: string,
  targetLang: string,
  opts?: {
    style?: string;
    neural_only?: boolean;
    sample_rate_hz?: number;
    return_transcript?: boolean;
  }
): Promise<SpeakResponse> {
  const body = {
    input_type: "text",
    current_lang: currentLang,
    target_lang: targetLang,
    text,
    style: opts?.style,
    neural_only: opts?.neural_only,
    sample_rate_hz: opts?.sample_rate_hz,
    return_transcript: opts?.return_transcript ?? false,
  };

  const { data } = await api.post<ApiEnvelope<SpeakResponse> | SpeakResponse>(
    "/tts/speak/text",
    body
  );
  return unwrap<SpeakResponse>(data);
}

/* ------------------- LEGACY: VOICE (multipart) ------------------- */

export async function tts_speak_voice(
  file: File,
  currentLanguage: string,
  targetLanguage: string,
  opts?: {
    style?: string;
    neural_only?: boolean;
    sample_rate_hz?: number;
    return_transcript?: boolean;
  }
): Promise<SpeakResponse> {
  const fd = new FormData();
  fd.set("input_type", "voice");
  fd.set("current_language", currentLanguage);
  fd.set("target_language", targetLanguage);
  if (opts?.style) fd.set("style", opts.style);
  if (typeof opts?.neural_only !== "undefined") fd.set("neural_only", String(opts.neural_only));
  if (typeof opts?.sample_rate_hz !== "undefined") fd.set("sample_rate_hz", String(opts.sample_rate_hz));
  fd.set("return_transcript", String(opts?.return_transcript ?? true));
  fd.set("voice_file", file);

  const { data } = await api.post<ApiEnvelope<SpeakResponse> | SpeakResponse>(
    "/tts/speak/voice",
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return unwrap<SpeakResponse>(data);
}

/* ------------------- VOICE FROM S3 ------------------- */

export async function tts_speak_voice_from_s3(
  bucket: string,
  key: string,
  currentLang: string,
  targetLang: string,
  opts?: { return_transcript?: boolean }
): Promise<SpeakResponse> {
  const body = {
    bucket,
    key,
    current_lang: currentLang,
    target_lang: targetLang,
    return_transcript: opts?.return_transcript ?? true,
  };

  const { data } = await api.post<ApiEnvelope<SpeakResponse> | SpeakResponse>(
    "/tts/speak/voice-s3",
    body
  );
  return unwrap<SpeakResponse>(data);
}
