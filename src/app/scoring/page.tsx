"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Game, Team, GameEvent } from "@/lib/types";

type LiveGame = Game & { home_team: Team; away_team: Team };

export default function ScoringPage() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [events, setEvents] = useState<Record<string, GameEvent[]>>({});

  useEffect(() => {
    const supabase = createClient();

    async function loadEvents(gameId: string) {
      const { data } = await supabase
        .from("game_events")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });
      if (data) setEvents((prev) => ({ ...prev, [gameId]: data }));
    }

    supabase
      .from("games")
      .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
      .eq("status", "in_progress")
      .then(({ data }) => {
        if (data) {
          setGames(data as LiveGame[]);
          data.forEach((g) => loadEvents(g.id));
        }
      });

    const channel = supabase
      .channel("live-scores")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games" }, (payload) => {
        setGames((prev) =>
          prev.map((g) => (g.id === payload.new.id ? { ...g, ...payload.new } : g))
        );
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_events" }, (payload) => {
        const evt = payload.new as GameEvent;
        setEvents((prev) => ({ ...prev, [evt.game_id]: [...(prev[evt.game_id] || []), evt] }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function formatEvent(evt: GameEvent, game: LiveGame) {
    const team = evt.team_id === game.home_team.id ? game.home_team.short_name : game.away_team.short_name;
    if (evt.event_type === "goal") {
      const assist = evt.assisted_by ? " (assisted)" : "";
      return `⚽ ${team} GOAL${assist}`;
    }
    const category = evt.foul_category === "technical" ? "TECH" : "PERSONAL";
    const reason = evt.foul_reason ? ` — ${evt.foul_reason}` : "";
    const time = evt.penalty_seconds ? ` ${evt.penalty_seconds}s` : "";
    const ejection = evt.ejected ? " 🔴 EJECTED" : "";
    const simul = evt.simultaneous_group_id ? " [SIMUL]" : "";
    return `🟨 ${team} ${category}${time}${reason}${ejection}${simul}`;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Live Scores</h1>
      {games.length ? (
        <div className="space-y-6">
          {games.map((game) => (
            <div key={game.id} className="border rounded-lg p-6">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {game.away_team.short_name} <span className="text-2xl mx-4">{game.away_score} - {game.home_score}</span> {game.home_team.short_name}
                </div>
                <div className="text-sm text-gray-500 mt-1">Period {game.period}</div>
              </div>
              {events[game.id]?.length ? (
                <div className="mt-4 border-t pt-3 space-y-1 text-sm max-h-60 overflow-y-auto">
                  {events[game.id].map((evt) => (
                    <div key={evt.id} className="flex justify-between">
                      <span>{formatEvent(evt, game)}</span>
                      <span className="text-gray-400">P{evt.period}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No games in progress.</p>
      )}
    </main>
  );
}
