"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle2, Circle } from "lucide-react";
import { Unit, UserProgress } from "@/lib/supabase";

interface UnitTileProps {
  unit: Unit;
  progress?: UserProgress;
  onClick: () => void;
  index: number;
}

export function UnitTile({ unit, progress, onClick, index }: UnitTileProps) {
  const isLocked = progress?.status === 'locked';
  const isMastered = progress?.status === 'mastered';
  const progressPercentage = progress?.progress_percentage || 0;
  const masteryScore = progress?.mastery_score || 0;

  const getStatusIcon = () => {
    if (isLocked) return <Lock className="h-4 w-4" />;
    if (isMastered) return <CheckCircle2 className="h-4 w-4 text-primary" />;
    return <Circle className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isLocked) return "opacity-50";
    if (isMastered) return "border-primary/50";
    if (progress?.status === 'in_progress') return "border-primary/30";
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${getStatusColor()} ${
          isLocked ? "cursor-not-allowed" : ""
        }`}
        onClick={() => !isLocked && onClick()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">
              {unit.unit_name}
            </CardTitle>
            {getStatusIcon()}
          </div>
          {unit.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {unit.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-semibold">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
          
          {masteryScore > 0 && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">習得度</span>
              <span className="font-semibold">{Math.round(masteryScore)}%</span>
            </div>
          )}
          
          <div className="flex gap-2 text-xs text-muted-foreground pt-1">
            <span>難易度: {"★".repeat(unit.difficulty_level)}</span>
            <span>•</span>
            <span>{unit.estimated_time}分</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
