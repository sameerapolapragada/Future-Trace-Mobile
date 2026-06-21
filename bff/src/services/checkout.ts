import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env.ts";
import {
  restPatchWithUserJwt,
  rpcWithUserJwt,
  serviceRoleClient,
  supabaseConfig,
} from "../lib/supabaseRest.ts";

const XRAY_AMOUNT_CENTS = 199;
const RADAR_AMOUNT_CENTS = 999;

function checkoutLineItem(
  product: "xray" | "radar",
  priceId?: string
): Stripe.Checkout.SessionCreateParams.LineItem {
  if (priceId) return { price: priceId, quantity: 1 };

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

function getStripe(): Stripe {
  const key = env("STRIPE_SECRET_KEY");
  if (!key || key.includes("REPLACE_ME")) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function createCheckoutSession(
  token: string,
  userId: string,
  body: Record<string, unknown>
): Promise<{ url: string }> {
  const stripe = getStripe();
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

  if (!isXray && !isTransition) throw new Error(`Unknown product: ${product}`);
  if (isXray && (!scanId || !xrayId)) {
    throw new Error("scanId and xrayId are required for Career X-Ray checkout");
  }

  const xrayPriceId = env("STRIPE_XRAY_PRICE_ID");
  const radarPriceId = env("STRIPE_RADAR_PRICE_ID");
  const successPath = isXray ? `/results/${scanId}` : "/checkout/success";
  const successQuery = isXray
    ? "checkout=success&session_id={CHECKOUT_SESSION_ID}"
    : "session_id={CHECKOUT_SESSION_ID}";

  const metadata: Record<string, string> = {
    userId,
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
    client_reference_id: userId,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");

  if (xrayId) {
    await restPatchWithUserJwt(token, "career_xrays", `id=eq.${xrayId}`, {
      stripe_checkout_session_id: session.id,
    });
  }

  if (isTransition && session.id) {
    try {
      await rpcWithUserJwt(token, "register_transition_checkout", {
        p_stripe_session_id: session.id,
      });
    } catch (err) {
      console.warn("[bff] register_transition_checkout failed:", err);
    }
  }

  return { url: session.url };
}

export async function confirmCheckoutSession(
  token: string,
  userId: string,
  sessionId: string
): Promise<Record<string, unknown>> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) throw new Error("Payment not completed yet");

  const metadata = session.metadata ?? {};
  const productKey = metadata.productKey ?? "";

  if (
    (productKey === "career_xray_extra" || productKey === "career_xray_one_time") &&
    metadata.xrayId
  ) {
    await restPatchWithUserJwt(token, "career_xrays", `id=eq.${metadata.xrayId}`, {
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    });

    return { hasRadar: false, scanId: metadata.scanId, xrayId: metadata.xrayId };
  }

  if (productKey === "ai_career_transition_monthly" || productKey === "ai_career_radar_monthly") {
    try {
      await rpcWithUserJwt(token, "fulfill_transition_checkout", {
        p_stripe_session_id: sessionId,
      });
      return { hasRadar: true };
    } catch (err) {
      console.warn("[bff] fulfill_transition_checkout failed:", err);
    }

    const config = supabaseConfig();
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    if (config && serviceKey) {
      const admin = createClient(config.url, serviceKey);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      const { error } = await admin.from("user_entitlements").upsert(
        {
          user_id: userId,
          has_radar: true,
          subscription_expires_at: expiresAt.toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (!error) return { hasRadar: true };
    }

    throw new Error("Payment received but subscription could not be activated.");
  }

  throw new Error("Unrecognized checkout session");
}

export async function handleStripeWebhook(rawBody: string, signature: string | undefined) {
  const stripe = getStripe();
  const webhookSecret = env("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  if (!signature) throw new Error("Missing Stripe-Signature header");

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  const admin = serviceRoleClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const userId = metadata.userId ?? session.client_reference_id;
    if (!userId) return { received: true };

    if (
      (metadata.productKey === "career_xray_extra" || metadata.productKey === "career_xray_one_time") &&
      metadata.xrayId
    ) {
      await admin
        .from("career_xrays")
        .update({
          status: "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", metadata.xrayId)
        .eq("user_id", userId);
    }

    if (
      metadata.productKey === "ai_career_transition_monthly" ||
      metadata.productKey === "ai_career_radar_monthly"
    ) {
      try {
        await admin.rpc("fulfill_transition_checkout", { p_stripe_session_id: session.id });
      } catch {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await admin.from("user_entitlements").upsert(
          {
            user_id: userId,
            has_radar: true,
            subscription_expires_at: expiresAt.toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    }
  }

  return { received: true, type: event.type };
}
