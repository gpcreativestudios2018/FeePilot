// src/app/api/debug/env/route.ts
export async function GET() {
  return Response.json({
    NEXT_PUBLIC_REQUIRE_PRO: process.env.NEXT_PUBLIC_REQUIRE_PRO ?? null,
    // sanity: return a timestamp so we know we hit prod fresh
    now: new Date().toISOString(),
  });
}
