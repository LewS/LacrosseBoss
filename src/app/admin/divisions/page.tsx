"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Division } from "@/lib/types";

export default function DivisionsPage() {
  const supabase = createClient();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [form, setForm] = useState({ name: "", ageBracket: "", gender: "mens" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("divisions").select("*").order("sort_order");
    if (data) setDivisions(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("divisions").insert({ name: form.name, age_bracket: form.ageBracket, gender: form.gender });
    if (error) setError(error.message);
    else { setForm({ name: "", ageBracket: "", gender: "mens" }); load(); }
  }

  async function handleDelete(id: string) {
    await supabase.from("divisions").delete().eq("id", id);
    load();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Divisions</h1>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Add Division</h2>
        <div className="grid grid-cols-3 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input required placeholder="Age bracket" value={form.ageBracket} onChange={(e) => setForm({ ...form, ageBracket: e.target.value })} className="border rounded px-3 py-2" />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border rounded px-3 py-2">
            <option value="mens">Mens</option>
            <option value="womens">Womens</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </form>

      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="p-2">Name</th><th className="p-2">Age</th><th className="p-2">Gender</th><th className="p-2"></th></tr></thead>
        <tbody>
          {divisions.map((d) => (
            <tr key={d.id} className="border-b">
              <td className="p-2">{d.name}</td>
              <td className="p-2">{d.age_bracket}</td>
              <td className="p-2">{d.gender}</td>
              <td className="p-2"><button onClick={() => handleDelete(d.id)} className="text-red-600 text-sm hover:underline">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
