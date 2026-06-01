import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FoulCategory } from "@/lib/types";

interface GoalPayload {
  eventType: "goal";
  teamId: string;
  playerId: string;
  assistedBy?: string;
  period: number;
  gameClockSeconds?: number;
}

interface FoulPayload {
  eventType: "foul";
  teamId: string;
  playerId?: string;
  foulCategory: FoulCategory;
  foulReason?: string;
  penaltySeconds: number;
  period: number;
  gameClockSeconds?: number;
}

interface SimultaneousFoulPayload {
  eventType: "simultaneous_fouls";
  fouls: FoulPayload[];
  period: number;
  gameClockSeconds?: number;
}

type EventPayload = GoalPayload | FoulPayload | SimultaneousFoulPayload;

function validateFoul(f: FoulPayload): string | null {
  if (f.foulCategory === "technical" && f.penaltySeconds !== 30) {
    return "Technical fouls must be 30 seconds";
  }
  if (f.foulCategory === "personal" && ![60, 120, 180].includes(f.penaltySeconds)) {
    return "Personal fouls must be 1, 2, or 3 minutes";
  }
  return null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = (await request.json()) as EventPayload;

  const { data: game } = await supabase
    .from("games")
    .select("id, status, home_team_id, away_team_id")
    .eq("id", gameId)
    .single();

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.status !== "in_progress") {
    return NextResponse.json({ error: "Game is not in progress" }, { status: 400 });
  }

  if (body.eventType === "goal") {
    const { data: event, error } = await supabase
      .from("game_events")
      .insert({
        game_id: gameId,
        team_id: body.teamId,
        player_id: body.playerId,
        event_type: "goal",
        assisted_by: body.assistedBy || null,
        period: body.period,
        game_clock_seconds: body.gameClockSeconds ?? null,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update game score
    const { data: goals } = await supabase
      .from("game_events")
      .select("team_id")
      .eq("game_id", gameId)
      .eq("event_type", "goal");

    if (goals) {
      const homeScore = goals.filter((g) => g.team_id === game.home_team_id).length;
      const awayScore = goals.filter((g) => g.team_id === game.away_team_id).length;
      await supabase.from("games").update({ home_score: homeScore, away_score: awayScore }).eq("id", gameId);
    }

    return NextResponse.json({ eventId: event!.id });
  }

  if (body.eventType === "foul") {
    const err = validateFoul(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const ejected = body.foulCategory === "personal" && body.penaltySeconds === 180;

    const { data: event, error } = await supabase
      .from("game_events")
      .insert({
        game_id: gameId,
        team_id: body.teamId,
        player_id: body.playerId || null,
        event_type: "foul",
        foul_category: body.foulCategory,
        foul_reason: body.foulReason || null,
        penalty_seconds: body.penaltySeconds,
        ejected,
        period: body.period,
        game_clock_seconds: body.gameClockSeconds ?? null,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ eventId: event!.id, ejected });
  }

  if (body.eventType === "simultaneous_fouls") {
    if (!body.fouls?.length || body.fouls.length < 2) {
      return NextResponse.json({ error: "Simultaneous fouls require at least 2 fouls" }, { status: 400 });
    }

    for (const f of body.fouls) {
      const err = validateFoul(f);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    const groupId = crypto.randomUUID();

    const rows = body.fouls.map((f) => ({
      game_id: gameId,
      team_id: f.teamId,
      player_id: f.playerId || null,
      event_type: "foul" as const,
      foul_category: f.foulCategory,
      foul_reason: f.foulReason || null,
      penalty_seconds: f.penaltySeconds,
      ejected: f.foulCategory === "personal" && f.penaltySeconds === 180,
      simultaneous_group_id: groupId,
      period: body.period,
      game_clock_seconds: body.gameClockSeconds ?? null,
    }));

    const { data: events, error } = await supabase
      .from("game_events")
      .insert(rows)
      .select("id, ejected");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ simultaneousGroupId: groupId, events });
  }

  return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
}
