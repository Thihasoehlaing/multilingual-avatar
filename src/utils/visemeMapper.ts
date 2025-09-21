import type { BackendViseme, VisemeFrame } from "@/types/viseme";

type LabelMouth = { label: string; mouth: number };

const SHAPE_TO_LABEL: Record<string, LabelMouth> = {
  PP: { label: "MBP", mouth: 1.0 },
  DD: { label: "T",   mouth: 0.85 },
  KK: { label: "K",   mouth: 0.9  },
  SS: { label: "S",   mouth: 0.85 },
  FV: { label: "FV",  mouth: 0.8  },
  TH: { label: "TH",  mouth: 0.8  },
  EE: { label: "IY",  mouth: 0.8  },
  UW: { label: "UW",  mouth: 0.8  },
  AO: { label: "AO",  mouth: 0.85 },
  OH: { label: "OH",  mouth: 0.85 },
  AE: { label: "AE",  mouth: 0.8  },
  AH: { label: "AH",  mouth: 0.85 },
  ER: { label: "ER",  mouth: 0.7  },
  AX: { label: "AA",  mouth: 0.35 },
};

function mapOne(shape: string): LabelMouth {
  const up = shape?.toUpperCase?.() ?? "";
  return SHAPE_TO_LABEL[up] ?? { label: "AA", mouth: 0.3 };
}

export function toVisemeFrames(visemes_mapped: BackendViseme[]): VisemeFrame[] {
  let lastT = -1;
  return visemes_mapped.map(({ time_ms, shape }) => {
    const t = Math.max(time_ms ?? 0, lastT >= 0 ? lastT : 0);
    lastT = t;
    const { label, mouth } = mapOne(shape);
    return { t, label, mouth };
  });
}
