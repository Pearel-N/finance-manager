"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { logout } from "@/app/auth/actions";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => pathname === path;

  if (loading) {
    return (
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Finance Manager</h1>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
            Finance Manager
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {user ? (
              // Authenticated user navigation
              <>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/dashboard") 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    }`}
                  >
                    Home
                  </Link>
                  {/* Future navigation tabs will be added here */}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2"
                >
                  Logout
                </Button>
              </>
            ) : (
              // Unauthenticated user navigation
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/auth/login")}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/auth/signup")}
                >
                  Signup
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
