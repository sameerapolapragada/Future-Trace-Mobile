export type ScanSessionInputs = {
  jobTitle: string;
  industry: string;
  yearsExperience: string;
  currentSkills: string;
  toolsUsed: string;
  careerGoal: string;
  workPreference: string;
};

const STORAGE_KEY = "ft_latest_scan_session";

export function saveScanSession(inputs: ScanSessionInputs): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      inputs,
      completedAt: new Date().toISOString(),
    })
  );
}

export function loadScanSession(): ScanSessionInputs | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { inputs?: ScanSessionInputs };
    if (!parsed.inputs?.jobTitle?.trim()) return null;
    return parsed.inputs;
  } catch {
    return null;
  }
}

export function parseSkillList(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
