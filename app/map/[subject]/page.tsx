"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Play, CheckCircle2, Clock, ArrowLeft, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const getStatusIcon = (status?: string, progress?: number) => {
    if (progress === 100 || status === 'mastered') {
      return <Trophy className="h-5 w-5 text-[hsl(var(--success))]" />;
    }
    switch (status) {
      case 'locked':
        return <Lock className="h-5 w-5 opacity-50" />;
      case 'available':
      case 'in_progress':
        return <Play className="h-5 w-5" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  const getCardStyle = (status?: string, progress?: number) => {
    if (progress === 100 || status === 'mastered') {
      return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] border-[hsl(var(--success))]';
    }
    switch (status) {
      case 'locked':
        return 'bg-card opacity-50';
      case 'in_progress':
        return 'bg-primary/10 border-primary';
      default:
        return 'bg-card hover:bg-accent';
    }
  };

  const handleUnitClick = (unit: UnitWithProgress) => {
    const status = unit.progress?.status || 'available';
    if (status === 'locked') {
      alert('前提単元を完了してください');
      return;
    }
    router.push(`/learn/${unit.id}`);
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
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[hsl(var(--success))]"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* 単元カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {units.map((unit, index) => {
            const status = unit.progress?.status || 'available';
            const progress = unit.progress?.progress_percentage || 0;
            const masteryScore = unit.progress?.mastery_score || 0;
            const isMastered = progress === 100 || status === 'mastered';

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={`p-5 cursor-pointer transition-all hover:scale-105 border-2 ${getCardStyle(status, progress)} ${
                    status === 'locked' ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={() => handleUnitClick(unit)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="font-bold text-base mb-1 leading-tight">{unit.unit_name}</h3>
                      <p className="text-xs opacity-80 line-clamp-2">{unit.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(status, progress)}
                    </div>
                  </div>

                  {/* 進捗バー */}
                  {!isMastered && status !== 'locked' && (
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-70">進捗</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-background/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 完了バッジ */}
                  {isMastered && (
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>習得完了！</span>
                    </div>
                  )}

                  {/* メタ情報 */}
                  <div className="flex items-center gap-3 text-xs opacity-70">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{unit.estimated_time}分</span>
                    </div>
                    <span>Lv.{unit.difficulty_level}</span>
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
