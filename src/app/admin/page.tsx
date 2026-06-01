import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>
      <p className="text-gray-600">Signed in as {user.email}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href="/admin/teams" className="border rounded-lg p-4 hover:bg-gray-50">Manage Teams</a>
        <a href="/admin/games" className="border rounded-lg p-4 hover:bg-gray-50">Manage Games</a>
        <a href="/admin/seasons" className="border rounded-lg p-4 hover:bg-gray-50">Manage Seasons</a>
        <a href="/admin/account" className="border rounded-lg p-4 hover:bg-gray-50">Account Settings</a>
      </div>
    </main>
  );
}
