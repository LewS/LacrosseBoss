"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Game, Team, Season, Division } from "@/lib/types";

type GameWithTeams = Game & { home_team: Team; away_team: Team };

export default function GamesPage() {
  const supabase = createClient();
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [form, setForm] = useState({ seasonId: "", divisionId: "", homeTeamId: "", awayTeamId: "", scheduledAt: "", location: "" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: g } = await supabase.from("games").select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)").order("scheduled_at", { ascending: false }).limit(50);
    const { data: t } = await supabase.from("teams").select("*").order("name");
    const { data: s } = await supabase.from("seasons").select("*").order("start_date", { ascending: false });
    const { data: d } = await supabase.from("divisions").select("*").order("sort_order");
    if (g) setGames(g as GameWithTeams[]);
    if (t) setTeams(t);
    if (s) setSeasons(s);
    if (d) setDivisions(d);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("games").insert({
      season_id: form.seasonId,
      division_id: form.divisionId,
      home_team_id: form.homeTeamId,
      away_team_id: form.awayTeamId,
      scheduled_at: form.scheduledAt,
      location: form.location || null,
    });
    if (error) setError(error.message);
    else { setForm({ seasonId: "", divisionId: "", homeTeamId: "", awayTeamId: "", scheduledAt: "", location: "" }); load(); }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Games</h1>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Add Game</h2>
        <div className="grid grid-cols-2 gap-3">
          <select required value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Season...</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select required value={form.divisionId} onChange={(e) => setForm({ ...form, divisionId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Division...</option>
            {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select required value={form.homeTeamId} onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Home team...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select required value={form.awayTeamId} onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Away team...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Game</button>
      </form>

      <div className="space-y-2">
        {games.map((g) => (
          <div key={g.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <span className="font-semibold">{g.away_team.short_name} @ {g.home_team.short_name}</span>
              {g.status === "final" && <span className="ml-2 text-gray-500">({g.away_score}-{g.home_score})</span>}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(g.scheduled_at).toLocaleDateString()} · <span className="capitalize">{g.status}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
