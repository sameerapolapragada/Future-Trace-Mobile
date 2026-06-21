import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import { env } from "../env.ts";

export type AuthContext = {
  userId: string;
  token: string;
};

export function supabaseConfig() {
  const url = env("VITE_SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY");
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function serviceRoleClient() {
  const url = env("VITE_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function getAuth(c: Context): Promise<AuthContext | null> {
  const config = supabaseConfig();
  if (!config) return null;

  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const supabase = createClient(config.url, config.anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { userId: data.user.id, token };
}

export async function restGetWithUserJwt<T>(
  token: string,
  path: string
): Promise<T> {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase not configured");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: config.anonKey,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

export async function restPostWithUserJwt<T>(
  token: string,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  prefer = "return=representation"
): Promise<T> {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase not configured");

  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: config.anonKey,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

export async function restPatchWithUserJwt(
  token: string,
  table: string,
  filter: string,
  patch: Record<string, unknown>
): Promise<void> {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase not configured");

  const response = await fetch(`${config.url}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: config.anonKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function rpcWithUserJwt(
  token: string,
  fn: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase not configured");

  const response = await fetch(`${config.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function rpcWithServiceRole(
  fn: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const admin = serviceRoleClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  const { data, error } = await admin.rpc(fn, args);
  if (error) throw error;
  return data;
}
