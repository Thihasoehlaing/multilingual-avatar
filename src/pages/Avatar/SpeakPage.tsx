import { useEffect, useMemo, useRef, useState } from "react";
import ThreeAvatar, { type VisemeFrame } from "@/components/common/ThreeAvatar";
import { useAppSelector } from "@/store/hooks";

type InputMode = "voice" | "text";

function estimateDurationMs(text: string, wpm = 175) {
  const words = Math.max(1, text.trim().split(/\s+/).length);
  return Math.round((words / wpm) * 60_000);
}

/** Very simple text→viseme heuristic for demo purposes */
function visemesFromText(text: string, totalMs: number): VisemeFrame[] {
  if (!text.trim()) return [{ t: 0, mouth: 0.0, label: "rest" }, { t: 400, mouth: 0.0, label: "rest" }];

  const chunks = text.match(/[A-Za-z']+|[.,!?;:]+|\s+/g) ?? [text];
  const labels: Array<{ label: string; mouth: number }> = chunks.map((tok) => {
    const s = tok.toLowerCase();
    if (/^\s+$/.test(s)) return { label: "rest", mouth: 0.0 };
    if (/[,.!?;:]/.test(s)) return { label: "MBP", mouth: 0.1 };
    if (/[pbm]/.test(s)) return { label: "MBP", mouth: 0.2 };
    if (/[fv]/.test(s)) return { label: "FV", mouth: 0.6 };
    if (/[l]/.test(s)) return { label: "L", mouth: 0.55 };
    if (/[iy]/.test(s)) return { label: "IY", mouth: 0.7 };
    if (/[uwo]/.test(s)) return { label: "UW", mouth: 0.75 };
    if (/[a]/.test(s)) return { label: "AA", mouth: 0.85 };
    if (/[e]/.test(s)) return { label: "EH", mouth: 0.65 };
    if (/[tcdkgrszh]/.test(s)) return { label: "T", mouth: 0.45 };
    return { label: "AA", mouth: 0.5 };
  });

  const step = Math.max(70, Math.floor(totalMs / Math.max(2, labels.length * 1.2)));
  const frames: VisemeFrame[] = [];
  let t = 0;
  for (const l of labels) {
    frames.push({ t, label: l.label, mouth: l.mouth });
    t += step;
    frames.push({ t, label: "rest", mouth: 0.05 });
    t += 20;
  }
  frames.push({ t: totalMs, label: "rest", mouth: 0 });
  return frames;
}

export default function SpeakPage() {
  // Gender from authenticated Redux store
  const userGenderRaw = useAppSelector((s) => s.auth.user?.gender ?? "male");
  const gender: "male" | "female" = userGenderRaw?.toLowerCase() === "female" ? "female" : "male";

  const modelUrl = useMemo(() => (gender === "male" ? "/models/male.glb" : "/models/female.glb"), [gender]);

  // Input mode + text
  const [mode, setMode] = useState<InputMode>("text");
  const [textValue, setTextValue] = useState("Hello! Nice to meet you.");

  // Mic bits (kept minimal)
  const [micSupported, setMicSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<BlobPart[]>([]);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  // Lip-sync playback
  const [visemeFrames, setVisemeFrames] = useState<VisemeFrame[]>([]);
  const [playhead, setPlayhead] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    // const ok = typeof window !== "undefined" && "SpeechSynthesisUtterance" in window && "speechSynthesis" in window;
    const micOk = typeof window !== "undefined" && "MediaRecorder" in window && navigator?.mediaDevices?.getUserMedia != null;
    setMicSupported(micOk);
    // ok for TTS is optional; we still animate even if speechSynthesis missing
  }, []);

  // --- Text → Speak (audio + visemes) ---
  function speakText() {
    const text = textValue.trim();
    if (!text) return;

    // 1) Estimate duration and build frames
    const durationMs = estimateDurationMs(text);
    const frames = visemesFromText(text, durationMs);
    setVisemeFrames(frames);

    // 2) Run a small RAF clock to advance playhead
    cancelRaf();
    lastTsRef.current = null;
    const loop = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setPlayhead((p) => {
        const next = p + dt;
        return next >= durationMs ? durationMs : next;
      });
      if ((lastTsRef.current ?? 0) && (playhead < durationMs)) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    // 3) Speak with browser TTS (best-effort)
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      // Choose a voice in the current language later; default is fine for demo
      u.onend = () => cancelRaf();
      try { window.speechSynthesis.speak(u); } catch { /* ignore */ }
    }
  }

  function cancelRaf() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    setPlayhead(0);
  }

  // --- Voice recording (optional demo) ---
  async function startRecording() {
    if (!micSupported || isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    recordedChunks.current = [];
    rec.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) recordedChunks.current.push(ev.data);
    };
    rec.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: rec.mimeType || "audio/webm" });
      setLastBlob(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = rec;
    rec.start();
    setIsRecording(true);
  }
  function stopRecording() {
    const rec = mediaRecorderRef.current;
    if (!rec || !isRecording) return;
    rec.stop();
    setIsRecording(false);
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 text-neutral-100">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Column 1: Auto-framed, face-centered avatar */}
        <div className="col-span-1 md:col-span-3 flex items-center justify-center">
          <ThreeAvatar
            gender={gender}
            modelUrl={modelUrl}
            playheadMs={playhead}
            visemes={visemeFrames}
            idle={visemeFrames.length === 0 || playhead === 0}
            autoFrameFace
            height={620}
          />
        </div>

        {/* Column 2–3: Controls */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          {/* Input Mode */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-sm opacity-75 mb-2">Input Mode</div>
            <div className="flex gap-4">
              <button
                className={`px-3 py-1 rounded border ${
                  mode === "voice"
                    ? "border-violet-500 bg-violet-600/20"
                    : "border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                }`}
                onClick={() => setMode("voice")}
              >
                🎤 Voice
              </button>
              <button
                className={`px-3 py-1 rounded border ${
                  mode === "text"
                    ? "border-violet-500 bg-violet-600/20"
                    : "border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                }`}
                onClick={() => setMode("text")}
              >
                ✍️ Text
              </button>
            </div>

            {mode === "text" ? (
              <div className="mt-4 flex flex-col gap-3">
                <textarea
                  className="w-full min-h-[120px] bg-neutral-900 border border-neutral-700 rounded p-2"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Type something for the avatar to say…"
                />
                <div>
                  <button
                    className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                    onClick={speakText}
                  >
                    🔊 Speak
                  </button>
                  {visemeFrames.length > 0 && (
                    <button
                      className="ml-2 px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                      onClick={cancelRaf}
                    >
                      ⏹ Stop
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {micSupported ? (
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <button
                        className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
                        onClick={startRecording}
                      >
                        ⏺ Start Recording
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 rounded border border-red-700 bg-red-900/40 hover:bg-red-900/60"
                        onClick={stopRecording}
                      >
                        ⏹ Stop Recording
                      </button>
                    )}
                    {lastBlob && <audio controls src={URL.createObjectURL(lastBlob)} className="h-9" />}
                  </div>
                ) : (
                  <div className="text-sm text-amber-400">Microphone not supported in this browser.</div>
                )}
              </div>
            )}
          </div>

          {/* Languages (static placeholders; wire to Polly/Bedrock later) */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm opacity-75 mb-1">Current Language</div>
              <select className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1" defaultValue="en-US">
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="ja-JP">Japanese</option>
                <option value="ms-MY">Malay</option>
              </select>
            </div>
            <div>
              <div className="text-sm opacity-75 mb-1">Target Language</div>
              <select className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1" defaultValue="en-US">
                <option value="en-US">English (US)</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
                <option value="ms-MY">Malay</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
