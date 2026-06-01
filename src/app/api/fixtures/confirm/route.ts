import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GeneratedFixture, GeneratedBye } from "@/lib/fixtures";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    seasonId,
    divisionId,
    fixtures,
    teamByes,
    competitionByeRounds,
    startDate,
    dayOfWeek = 6, // Saturday
    timeOfDay = "10:00",
  } = body as {
    seasonId: string;
    divisionId: string;
    fixtures: GeneratedFixture[];
    teamByes: GeneratedBye[];
    competitionByeRounds: number[];
    startDate: string; // ISO date e.g. "2026-04-04"
    dayOfWeek?: number; // 0=Sun, 6=Sat
    timeOfDay?: string; // "HH:MM"
  };

  if (!seasonId || !divisionId || !fixtures?.length || !startDate) {
    return NextResponse.json({ error: "seasonId, divisionId, fixtures, and startDate are required" }, { status: 400 });
  }

  // Calculate scheduled_at for each round based on startDate + week offset
  function getDateForRound(round: number): string {
    const start = new Date(startDate + "T" + timeOfDay + ":00");
    // Adjust to the correct day of week
    const diff = (dayOfWeek - start.getDay() + 7) % 7;
    start.setDate(start.getDate() + diff + (round - 1) * 7);
    return start.toISOString();
  }

  // Insert games
  const games = fixtures.map((f) => ({
    season_id: seasonId,
    division_id: divisionId,
    home_team_id: f.homeTeamId,
    away_team_id: f.awayTeamId,
    round: f.round,
    scheduled_at: getDateForRound(f.round),
    status: "scheduled",
  }));

  const { error: gamesError } = await supabase.from("games").insert(games);
  if (gamesError) return NextResponse.json({ error: gamesError.message }, { status: 500 });

  // Insert team byes
  if (teamByes?.length) {
    const byes = teamByes.map((b) => ({
      season_id: seasonId,
      division_id: divisionId,
      team_id: b.teamId,
      round: b.round,
    }));
    await supabase.from("team_byes").insert(byes);
  }

  // Insert competition bye weeks
  if (competitionByeRounds?.length) {
    const byeWeeks = competitionByeRounds.map((round) => ({
      season_id: seasonId,
      division_id: divisionId,
      round,
      reason: "Scheduled bye",
    }));
    await supabase.from("bye_weeks").insert(byeWeeks);
  }

  return NextResponse.json({ success: true, gamesCreated: games.length });
}
