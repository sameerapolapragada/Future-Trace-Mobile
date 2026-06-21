import type { NormalizedScanInput } from "../../lib/shared";

let pending: NormalizedScanInput | null = null;

export function setPendingScanInput(input: NormalizedScanInput): void {
  pending = input;
}

export function takePendingScanInput(): NormalizedScanInput | null {
  const value = pending;
  pending = null;
  return value;
}
