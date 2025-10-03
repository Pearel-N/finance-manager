"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  return (
    <div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center">
      Finance Manager
      <Button onClick={() => router.push("/auth/login")}>Login</Button>
      <Button onClick={() => router.push("/auth/signup")}>Signup</Button>
      <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
      <Button onClick={() => supabase.auth.signOut()}>Logout</Button>
    </div>
  );
}
