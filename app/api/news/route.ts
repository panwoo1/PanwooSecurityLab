import { NextResponse } from "next/server";
import { getNewsPayload } from "@/lib/news";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(getNewsPayload());
}
