import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mt-12 mb-4">🥍 LacrosseBoss</h1>
      <p className="text-lg text-gray-600 mb-8">Schedules, scores, and standings</p>
      <nav className="flex justify-center gap-4">
        <Link href="/schedule" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Schedule</Link>
        <Link href="/standings" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Standings</Link>
        <Link href="/scoring" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Live Scores</Link>
      </nav>
    </main>
  );
}
