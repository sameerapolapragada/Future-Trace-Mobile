import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    out[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return out;
}

const repoRoot = resolve(import.meta.dirname, "../..");
const fileEnv = {
  ...parseEnvFile(resolve(repoRoot, "web/.env.local")),
  ...parseEnvFile(resolve(repoRoot, "bff/.env.local")),
};

export function env(key: string): string | undefined {
  return process.env[key]?.trim() || fileEnv[key]?.trim() || undefined;
}

export function requireEnv(key: string): string {
  const value = env(key);
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

export function allowedOrigins(): string[] {
  const raw = env("BFF_ALLOWED_ORIGINS") ?? env("OPENROUTER_SITE_URL") ?? "http://localhost:5173";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}
