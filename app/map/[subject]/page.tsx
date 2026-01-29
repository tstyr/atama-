"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Trophy, ArrowLeft, Brain, BookOpen, PenTool } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import type { Unit, UserProgress } from "@/lib/supabase";

type UnitWithProgress = Unit & {
  progress?: UserProgress;
};

export default function UnitMapPage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  
  const [units, setUnits] = useState<UnitWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsAndProgress();
  }, [subject]);

  const loadUnitsAndProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);

      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('subject', decodeURIComponent(subject))
        .order('difficulty_level', { ascending: true });

      if (unitsError) throw unitsError;

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id);

      if (progressError) throw progressError;

      const unitsWithProgress = (unitsData || []).map(unit => {
        const progress = progressData?.find(p => p.unit_id === unit.id);
        return { ...unit, progress };
      });

      setUnits(unitsWithProgress);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeClick = (unit: UnitWithProgress, mode: 'diagnostic' | 'lecture' | 'practice') => {
    const status = unit.progress?.status || 'available';
    if (status === 'locked') {
      alert('前提単元を完了してください');
      return;
    }
    router.push(`/learn/${unit.id}?mode=${mode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const masteredCount = units.filter(u => u.progress?.progress_percentage === 100 || u.progress?.status === 'mastered').length;
  const totalCount = units.length;
  const overallProgress = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* シンプルなヘッダー */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.push('/subjects')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          <div className="text-sm text-muted-foreground">
            {masteredCount} / {totalCount} 完了
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{decodeURIComponent(subject)}</h1>
          
          {/* 全体進捗バー */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">全体の進捗</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </div>

        {/* 単元カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit, index) => {
            const status = unit.progress?.status || 'available';
            const progress = unit.progress?.progress_percentage || 0;
            const isMastered = progress === 100 || status === 'mastered';
            const isLocked = status === 'locked';

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={`p-6 transition-all border-2 ${
                    isMastered
                      ? 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]'
                      : isLocked
                      ? 'opacity-50 bg-muted'
                      : 'hover:shadow-lg'
                  }`}
                >
                  {/* ヘッダー */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 leading-tight">{unit.unit_name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{unit.description}</p>
                    </div>
                    {isMastered && (
                      <Trophy className="h-6 w-6 text-[hsl(var(--success))] flex-shrink-0 ml-2" />
                    )}
                    {isLocked && (
                      <Lock className="h-6 w-6 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </div>

                  {/* 進捗バー */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">進捗</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* クイックアクセスボタン */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeClick(unit, 'diagnostic')}
                      disabled={isLocked}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Brain className="h-4 w-4" />
                      <span className="text-xs">診断</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeClick(unit, 'lecture')}
                      disabled={isLocked}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="text-xs">講義</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeClick(unit, 'practice')}
                      disabled={isLocked}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <PenTool className="h-4 w-4" />
                      <span className="text-xs">演習</span>
                    </Button>
                  </div>

                  {/* メタ情報 */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{unit.estimated_time}分</span>
                    <span>難易度 Lv.{unit.difficulty_level}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {units.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">この教科の単元がまだ登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );
}
