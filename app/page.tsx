import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "./LoginButton";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full border-2 border-stamp text-stamp flex items-center justify-center text-3xl mx-auto mb-5">
          ★
        </div>
        <h1 className="font-display text-3xl tracking-wide mb-2">PUNCH IN</h1>
        <p className="text-muted text-sm mb-10">counter loyalty, no card to lose</p>
        <LoginButton />
        <p className="text-xs text-muted mt-8">
          One account per store. Your customer list stays private to you.
        </p>
      </div>
    </main>
  );
}
