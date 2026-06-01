"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Season, Competition } from "@/lib/types";

export default function SeasonsPage() {
  const supabase = createClient();
  const [seasons, setSeasons] = useState<(Season & { competition: Competition })[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [form, setForm] = useState({ competitionId: "", name: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: s } = await supabase.from("seasons").select("*, competition:competitions!inner(*)").order("start_date", { ascending: false });
    const { data: c } = await supabase.from("competitions").select("*").order("sort_order");
    if (s) setSeasons(s as (Season & { competition: Competition })[]);
    if (c) setCompetitions(c);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("seasons").insert({
      competition_id: form.competitionId,
      name: form.name,
      start_date: form.startDate,
      end_date: form.endDate,
    });
    if (error) setError(error.message);
    else { setForm({ competitionId: "", name: "", startDate: "", endDate: "" }); load(); }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("seasons").update({ is_active: !current }).eq("id", id);
    load();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Seasons</h1>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Add Season</h2>
        <div className="grid grid-cols-2 gap-3">
          <select required value={form.competitionId} onChange={(e) => setForm({ ...form, competitionId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Competition...</option>
            {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required placeholder="Season name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border rounded px-3 py-2" />
          <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Season</button>
      </form>

      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="p-2">Season</th><th className="p-2">Competition</th><th className="p-2">Dates</th><th className="p-2">Active</th></tr></thead>
        <tbody>
          {seasons.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.competition.name}</td>
              <td className="p-2 text-sm">{s.start_date} → {s.end_date}</td>
              <td className="p-2">
                <button onClick={() => toggleActive(s.id, s.is_active)} className={`px-2 py-1 rounded text-xs ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
