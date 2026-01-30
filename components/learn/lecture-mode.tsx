"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase, Unit, UserProgress } from "@/lib/supabase";
import { generateLecture } from "@/lib/gemini";
import { MathContent } from "@/components/math-content";
import ReactMarkdown from "react-markdown";

interface LectureModeProps {
  unit: Unit;
  progress: UserProgress | null;
  difficulty: string;
  onComplete: () => void;
}

export function LectureMode({
  unit,
  progress,
  difficulty,
  onComplete,
}: LectureModeProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const loadLecture = async () => {
    try {
      setLoading(true);

      // キャッシュされた講義内容を確認
      const { data: cachedLecture } = await supabase
        .from('lecture_contents')
        .select('*')
        .eq('unit_id', unit.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedLecture) {
        setContent(cachedLecture.content);
        
        // 使用回数を更新
        await supabase
          .from('lecture_contents')
          .update({ usage_count: cachedLecture.usage_count + 1 })
          .eq('id', cachedLecture.id);
      } else {
        // 新しい講義を生成
        const generatedContent = await generateLecture(
          unit.subject,
          unit.unit_name,
          unit.description || '',
          difficulty
        );
        setContent(generatedContent);

        // 講義内容を保存
        await supabase.from('lecture_contents').insert({
          unit_id: unit.id,
          content: generatedContent,
          usage_count: 1,
        });
      }
    } catch (error) {
      console.error('Error loading lecture:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLecture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 進捗を更新
      const newProgress = Math.max(progress?.progress_percentage || 0, 40);
      
      await supabase
        .from('user_progress')
        .upsert({
          user_id: session.user.id,
          unit_id: unit.id,
          lecture_completed: true,
          progress_percentage: newProgress,
          status: 'in_progress',
        });

      setCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error completing lecture:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">AIが講義を準備しています...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold">講義を完了しました！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <MathContent content={content} className="prose prose-sm max-w-none dark:prose-invert" />
        </CardContent>
      </Card>

      <Button onClick={handleComplete} className="w-full" size="lg">
        講義を完了
      </Button>
    </div>
  );
}
