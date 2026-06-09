import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";

const XRAY_AMOUNT_CENTS = 199;
const RADAR_AMOUNT_CENTS = 999;

function checkoutLineItem(
  product: "xray" | "radar",
  priceId?: string
): Stripe.Checkout.SessionCreateParams.LineItem {
  if (priceId) {
    return { price: priceId, quantity: 1 };
  }

  if (product === "xray") {
    return {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: XRAY_AMOUNT_CENTS,
        product_data: {
          name: "Career X-Ray",
          description: "One-time Career X-Ray for a specific scan",
        },
      },
    };
  }

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: RADAR_AMOUNT_CENTS,
      recurring: { interval: "month" },
      product_data: {
        name: "AI Career Transition",
        description: "10 career scans/month, 10 Career X-Rays/month, weekly milestones",
      },
    },
  };
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer | string) => {
      data += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function requestPath(url: string): string {
  return url.split("?")[0] ?? url;
}

async function getAuth(
  req: IncomingMessage,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ userId: string; token: string } | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { userId: data.user.id, token };
}

async function rpcWithUserJwt(
  supabaseUrl: string,
  supabaseAnonKey: string,
  token: string,
  fn: string,
  args: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `RPC ${fn} failed`);
  }
}

async function patchWithUserJwt(
  supabaseUrl: string,
  supabaseAnonKey: string,
  token: string,
  table: string,
  filter: string,
  patch: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to update ${table}`);
  }
}

export function checkoutDevPlugin(): Plugin {
  return {
    name: "future-trace-checkout-dev",
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, server.config.envDir ?? process.cwd(), "");
      const stripeKey = env.STRIPE_SECRET_KEY?.trim();
      const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
      const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      const xrayPriceId = env.STRIPE_XRAY_PRICE_ID?.trim() || undefined;
      const radarPriceId = env.STRIPE_RADAR_PRICE_ID?.trim() || undefined;

      let stripeClient: Stripe | null = null;
      let stripeInitFailed = false;

      async function getStripe(): Promise<Stripe | null> {
        if (stripeInitFailed || !stripeKey || stripeKey.includes("REPLACE_ME")) return null;
        if (stripeClient) return stripeClient;
        try {
          const { default: StripeClient } = await import("stripe");
          stripeClient = new StripeClient(stripeKey);
          return stripeClient;
        } catch {
          stripeInitFailed = true;
          console.warn(
            "[checkout-dev] stripe package missing — run npm install in web/ and restart the dev server."
          );
          return null;
        }
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        const path = requestPath(req.url);
        if (!path.startsWith("/api/v1/checkout")) return next();

        const stripe = await getStripe();
        if (!stripe || !supabaseUrl || !supabaseAnonKey) {
          sendJson(res, 503, {
            error:
              "Checkout API unavailable. Add STRIPE_SECRET_KEY, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY to web/.env.local.",
          });
          return;
        }

        try {
          const auth = await getAuth(req, supabaseUrl, supabaseAnonKey);
          if (!auth) {
            sendJson(res, 401, { error: "Not authenticated" });
            return;
          }

          if (req.method === "POST" && path === "/api/v1/checkout") {
            const body = await readBody(req);
            const product = String(body.product ?? body.productKey ?? "");
            const returnOrigin = String(body.returnOrigin ?? "http://localhost:5173").replace(/\/$/, "");
            const scanId = body.scanId ? String(body.scanId) : undefined;
            const xrayId = body.xrayId ? String(body.xrayId) : undefined;

            const isXray =
              product === "career_xray_extra" ||
              product === "career_xray_one_time" ||
              product === "xray" ||
              product === "career_xray_snapshot";
            const isTransition =
              product === "transition" ||
              product === "radar" ||
              product === "ai_career_transition_monthly" ||
              product === "ai_career_radar_monthly";

            if (!isXray && !isTransition) {
              sendJson(res, 400, { error: `Unknown product: ${product}` });
              return;
            }

            if (isXray && (!scanId || !xrayId)) {
              sendJson(res, 400, { error: "scanId and xrayId are required for Career X-Ray checkout" });
              return;
            }

            const successPath = isXray ? `/results/${scanId}` : "/checkout/success";
            const successQuery = isXray
              ? "checkout=success&session_id={CHECKOUT_SESSION_ID}"
              : "session_id={CHECKOUT_SESSION_ID}";
            const metadata: Record<string, string> = {
              userId: auth.userId,
              productKey: isXray ? "career_xray_extra" : "ai_career_transition_monthly",
            };
            if (scanId) metadata.scanId = scanId;
            if (xrayId) metadata.xrayId = xrayId;

            const session = await stripe.checkout.sessions.create({
              mode: isTransition ? "subscription" : "payment",
              line_items: [
                checkoutLineItem(isTransition ? "radar" : "xray", isTransition ? radarPriceId : xrayPriceId),
              ],
              success_url: `${returnOrigin}${successPath}?${successQuery}`,
              cancel_url: `${returnOrigin}${successPath}?checkout=cancelled`,
              metadata,
              client_reference_id: auth.userId,
            });

            if (!session.url) {
              sendJson(res, 500, { error: "Stripe did not return a checkout URL" });
              return;
            }

            if (xrayId) {
              await patchWithUserJwt(
                supabaseUrl,
                supabaseAnonKey,
                auth.token,
                "career_xrays",
                `id=eq.${xrayId}`,
                { stripe_checkout_session_id: session.id }
              );
            }

            if (isTransition && session.id) {
              try {
                await rpcWithUserJwt(supabaseUrl, supabaseAnonKey, auth.token, "register_transition_checkout", {
                  p_stripe_session_id: session.id,
                });
              } catch (err) {
                console.warn("[checkout-dev] register_radar_checkout failed:", err);
              }
            }

            sendJson(res, 200, { url: session.url });
            return;
          }

          if (req.method === "POST" && path === "/api/v1/checkout/confirm") {
            const body = await readBody(req);
            const sessionId = String(body.sessionId ?? "").trim();
            if (!sessionId) {
              sendJson(res, 400, { error: "sessionId is required" });
              return;
            }

            const session = await stripe.checkout.sessions.retrieve(sessionId);
            const paid = session.payment_status === "paid" || session.status === "complete";

            if (!paid) {
              sendJson(res, 400, { error: "Payment not completed yet" });
              return;
            }

            const metadata = session.metadata ?? {};
            const productKey = metadata.productKey ?? "";

            if (
              (productKey === "career_xray_extra" || productKey === "career_xray_one_time") &&
              metadata.xrayId
            ) {
              await patchWithUserJwt(
                supabaseUrl,
                supabaseAnonKey,
                auth.token,
                "career_xrays",
                `id=eq.${metadata.xrayId}`,
                {
                  status: "paid",
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id:
                    typeof session.payment_intent === "string" ? session.payment_intent : null,
                }
              );

              sendJson(res, 200, {
                hasRadar: false,
                scanId: metadata.scanId,
                xrayId: metadata.xrayId,
              });
              return;
            }

            if (productKey === "ai_career_transition_monthly" || productKey === "ai_career_radar_monthly") {
              let unlocked = false;

              try {
                await rpcWithUserJwt(supabaseUrl, supabaseAnonKey, auth.token, "fulfill_transition_checkout", {
                  p_stripe_session_id: sessionId,
                });
                unlocked = true;
              } catch (err) {
                console.warn("[checkout-dev] fulfill_radar_checkout failed:", err);
              }

              if (!unlocked && serviceRoleKey) {
                const admin = createClient(supabaseUrl, serviceRoleKey);
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 1);

                const { error: upsertError } = await admin.from("user_entitlements").upsert(
                  {
                    user_id: auth.userId,
                    has_radar: true,
                    subscription_expires_at: expiresAt.toISOString(),
                  },
                  { onConflict: "user_id" }
                );
                unlocked = !upsertError;
              }

              if (!unlocked) {
                sendJson(res, 500, {
                  error:
                    "Payment received but subscription could not be activated. Apply migration 20260609150000_fulfill_radar_checkout_rpc.sql and retry.",
                });
                return;
              }

              sendJson(res, 200, { hasRadar: true });
              return;
            }

            sendJson(res, 400, { error: "Unrecognized checkout session" });
            return;
          }

          sendJson(res, 405, { error: "Method not allowed" });
        } catch (err) {
          sendJson(res, 500, {
            error: err instanceof Error ? err.message : "Checkout failed",
          });
        }
      });
    },
  };
}
