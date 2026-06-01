import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFixtures, type FixtureConfig } from "@/lib/fixtures";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { seasonId, divisionId, totalRounds, competitionByeRounds = [], teamByes = [] } = body as {
    seasonId: string;
    divisionId: string;
    totalRounds: number;
    competitionByeRounds?: number[];
    teamByes?: { teamId: string; round: number }[];
  };

  if (!seasonId || !divisionId || !totalRounds) {
    return NextResponse.json({ error: "seasonId, divisionId, and totalRounds are required" }, { status: 400 });
  }

  // Fetch teams in this division
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id")
    .eq("division_id", divisionId);

  if (error || !teams?.length) {
    return NextResponse.json({ error: "No teams found for this division" }, { status: 400 });
  }

  const config: FixtureConfig = {
    teamIds: teams.map((t) => t.id),
    totalRounds,
    competitionByeRounds,
    teamByes,
  };

  const result = generateFixtures(config);

  return NextResponse.json({
    draft: true,
    seasonId,
    divisionId,
    totalRounds,
    fixtures: result.fixtures,
    teamByes: result.teamByes,
    competitionByeRounds: result.competitionByeRounds,
  });
}
