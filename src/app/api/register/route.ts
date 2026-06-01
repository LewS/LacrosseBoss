import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clubId, firstName, lastName, dateOfBirth, seasonId, divisionId, feeCents } = await request.json();

  if (!clubId || !firstName || !lastName || !seasonId || !divisionId) {
    return NextResponse.json({ error: "clubId, firstName, lastName, seasonId, divisionId required" }, { status: 400 });
  }

  // Upsert player profile
  const { data: player, error: playerErr } = await supabase
    .from("players")
    .upsert({ user_id: user.id, club_id: clubId, first_name: firstName, last_name: lastName, date_of_birth: dateOfBirth || null }, { onConflict: "user_id,club_id" })
    .select("id")
    .single();

  if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 });

  // Create registration
  const { data: registration, error: regErr } = await supabase
    .from("registrations")
    .insert({ player_id: player.id, season_id: seasonId, division_id: divisionId, fee_cents: feeCents || 0 })
    .select("id, status, fee_cents")
    .single();

  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 });

  return NextResponse.json({ playerId: player.id, registration });
}
