import { NextRequest, NextResponse } from "next/server";
import { getBackendOrigin } from "@/lib/backend-origin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${getBackendOrigin()}/api/v1/analytics/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  return NextResponse.json(payload, { status: response.status });
}
