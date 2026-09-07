import { NextRequest, NextResponse } from "next/server";
import { getBackendOrigin } from "@/lib/backend-origin";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const response = await fetch(`${getBackendOrigin()}/api/v1/analytics/me`, {
    method: "GET",
    headers: authorization ? { Authorization: authorization } : {},
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  return NextResponse.json(payload, { status: response.status });
}
