"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/subjects");
      }
    };
    checkUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // リダイレクトURLを取得（認証コールバックルートを使用）
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          : 'http://localhost:3000/auth/callback';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      alert(`ログインに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">SmartTutor AI</CardTitle>
          <CardDescription className="text-base">
            高校生向けAI学習プラットフォーム
            <br />
            効率的な学習で目標達成をサポートします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 text-base"
            size="lg"
          >
            {loading ? "ログイン中..." : "Googleアカウントでログイン"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            ログインすることで、学習履歴が自動的に保存され、
            <br />
            複数のデバイスで同期されます
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
