"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Competition } from "@/lib/types";

export default function CompetitionsPage() {
  const supabase = createClient();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("competitions").select("*").order("sort_order");
    if (data) setCompetitions(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("competitions").insert({ name: form.name, description: form.description || null });
    if (error) setError(error.message);
    else { setForm({ name: "", description: "" }); load(); }
  }

  async function handleSave(id: string) {
    await supabase.from("competitions").update({ name: editName }).eq("id", id);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("competitions").delete().eq("id", id);
    load();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Competitions</h1>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Add Competition</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </form>

      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="p-2">Name</th><th className="p-2">Description</th><th className="p-2"></th></tr></thead>
        <tbody>
          {competitions.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">
                {editing === c.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave(c.id)} className="border rounded px-2 py-1 w-full" autoFocus />
                ) : (
                  <span onDoubleClick={() => { setEditing(c.id); setEditName(c.name); }} className="cursor-pointer">{c.name}</span>
                )}
              </td>
              <td className="p-2 text-sm text-gray-600">{c.description || "—"}</td>
              <td className="p-2 flex gap-2">
                {editing === c.id ? (
                  <>
                    <button onClick={() => handleSave(c.id)} className="text-green-600 text-sm hover:underline">Save</button>
                    <button onClick={() => setEditing(null)} className="text-gray-500 text-sm hover:underline">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditing(c.id); setEditName(c.name); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm hover:underline">Delete</button>
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
