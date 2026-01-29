"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, BookOpen, Dumbbell, ArrowRight } from "lucide-react";
import type { Unit, UserProgress } from "@/lib/supabase";

interface ModeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit;
  progress?: UserProgress;
}

export function ModeSelectionDialog({
  open,
  onOpenChange,
  unit,
  progress,
}: ModeSelectionDialogProps) {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'basic' | 'standard' | 'advanced'>('standard');

  const modes = [
    {
      id: 'diagnostic',
      title: '診断',
      description: '今の実力を測る',
      icon: ClipboardCheck,
      detail: '3〜5問のテストで現在の理解度を診断します',
      color: 'text-blue-500',
      available: !progress?.diagnostic_completed,
    },
    {
      id: 'lecture',
      title: '講義',
      description: '要点をまとめて学ぶ',
      icon: BookOpen,
      detail: 'AIが重要なポイントを1画面で解説します',
      color: 'text-green-500',
      available: true,
    },
    {
      id: 'practice',
      title: '演習',
      description: '問題を解いて定着',
      icon: Dumbbell,
      detail: '習得度に合わせてAIが連続で問題を出題します',
      color: 'text-orange-500',
      available: true,
    },
  ];

  const handleModeSelect = (modeId: string) => {
    const url = `/learn/${unit.id}?mode=${modeId}&difficulty=${selectedDifficulty}`;
    router.push(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{unit.unit_name}</DialogTitle>
          <DialogDescription>{unit.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 難易度選択 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">難易度を選択</h3>
            <Tabs value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as 'basic' | 'standard' | 'advanced')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">初級</TabsTrigger>
                <TabsTrigger value="standard">中級</TabsTrigger>
                <TabsTrigger value="advanced">上級</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="text-sm text-muted-foreground mt-2">
                基本用語の確認、教科書レベルの基礎
              </TabsContent>
              <TabsContent value="standard" className="text-sm text-muted-foreground mt-2">
                共通テスト・入試標準レベル
              </TabsContent>
              <TabsContent value="advanced" className="text-sm text-muted-foreground mt-2">
                難関大入試・応用・記述レベル
              </TabsContent>
            </Tabs>
          </div>

          {/* モード選択 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">学習モードを選択</h3>
            <div className="grid gap-3">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isAvailable = mode.available;
                
                return (
                  <Card
                    key={mode.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !isAvailable ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => isAvailable && handleModeSelect(mode.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-accent ${mode.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{mode.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {mode.description}
                            </CardDescription>
                          </div>
                        </div>
                        {isAvailable && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{mode.detail}</p>
                      {!isAvailable && mode.id === 'diagnostic' && (
                        <p className="text-xs text-primary mt-2">✓ 診断済み</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 進捗情報 */}
          {progress && (
            <div className="bg-accent/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">進捗</span>
                <span className="font-semibold">{progress.progress_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">習得度</span>
                <span className="font-semibold">{Math.round(progress.mastery_score)}%</span>
              </div>
              {progress.practice_count > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">演習回数</span>
                  <span className="font-semibold">
                    {progress.practice_count}回 (正解: {progress.correct_count})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
