"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateStoreForm() {
  const [name, setName] = useState("");
  const [punches, setPunches] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your store name");
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("stores").insert({
      owner_id: user.id,
      name: name.trim(),
      punches_for_reward: punches,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white border border-line rounded-xl p-6">
        <h1 className="font-display text-xl mb-1">Set up your store</h1>
        <p className="text-muted text-xs mb-6">One-time setup — takes 10 seconds.</p>

        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted mb-4">
          Store name
          <input
            className="border border-line rounded-lg px-3 py-2 text-sm font-mono bg-paper text-ink normal-case font-normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Keyport Deli"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted mb-6">
          Punches for a free reward
          <input
            type="number"
            min={1}
            max={20}
            className="border border-line rounded-lg px-3 py-2 text-sm font-mono bg-paper text-ink normal-case font-normal"
            value={punches}
            onChange={(e) => setPunches(parseInt(e.target.value) || 8)}
          />
        </label>

        {error && <p className="text-stamp text-xs mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper font-bold text-sm rounded-lg py-3 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create store"}
        </button>
      </form>
    </main>
  );
}
