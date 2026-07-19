import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateStoreForm from "./CreateStoreForm";
import LoyaltyDashboard from "./LoyaltyDashboard";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!store) {
    return <CreateStoreForm />;
  }

  return <LoyaltyDashboard store={store} />;
}
