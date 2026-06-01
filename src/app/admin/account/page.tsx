"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setCurrentEmail(user.email);
        setEmail(user.email);
      }
    });
  }, []);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (email === currentEmail) return setError("That's already your email");

    const { error } = await supabase.auth.updateUser({ email });
    if (error) setError(error.message);
    else setMessage("Confirmation email sent to your new address. Check your inbox.");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords don't match");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setMessage("Password updated successfully");
      setPassword("");
      setConfirmPassword("");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      {message && <p className="mb-4 p-3 bg-green-50 text-green-700 rounded">{message}</p>}
      {error && <p className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</p>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Change Email</h2>
        <form onSubmit={handleEmailChange} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="New email address"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Update Email
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="New password (min 8 characters)"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Confirm new password"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Update Password
          </button>
        </form>
      </section>

      <section>
        <button onClick={handleSignOut} className="text-red-600 hover:underline">
          Sign out
        </button>
      </section>
    </main>
  );
}
