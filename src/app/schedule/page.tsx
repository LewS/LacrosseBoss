import { createClient } from "@/lib/supabase/server";
import type { Game, Team } from "@/lib/types";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
    .order("scheduled_at", { ascending: true });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Schedule</h1>
      {games?.length ? (
        <div className="space-y-4">
          {games.map((game: Game & { home_team: Team; away_team: Team }) => (
            <div key={game.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <span className="font-semibold">{game.away_team.short_name}</span>
                {" @ "}
                <span className="font-semibold">{game.home_team.short_name}</span>
              </div>
              <div className="text-right">
                {game.status === "final" ? (
                  <span>{game.away_score} - {game.home_score} (Final)</span>
                ) : game.status === "in_progress" ? (
                  <span className="text-green-600 font-bold">{game.away_score} - {game.home_score} (Live)</span>
                ) : (
                  <span className="text-gray-500">
                    {new Date(game.scheduled_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No games scheduled yet.</p>
      )}
    </main>
  );
}
