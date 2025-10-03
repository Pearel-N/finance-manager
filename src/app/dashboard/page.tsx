import { createClient } from "@/utils/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  return (
    <div>Hello {user.data.user?.email}</div>
  );
}
