import { supabase } from "./supabaseClient";

const PLACEHOLDER_PATTERNS = ["your-app", "REPLACE_ME", "localhost:3000/example"];

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

/** Future-Trace BFF base URL. Empty string = same origin (Vite dev proxy on /api). */
export function getApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) {
    const url = raw.replace(/\/$/, "");
    if (PLACEHOLDER_PATTERNS.some((pattern) => url.includes(pattern))) return null;
    return url;
  }

  // Dev: Vite proxies /api → Future-Trace on :3000. Do not open :3000 in the browser.
  if (import.meta.env.DEV) return "";

  return null;
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl() !== null;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Attach Supabase access token (default: true). */
  auth?: boolean;
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function resolveUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (baseUrl === null) {
    throw new ApiClientError(
      "Missing VITE_API_BASE_URL. In dev, run Future-Trace on :3000 and use the mobile app on :5173 (Vite proxies /api).",
      0
    );
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Authenticated fetch to the Future-Trace BFF (not Supabase, not Gemini). */
export async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { body, auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiClientError("Not authenticated", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(resolveUrl(path), {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const text = await response.text();
  const payload = text ? parseJson(text) : null;

  if (!response.ok) {
    let message =
      payload && typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : response.statusText || "Request failed";

    if (response.status === 502) {
      message =
        "Checkout server unavailable (502). Restart `npm run dev` in web/ with STRIPE_SECRET_KEY in .env.local, or start the Future-Trace BFF on port 3000.";
    }

    throw new ApiClientError(message, response.status, payload);
  }

  return payload as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
