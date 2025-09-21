import { useEffect, useState } from "react";
import { languages_get_current_languages, languages_get_target_languages } from "@/services/languages";
import type { Language } from "@/services/languages";

type Props = {
  currentLang: string;
  onChangeCurrent: (code: string) => void;
  targetLang: string;
  onChangeTarget: (code: string) => void;
  className?: string;
};

export default function LanguageSelector({
  currentLang,
  onChangeCurrent,
  targetLang,
  onChangeTarget,
  className,
}: Props) {
  const [currentOptions, setCurrentOptions] = useState<Language[]>([]);
  const [targetOptions, setTargetOptions] = useState<Language[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect((): (() => void) => {
    let mounted = true;
    (async (): Promise<void> => {
      try {
        const [curr, tgt] = await Promise.all([
          languages_get_current_languages(),
          languages_get_target_languages(),
        ]);
        if (mounted) {
          setCurrentOptions(curr);
          setTargetOptions(tgt);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return (): void => {
      mounted = false;
    };
  }, []);

  const mergedClass =
    "w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary]";

  return (
    <div className={className}>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="currentLang" className="text-sm opacity-85">
            Current language
          </label>
          <select
            id="currentLang"
            value={currentLang}
            onChange={(e): void => onChangeCurrent(e.target.value)}
            className={mergedClass}
            disabled={loading || currentOptions.length === 0}
          >
            {!currentLang && <option value="">Select current language…</option>}
            {currentOptions.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="targetLang" className="text-sm opacity-85">
            Target language
          </label>
          <select
            id="targetLang"
            value={targetLang}
            onChange={(e): void => onChangeTarget(e.target.value)}
            className={mergedClass}
            disabled={loading || targetOptions.length === 0}
          >
            {!targetLang && <option value="">Select target language…</option>}
            {targetOptions.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="mt-2 text-xs opacity-60">Loading languages…</p>
      )}
    </div>
  );
}
