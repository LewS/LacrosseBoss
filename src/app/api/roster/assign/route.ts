import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LOCKOUT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId, teamId, playerIds } = await request.json() as {
    gameId: string;
    teamId: string;
    playerIds: string[];
  };

  if (!gameId || !teamId || !playerIds?.length) {
    return NextResponse.json({ error: "gameId, teamId, and playerIds required" }, { status: 400 });
  }

  // Verify user is a club official for this team's club
  const { data: team } = await supabase
    .from("teams")
    .select("id, club_id")
    .eq("id", teamId)
    .single();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const { data: official } = await supabase
    .from("club_officials")
    .select("id")
    .eq("user_id", user.id)
    .eq("club_id", team.club_id)
    .single();

  if (!official) return NextResponse.json({ error: "Not authorized as club official" }, { status: 403 });

  // Check game exists and enforce 2-day lockout
  const { data: game } = await supabase
    .from("games")
    .select("id, scheduled_at")
    .eq("id", gameId)
    .single();

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const gameTime = new Date(game.scheduled_at).getTime();
  const now = Date.now();

  if (gameTime - now < LOCKOUT_MS) {
    return NextResponse.json({ error: "Roster locked — must be assigned at least 2 days before game" }, { status: 403 });
  }

  // Verify all players have paid registrations for this season/division
  const { data: gameDetails } = await supabase
    .from("games")
    .select("season_id, division_id")
    .eq("id", gameId)
    .single();

  const { data: validPlayers } = await supabase
    .from("registrations")
    .select("player_id")
    .eq("season_id", gameDetails!.season_id)
    .eq("division_id", gameDetails!.division_id)
    .eq("status", "paid")
    .in("player_id", playerIds);

  const validIds = new Set((validPlayers ?? []).map((r) => r.player_id));
  const invalid = playerIds.filter((id) => !validIds.has(id));

  if (invalid.length) {
    return NextResponse.json({ error: "Players without paid registration", invalidPlayerIds: invalid }, { status: 400 });
  }

  // Upsert roster assignments
  const rows = playerIds.map((playerId) => ({
    game_id: gameId,
    team_id: teamId,
    player_id: playerId,
    assigned_by: user.id,
  }));

  const { error } = await supabase.from("game_rosters").upsert(rows, { onConflict: "game_id,team_id,player_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, assigned: playerIds.length });
}
