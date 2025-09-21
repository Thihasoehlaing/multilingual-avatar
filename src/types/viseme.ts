// Backend payload item from /tts/speak/*
export type BackendViseme = {
  time_ms: number;   // ms since start of utterance
  shape: string;     // e.g. "AA","PP","SS","UW","AX", ...
};

// Frontend-friendly frame for the avatar renderer
export type VisemeFrame = {
  t: number;         // ms since start
  label?: string;    // morph label (AA, MBP, S, T, K, IY, UW, ...)
  mouth: number;     // 0..1 blend/intensity
  smile?: number;    // reserved/optional
};
