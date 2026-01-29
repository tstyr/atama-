"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, BookOpen, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/subjects" className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>SmartTutor AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/subjects">
              <Button variant={pathname === "/subjects" ? "default" : "ghost"} size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                教科選択
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant={pathname === "/dashboard" ? "default" : "ghost"} size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                ダッシュボード
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
