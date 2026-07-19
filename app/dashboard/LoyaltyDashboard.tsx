"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Gift, Cake, X, Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Store = { id: string; name: string; punches_for_reward: number };
type Customer = {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  birthday: string | null;
  punches: number;
  rewards_earned: number;
  last_visit: string;
};

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "").slice(-10);
}
function formatPhone(digits: string) {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
function monthDay(dateStr: string | null) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${m}-${d}`;
}

export default function LoyaltyDashboard({ store }: { store: Store }) {
  const supabase = createClient();
  const router = useRouter();
  const PUNCHES_FOR_REWARD = store.punches_for_reward;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBirthday, setNewBirthday] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const loadCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", store.id)
      .order("last_visit", { ascending: false });
    if (!error && data) setCustomers(data as Customer[]);
    setLoading(false);
  }, [supabase, store.id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const q = query.trim().toLowerCase();
  const qDigits = normalizePhone(query);
  const filtered = q
    ? customers.filter(
        (c) => c.name.toLowerCase().includes(q) || (qDigits.length >= 3 && c.phone.includes(qDigits))
      )
    : customers;

  const todayMD = new Date().toISOString().slice(5, 10);
  const active = selectedId ? customers.find((c) => c.id === selectedId) ?? null : null;

  async function addPunch(c: Customer) {
    setBusy(true);
    const punches = c.punches + 1;
    const willReward = punches >= PUNCHES_FOR_REWARD;
    const nextPunches = willReward ? punches - PUNCHES_FOR_REWARD : punches;
    const nextRewards = willReward ? c.rewards_earned + 1 : c.rewards_earned;

    const { error } = await supabase
      .from("customers")
      .update({ punches: nextPunches, rewards_earned: nextRewards, last_visit: new Date().toISOString() })
      .eq("id", c.id);

    if (!error) {
      showToast(willReward ? `🎉 ${c.name} earned a free reward!` : `Punch added — ${punches}/${PUNCHES_FOR_REWARD}`);
      await loadCustomers();
    } else {
      showToast("Couldn't save — try again");
    }
    setBusy(false);
  }

  async function redeemReward(c: Customer) {
    if (c.rewards_earned <= 0) return;
    setBusy(true);
    const { error } = await supabase
      .from("customers")
      .update({ rewards_earned: c.rewards_earned - 1, last_visit: new Date().toISOString() })
      .eq("id", c.id);
    if (!error) {
      showToast(`Reward redeemed for ${c.name}`);
      await loadCustomers();
    }
    setBusy(false);
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    const digits = normalizePhone(newPhone);
    if (!newName.trim() || digits.length !== 10) {
      showToast("Enter a name and 10-digit phone number");
      return;
    }
    const existing = customers.find((c) => c.phone === digits);
    if (existing) {
      showToast("That phone number is already on file");
      setSelectedId(existing.id);
      setShowNewForm(false);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({
        store_id: store.id,
        name: newName.trim(),
        phone: digits,
        birthday: newBirthday || null,
      })
      .select()
      .single();

    setBusy(false);
    if (error) {
      showToast("Couldn't add customer — try again");
      return;
    }
    setNewName("");
    setNewPhone("");
    setNewBirthday("");
    setShowNewForm(false);
    showToast(`${data.name} added`);
    await loadCustomers();
    setSelectedId(data.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-10">
      <header className="bg-ink px-4 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-stamp text-stamp flex items-center justify-center flex-shrink-0">★</div>
            <div>
              <h1 className="font-display text-xl text-paper tracking-wide">{store.name}</h1>
              <p className="text-xs text-muted">counter loyalty</p>
            </div>
          </div>
          <button onClick={signOut} className="text-muted hover:text-paper" aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {!active && (
          <>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white border border-line rounded-lg px-3 py-2">
                <Search size={18} className="text-muted flex-shrink-0" />
                <input
                  className="flex-1 outline-none text-sm bg-transparent"
                  placeholder="Search name or phone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search" className="text-muted">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowNewForm((s) => !s)}
                className="flex items-center gap-1.5 bg-stamp text-paper font-bold text-sm rounded-lg px-4"
              >
                <Plus size={18} /> New
              </button>
            </div>

            {showNewForm && (
              <form onSubmit={addCustomer} className="mt-3 bg-white border border-line rounded-xl p-4">
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted">
                    Name
                    <input
                      className="border border-line rounded-lg px-3 py-2 text-sm font-mono bg-paper normal-case font-normal"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Full name"
                      autoFocus
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted">
                    Phone
                    <input
                      className="border border-line rounded-lg px-3 py-2 text-sm font-mono bg-paper normal-case font-normal"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                      inputMode="tel"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted">
                    Birthday <span className="normal-case font-normal text-gray-400">optional</span>
                    <input
                      type="date"
                      className="border border-line rounded-lg px-3 py-2 text-sm font-mono bg-paper normal-case font-normal"
                      value={newBirthday}
                      onChange={(e) => setNewBirthday(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 w-full bg-ink text-paper font-bold text-sm rounded-lg py-2.5 disabled:opacity-50"
                >
                  Add customer
                </button>
              </form>
            )}

            {loading ? (
              <div className="text-center py-12 text-muted">
                <Loader2 className="mx-auto animate-spin" size={22} />
                <p className="mt-2 text-sm">Loading customers…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <p className="font-bold text-ink text-sm">
                  {customers.length === 0 ? "No customers yet" : "No matches"}
                </p>
                <p className="text-xs mt-1">
                  {customers.length === 0 ? 'Tap "New" to add your first regular.' : "Try a different name or number."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className="w-full flex items-center justify-between bg-white border border-line rounded-lg px-3.5 py-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {c.name.trim()[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center">
                            {c.name}
                            {monthDay(c.birthday) === todayMD && <Cake size={14} className="text-stamp ml-1.5" />}
                          </div>
                          <div className="text-xs text-muted mt-0.5">{formatPhone(c.phone)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.rewards_earned > 0 && (
                          <span className="flex items-center gap-1 bg-success text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                            <Gift size={12} /> {c.rewards_earned}
                          </span>
                        )}
                        <div className="flex gap-0.5">
                          {Array.from({ length: PUNCHES_FOR_REWARD }).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full"
                              style={{ background: i < c.punches ? "#C41E3A" : "#E4DFD3" }}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {active && (
          <div>
            <button onClick={() => setSelectedId(null)} className="text-muted text-sm py-1 mb-2">
              &larr; All customers
            </button>

            <div className="bg-white border border-line rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-display text-lg">{active.name}</h2>
                  <p className="text-xs text-muted mt-1">{formatPhone(active.phone)}</p>
                  {active.birthday && (
                    <p className="text-xs text-stamp mt-1.5 flex items-center gap-1">
                      <Cake size={13} />
                      {monthDay(active.birthday) === todayMD ? "Birthday today!" : `Birthday ${active.birthday.slice(5)}`}
                    </p>
                  )}
                </div>
                {active.rewards_earned > 0 && (
                  <div className="flex items-center gap-1.5 bg-success text-white rounded-lg px-2.5 py-1.5 text-xs font-bold flex-shrink-0">
                    <Gift size={16} /> {active.rewards_earned} free
                  </div>
                )}
              </div>

              <div className="mt-5 bg-kraft rounded-lg p-4 border border-dashed" style={{ borderColor: "#C4B383" }}>
                <div className="grid grid-cols-4 gap-2.5">
                  {Array.from({ length: PUNCHES_FOR_REWARD }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-full flex items-center justify-center text-xs font-bold"
                      style={
                        i < active.punches
                          ? { background: "#C41E3A", color: "#FAF7F0" }
                          : { background: "#FAF7F0", color: "#8A8478", border: "1.5px solid #C4B383" }
                      }
                    >
                      {i < active.punches ? <Check size={16} /> : i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs font-bold mt-3" style={{ color: "#6B5F3E" }}>
                  {active.punches}/{PUNCHES_FOR_REWARD} toward next free item
                </p>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => addPunch(active)}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-ink text-paper font-bold text-sm rounded-lg py-3 disabled:opacity-50"
                >
                  <Plus size={18} /> Add punch
                </button>
                <button
                  onClick={() => redeemReward(active)}
                  disabled={active.rewards_earned === 0 || busy}
                  className="flex-1 flex items-center justify-center gap-1.5 font-bold text-sm rounded-lg py-3 disabled:cursor-not-allowed"
                  style={
                    active.rewards_earned > 0
                      ? { background: "#2F6B4F", color: "#fff" }
                      : { background: "#E4DFD3", color: "#B5AFA0" }
                  }
                >
                  <Gift size={18} /> Redeem
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-paper text-sm rounded-lg px-4 py-2.5 shadow-lg max-w-[90%] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
