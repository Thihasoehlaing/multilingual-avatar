import { useMemo, useRef, useState, useEffect } from "react";
import ThreeAvatar from "@/components/common/ThreeAvatar";
import { useAppSelector } from "@/store/hooks";
import VoiceRecorderUploader from "@/components/common/VoiceRecorderUploader";
import LanguageSelector from "@/components/common/LanguageSelector";
import { tts_speak_text, tts_speak_voice_from_s3 } from "@/services/avatar";
import type { VisemeFrame } from "@/types/viseme";
import { toVisemeFrames } from "@/utils/visemeMapper";

type InputMode = "voice" | "text";

type BackendViseme = { time_ms: number; shape: string };

type SpeakResult = {
  s3_url: string;
  visemes_mapped: BackendViseme[];
  visemes_raw?: { time_ms: number; viseme: string }[];
  transcript?: string | null;
  source_text?: string | null;
  translated_text?: string | null;
};

export default function SpeakPage() {
  // Avatar selection
  const userGender = useAppSelector((s) => s.auth.user?.gender) ?? "male";
  const gender: "male" | "female" = userGender.toLowerCase() === "female" ? "female" : "male";
  const modelUrl = useMemo(
    () => (gender === "male" ? "/models/male.glb" : "/models/female.glb"),
    [gender]
  );

  // UI state
  const [mode, setMode] = useState<InputMode>("text");
  const [textValue, setTextValue] = useState<string>("Hello! Semua orang, nama saya John. Saya suka bermain permainan.");
  const [loading, setLoading] = useState<boolean>(false);

  // Lip-sync state
  const [visemeFrames, setVisemeFrames] = useState<VisemeFrame[]>([]);
  const [playheadMs, setPlayheadMs] = useState<number>(0);

  // Text panels
  const [transcript, setTranscript] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  // Languages
  const [currentLang, setCurrentLang] = useState<string>("ms-MY");
  const [targetLang, setTargetLang] = useState<string>("en-US");

  // Hidden audio & guards
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const playTokenRef = useRef<number>(0); // guards a single playback session
  const reqTokenRef = useRef<number>(0); // guards request/response pairs

  // Create the hidden audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const el = document.createElement("audio");
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      el.style.display = "none";
      document.body.appendChild(el);
      audioRef.current = el;
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      // Keep audio element around; no cleanup needed for SPA
    };
  }, []);

  function stopRaf(): void {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function stopAudio(): void {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    stopRaf();
    setPlayheadMs(0);
  }

  function startTick(token: number): void {
    const tick = (): void => {
      if (playTokenRef.current !== token) return; // stale
      const a = audioRef.current;
      if (!a) return;
      setPlayheadMs(a.currentTime * 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    stopRaf();
    rafRef.current = requestAnimationFrame(tick);
  }

  function playHiddenAudio(signedUrl: string): void {
    // Reserve a token for THIS playback
    const token = playTokenRef.current + 1;
    playTokenRef.current = token;

    const el = audioRef.current;
    if (!el) return;

    // Stop any existing playback, but do not change token again
    try {
      el.pause();
    } catch {
      /* ignore */
    }

    el.src = signedUrl;
    el.load();

    // Keep playhead at 0 until we actually start
    setPlayheadMs(0);

    // Start RAF when playback starts
    const onPlaying = (): void => {
      if (playTokenRef.current !== token) return;
      startTick(token);
      el.removeEventListener("playing", onPlaying);
    };
    el.addEventListener("playing", onPlaying);

    const onEnded = (): void => {
      if (playTokenRef.current !== token) return;
      stopRaf();
      setPlayheadMs(0);
      el.removeEventListener("ended", onEnded);
    };
    el.addEventListener("ended", onEnded);

    // Attempt to play; if browser requires gesture, user’s button click triggered this
    void el.play().catch(() => {
      // Silent; user can tap the Speak button again if autoplay was blocked
    });
  }

  function applyResult(resp: SpeakResult, token: number): void {
    if (reqTokenRef.current !== token) return; // stale response, ignore

    // Set texts
    setTranscript(resp.transcript ?? null);
    setSourceText(resp.source_text ?? null);
    setTranslatedText(resp.translated_text ?? null);

    // Set visemes for lip-sync
    setVisemeFrames(toVisemeFrames(resp.visemes_mapped ?? []));

    // Play audio (hidden element)
    if (resp.s3_url) {
      playHiddenAudio(resp.s3_url);
    }
  }

  async function speakText(): Promise<void> {
    const text = textValue.trim();
    if (!text || !currentLang || !targetLang) return;

    const token = reqTokenRef.current + 1;
    reqTokenRef.current = token;

    setLoading(true);
    try {
      // Clear previous text panels on new request
      setTranscript(null);
      setSourceText(null);
      setTranslatedText(null);

      const resp = await tts_speak_text(text, currentLang, targetLang, {
        return_transcript: false,
      });
      applyResult(resp as SpeakResult, token);
    } catch (err) {
      stopAudio();
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 text-neutral-100">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Avatar with lip-sync (driven by playheadMs) */}
        <div className="col-span-1 md:col-span-3 flex items-center justify-center">
          <ThreeAvatar
            gender={gender}
            modelUrl={modelUrl}
            playheadMs={playheadMs}
            visemes={visemeFrames}
            idle={visemeFrames.length === 0 || playheadMs === 0}
            autoFrameFace
            height={620}
          />
        </div>

        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          {/* Mode toggle + inputs */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-sm opacity-75 mb-2">Input Mode</div>
            <div className="flex gap-4">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${
                  mode === "voice"
                    ? "border-violet-500 bg-violet-600/20"
                    : "border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                }`}
                onClick={(): void => setMode("voice")}
              >
                🎤 Voice
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded border ${
                  mode === "text"
                    ? "border-violet-500 bg-violet-600/20"
                    : "border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                }`}
                onClick={(): void => setMode("text")}
              >
                ✍️ Text
              </button>
            </div>

            {mode === "text" ? (
              <div className="mt-4 flex flex-col gap-3">
                <textarea
                  className="w-full min-h-[120px] bg-neutral-900 border border-neutral-700 rounded p-2"
                  value={textValue}
                  onChange={(e): void => setTextValue(e.target.value)}
                  placeholder="Type something for the avatar to say…"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                    onClick={speakText}
                    disabled={loading}
                  >
                    {loading ? "..." : "🔊 Speak"}
                  </button>
                  {visemeFrames.length > 0 && (
                    <button
                      type="button"
                      className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                      onClick={stopAudio}
                    >
                      ⏹ Stop
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <VoiceRecorderUploader
                  onUploaded={(info: { bucket: string; key: string; uri?: string }): void => {
                    const token = reqTokenRef.current + 1;
                    reqTokenRef.current = token;

                    setLoading(true);
                    setTranscript(null);
                    setSourceText(null);
                    setTranslatedText(null);

                    tts_speak_voice_from_s3(info.bucket, info.key, currentLang, targetLang, {
                      return_transcript: true,
                    })
                      .then((resp) => applyResult(resp as SpeakResult, token))
                      .catch(() => {
                        stopAudio();
                      })
                      .finally(() => setLoading(false));
                  }}
                />

                {transcript && (
                  <div className="mt-2 text-xs opacity-75">
                    <div className="font-semibold mb-1">Transcript:</div>
                    <div className="rounded border border-neutral-800 bg-neutral-950 p-2">
                      {transcript}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language selectors */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <LanguageSelector
              className="w-full"
              currentLang={currentLang}
              onChangeCurrent={setCurrentLang}
              targetLang={targetLang}
              onChangeTarget={setTargetLang}
            />
          </div>

          {/* Current Text & Translation card */}
          {(sourceText || translatedText) && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-sm opacity-75 mb-3">Text &amp; Translation</div>
              <div className="grid grid-cols-1 gap-3">
                {sourceText && (
                  <div>
                    <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Current Text</div>
                    <div className="rounded border border-neutral-800 bg-neutral-900 p-2 text-sm">
                      {sourceText}
                    </div>
                  </div>
                )}
                {translatedText && (
                  <div>
                    <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Translated</div>
                    <div className="rounded border border-neutral-800 bg-neutral-900 p-2 text-sm">
                      {translatedText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
