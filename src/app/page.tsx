"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Finance Manager</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          {user 
            ? `Welcome back! Manage your finances with ease.`
            : "Take control of your finances. Sign up to get started with tracking your expenses, managing piggy banks, and more."
          }
        </p>
        {user && (
          <div className="text-sm text-muted-foreground">
            Logged in as: {user.email}
          </div>
        )}
      </div>
    </div>
  );
}
