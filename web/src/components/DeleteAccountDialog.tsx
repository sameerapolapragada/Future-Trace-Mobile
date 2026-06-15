import { useState } from "react";
import { GhostButton, PrimaryButton } from "../design-system";

type DeleteAccountDialogProps = {
  email: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteAccountDialog({
  email,
  open,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const canDelete = confirmText.trim().toLowerCase() === email.trim().toLowerCase();

  async function handleDelete() {
    if (!canDelete || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    setConfirmText("");
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-card p-5 shadow-xl">
        <h2 id="delete-account-title" className="text-base font-semibold text-white">
          Delete account
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This permanently removes your profile, scans, X-Rays, and transition plans. This action
          cannot be undone.
        </p>
        <label className="mt-4 block text-xs text-muted">
          Type your email to confirm: <span className="text-white">{email}</span>
          <input
            type="email"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-danger/50"
            autoComplete="off"
            disabled={busy}
          />
        </label>
        {error ? (
          <p className="mt-3 text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <GhostButton fullWidth onClick={handleClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton
            fullWidth
            disabled={!canDelete || busy}
            onClick={() => void handleDelete()}
            className="bg-danger hover:bg-danger/90 disabled:bg-danger/40"
          >
            {busy ? "Deleting…" : "Delete account"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
