import { NextResponse } from "next/server";
import { mapBrandFromUrls } from "@/lib/agents/brand/map-from-url";
import { agentErrorResponse } from "@/lib/agent-route";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array required" },
        { status: 400 },
      );
    }

    const filtered = urls
      .map((u: unknown) => (typeof u === "string" ? u.trim() : ""))
      .filter((u): u is string => u.length > 0);

    if (filtered.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one valid URL" },
        { status: 400 },
      );
    }

    const result = await mapBrandFromUrls(filtered);
    return NextResponse.json({ ok: true, brand: result });
  } catch (err) {
    return agentErrorResponse("map-brand", err);
  }
}
