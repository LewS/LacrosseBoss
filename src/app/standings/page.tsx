import { createClient } from "@/lib/supabase/server";
import type { Standing } from "@/lib/types";

export default async function StandingsPage() {
  const supabase = await createClient();
  const { data: standings } = await supabase
    .from("standings")
    .select("*")
    .order("points", { ascending: false });

  const byDivision = (standings ?? []).reduce<Record<string, Standing[]>>((acc, s: Standing) => {
    (acc[s.division_name] ??= []).push(s);
    return acc;
  }, {});

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Standings</h1>
      {Object.keys(byDivision).length ? (
        Object.entries(byDivision).map(([division, teams]) => (
          <section key={division} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{division}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Team</th>
                  <th className="p-2">W</th>
                  <th className="p-2">L</th>
                  <th className="p-2">T</th>
                  <th className="p-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((s) => (
                  <tr key={s.team_id} className="border-b">
                    <td className="p-2 font-semibold">{s.team_name}</td>
                    <td className="p-2">{s.wins}</td>
                    <td className="p-2">{s.losses}</td>
                    <td className="p-2">{s.ties}</td>
                    <td className="p-2 font-bold">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      ) : (
        <p className="text-gray-500">No standings data yet.</p>
      )}
    </main>
  );
}
