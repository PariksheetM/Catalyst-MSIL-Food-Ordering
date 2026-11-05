import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkAdmin, parseRecord } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Update a record (admin only).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = checkAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id === null) {
    return NextResponse.json({ error: "Invalid record id." }, { status: 400 });
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
      .update(parsed.value)
      .eq("id", id);
    if (error) {
      console.error("Update failed:", error.message);
      return NextResponse.json(
        { error: "Could not update the record." },
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

// Delete a record (admin only).
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = checkAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id === null) {
    return NextResponse.json({ error: "Invalid record id." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("paratha_records")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Delete failed:", error.message);
      return NextResponse.json(
        { error: "Could not delete the record." },
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
