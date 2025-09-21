import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

export default function VoiceRecorderUploader(props: {
  onUploaded?: (info: { bucket: string; key: string; uri: string }) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "recording" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "MediaRecorder" in window && navigator?.mediaDevices?.getUserMedia;
    setSupported(!!ok);
  }, []);

  useEffect(() => {
    if (status === "recording") {
      const t0 = Date.now();
      timerRef.current = window.setInterval(() => setElapsedMs(Date.now() - t0), 100) as unknown as number;
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedMs(0);
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  function chooseMime(): string {
    if (typeof window === "undefined") return "audio/webm";
    const MR = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
    if (!MR || typeof MR.isTypeSupported !== "function") return "audio/webm";
    if (MR.isTypeSupported("audio/webm")) return "audio/webm";
    if (MR.isTypeSupported("audio/mp4")) return "audio/mp4";
    if (MR.isTypeSupported("audio/mpeg")) return "audio/mpeg";
    if (MR.isTypeSupported("audio/wav")) return "audio/wav";
    return "audio/webm";
  }

  async function startRecording() {
    if (!supported || status !== "idle") return;
    setErrorMsg(null);
    setLastBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: chooseMime() });
      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setLastBlob(blob);
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {
            // ignore
        }
        streamRef.current = null;
      };
      recRef.current = rec;
      rec.start();
      setStatus("recording");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Microphone permission denied.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  function stopRecording() {
    if (status !== "recording") return;
    try {
      recRef.current?.stop();
    } catch {
        // ignore
    }
    setStatus("idle");
  }

  async function uploadBlob() {
    if (!lastBlob || status !== "idle") return;
    setErrorMsg(null);
    setStatus("uploading");
    try {
      const mime = lastBlob.type || "audio/webm";
      const ext =
        mime.includes("webm") ? "webm" :
        mime.includes("mp4")  ? "m4a"  :
        mime.includes("wav")  ? "wav"  :
        mime.includes("mpeg") ? "mp3"  : "webm";

      const file = new File([lastBlob], `voice.${ext}`, { type: mime });
      const form = new FormData();
      form.append("voice_file", file);

      const res = await api.post("/voice/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const info = res.data as { bucket: string; key: string; uri: string };
      if (props.onUploaded) props.onUploaded(info);
      setStatus("idle");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  function resetAll() {
    setErrorMsg(null);
    setLastBlob(null);
    setStatus("idle");
    chunksRef.current = [];
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
        // ignore
    }
    streamRef.current = null;
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-center justify-between mb-3 text-sm opacity-75">
        <div>Mic: {supported ? "available" : "not supported"}</div>
        <div>Status: {status}</div>
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
          onClick={startRecording}
          disabled={!supported || status !== "idle"}
        >
          🎙️ Start
        </button>
        <button
          className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
          onClick={stopRecording}
          disabled={status !== "recording"}
        >
          ⏹ Stop
        </button>
        <button
          className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
          onClick={uploadBlob}
          disabled={!lastBlob || status !== "idle"}
        >
          ⬆️ Upload
        </button>
        <button
          className="px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
          onClick={resetAll}
          disabled={status === "recording"}
        >
          ♻️ Reset
        </button>
      </div>

      <div className="mt-2 text-sm opacity-75">
        {status === "recording" ? `Recording… ${Math.floor(elapsedMs / 1000)}s` : null}
      </div>

      {lastBlob ? (
        <div className="mt-3">
          <audio controls src={URL.createObjectURL(lastBlob)} className="w-full" />
        </div>
      ) : null}

      {errorMsg ? <div className="mt-3 text-sm text-red-400">{errorMsg}</div> : null}
    </div>
  );
}
