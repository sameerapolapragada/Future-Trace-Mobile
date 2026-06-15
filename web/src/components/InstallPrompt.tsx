import { usePwaInstall } from "../lib/usePwaInstall";

export function InstallPrompt() {
  const { visible, showIosHint, showAndroidInstall, install, dismiss } = usePwaInstall();

  if (!visible) return null;

  return (
    <div className="mb-3 rounded-xl border border-accent/25 bg-gradient-to-r from-accent/10 to-accent-purple/5 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Install Future Trace</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {showIosHint
              ? "Tap Share, then Add to Home Screen for a full-screen app experience."
              : "Add to your home screen for faster access and an app-like experience."}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 text-xs text-muted transition hover:text-white"
        >
          ✕
        </button>
      </div>

      {showAndroidInstall ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 ft-focus-ring"
        >
          Install app
        </button>
      ) : null}
    </div>
  );
}
