"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Club } from "@/lib/types";

export default function ClubsPage() {
  const supabase = createClient();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("clubs").select("*").order("name");
    if (data) setClubs(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("clubs").insert({ name });
    if (error) setError(error.message);
    else { setName(""); load(); }
  }

  async function handleDelete(id: string) {
    await supabase.from("clubs").delete().eq("id", id);
    load();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Clubs</h1>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Add Club</h2>
        <div className="flex gap-3">
          <input required placeholder="Club name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2 flex-1" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="p-2">Name</th><th className="p-2"></th></tr></thead>
        <tbody>
          {clubs.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.name}</td>
              <td className="p-2"><button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm hover:underline">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
