import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkAdmin, parseRecord } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List all records (admin only).
export async function GET(req: Request) {
  const auth = checkAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("paratha_records")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Select failed:", error.message);
      return NextResponse.json(
        { error: "Could not load records." },
        { status: 500 }
      );
    }
    return NextResponse.json({ records: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 500 }
    );
  }
}

// Create a record (admin only).
export async function POST(req: Request) {
  const auth = checkAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseRecord(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("paratha_records")
      .insert(parsed.value);
    if (error) {
      console.error("Insert failed:", error.message);
      return NextResponse.json(
        { error: "Could not create the record." },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
