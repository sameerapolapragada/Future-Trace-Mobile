/**
 * Copy into Future-Trace BFF (Next.js middleware or route handlers).
 * Production: allow only the deployed PWA origin(s), not "*".
 */
export const BFF_ALLOWED_ORIGINS = [
  "https://app.futuretrace.com",
  // "https://staging-app.futuretrace.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:5173"] : []),
];

export function applyBffCors(request: Request, response: Response): Response {
  const origin = request.headers.get("Origin");
  if (!origin || !BFF_ALLOWED_ORIGINS.includes(origin)) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  return response;
}

export function bffPreflightResponse(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;

  const origin = request.headers.get("Origin");
  if (!origin || !BFF_ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
