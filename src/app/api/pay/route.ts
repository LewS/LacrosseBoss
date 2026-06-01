import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { charge } from "@/lib/payment-gateway";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { registrationId } = await request.json();
  if (!registrationId) return NextResponse.json({ error: "registrationId required" }, { status: 400 });

  // Fetch registration and verify ownership
  const { data: reg } = await supabase
    .from("registrations")
    .select("id, fee_cents, status, player:players!inner(user_id)")
    .eq("id", registrationId)
    .single();

  if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  const player = reg.player as unknown as { user_id: string };
  if (player.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (reg.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  // Process payment via faux gateway
  const result = await charge({ amountCents: reg.fee_cents, description: `Registration ${reg.id}` });

  // Record payment
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      registration_id: reg.id,
      amount_cents: reg.fee_cents,
      gateway_ref: result.gatewayRef,
      status: result.status,
      paid_at: result.success ? new Date().toISOString() : null,
    })
    .select("id, status, gateway_ref")
    .single();

  // Update registration status if payment succeeded
  if (result.success) {
    await supabase.from("registrations").update({ status: "paid" }).eq("id", reg.id);
  }

  return NextResponse.json({ payment, gateway: { success: result.success, message: result.message } });
}
