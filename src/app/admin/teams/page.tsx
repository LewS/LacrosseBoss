"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team, Division } from "@/lib/types";

export default function TeamsPage() {
  const supabase = createClient();
  const [teams, setTeams] = useState<(Team & { division: Division })[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [color, setColor] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: t } = await supabase.from("teams").select("*, division:divisions!inner(*)").order("name");
    const { data: d } = await supabase.from("divisions").select("*").order("sort_order");
    if (t) setTeams(t as (Team & { division: Division })[]);
    if (d) { setDivisions(d); if (!divisionId && d.length) setDivisionId(d[0].id); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("teams").insert({ name, short_name: shortName, division_id: divisionId, color: color || null });
    if (error) setError(error.message);
    else { setName(""); setShortName(""); setColor(""); load(); }
  }

  async function handleDelete(id: string) {
    await supabase.from("teams").delete().eq("id", id);
    load();
  }

  async function handleSave(id: string) {
    await supabase.from("teams").update({ name: editName }).eq("id", id);
    setEditing(null);
    load();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Teams</h1>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Add Team</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Short name (3-4 chars)" value={shortName} onChange={(e) => setShortName(e.target.value)} className="border rounded px-3 py-2" />
          <select required value={divisionId} onChange={(e) => setDivisionId(e.target.value)} className="border rounded px-3 py-2">
            {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input placeholder="Color (#hex)" value={color} onChange={(e) => setColor(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </form>

      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="p-2">Team</th><th className="p-2">Short</th><th className="p-2">Division</th><th className="p-2"></th></tr></thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">
                {editing === t.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave(t.id)} className="border rounded px-2 py-1 w-full" autoFocus />
                ) : (
                  <span onDoubleClick={() => { setEditing(t.id); setEditName(t.name); }} className="cursor-pointer">{t.name}</span>
                )}
              </td>
              <td className="p-2">{t.short_name}</td>
              <td className="p-2">{t.division.name}</td>
              <td className="p-2 flex gap-2">
                {editing === t.id ? (
                  <>
                    <button onClick={() => handleSave(t.id)} className="text-green-600 text-sm hover:underline">Save</button>
                    <button onClick={() => setEditing(null)} className="text-gray-500 text-sm hover:underline">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditing(t.id); setEditName(t.name); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
