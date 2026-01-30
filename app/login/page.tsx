"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, AlertCircle } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URLパラメータからエラーを取得
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // URLフラグメント（#）からトークンを取得して処理
    const handleHashFragment = async () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          try {
            // トークンをSupabaseセッションに設定
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) throw error;
            
            // 成功したら教科選択ページへ
            router.push('/subjects');
            return;
          } catch (err) {
            console.error('Error setting session:', err);
            setError('セッションの設定に失敗しました');
          }
        }
      }
    };

    handleHashFragment();

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/subjects");
      }
    };
    checkUser();
  }, [router, searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // 環境変数のチェック
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        alert('Supabase環境変数が設定されていません。管理者に連絡してください。');
        setLoading(false);
        return;
      }
      
      // リダイレクトURLを取得（認証コールバックルートを使用）
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          : 'http://localhost:3000/auth/callback';
      
      console.log('Redirect URL:', redirectUrl); // デバッグ用
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });
      
      if (error) throw error;
      
      console.log('OAuth data:', data); // デバッグ用
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
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ログインエラー</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">SmartTutor AI</CardTitle>
            <CardDescription className="text-base">読み込み中...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
