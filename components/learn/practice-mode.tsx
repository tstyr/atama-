"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/lib/supabase";
import { generatePracticeQuestion, evaluateAnswer } from "@/lib/gemini";

interface Question {
  question: string;
  expectedAnswer: string;
}

interface Feedback {
  isCorrect: boolean;
  feedback: string;
  weakPoint?: string;
}

interface EvaluationResult {
  isCorrect: boolean;
  feedback: string;
  weakPoint?: string;
}

interface PracticeModeProps {
  unit: Unit;
  sessionId: string | null;
  difficulty: string;
  onComplete: () => void;
}

export function PracticeMode({
  unit,
  sessionId,
  difficulty,
  onComplete,
}: PracticeModeProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      
      // 過去の誤答データを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: pastAttempts } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('unit_id', unit.id)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(5);

      const weakPoints = pastAttempts?.map(a => a.weak_point_identified).filter(Boolean) || [];

      // 新しい問題を生成
      const newQuestion = await generatePracticeQuestion(
        unit.subject,
        unit.unit_name,
        difficulty,
        weakPoints
      );

      setQuestion(newQuestion);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const evaluation: EvaluationResult = await evaluateAnswer(
        question.question,
        userAnswer,
        question.expectedAnswer
      );

      // 回答を記録
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('question_attempts').insert({
          user_id: session.user.id,
          unit_id: unit.id,
          session_id: sessionId,
          question_type: 'practice',
          question_text: question.question,
          user_answer: userAnswer,
          is_correct: evaluation.isCorrect,
          ai_feedback: evaluation.feedback,
          weak_point_identified: evaluation.weakPoint,
          time_spent_seconds: 0,
        });

        // 進捗を更新
        const newCorrectCount = correctCount + (evaluation.isCorrect ? 1 : 0);
        const newQuestionCount = questionCount + 1;
        const masteryScore = (newCorrectCount / newQuestionCount) * 100;
        const progressPercentage = Math.min(40 + (newQuestionCount * 5), 100);

        await supabase
          .from('user_progress')
          .upsert({
            user_id: session.user.id,
            unit_id: unit.id,
            practice_count: newQuestionCount,
            correct_count: newCorrectCount,
            mastery_score: masteryScore,
            progress_percentage: progressPercentage,
            status: progressPercentage >= 80 ? 'mastered' : 'in_progress',
            mastered_at: progressPercentage >= 80 ? new Date().toISOString() : null,
          });

        setCorrectCount(newCorrectCount);
        setQuestionCount(newQuestionCount);
      }

      setFeedback(evaluation);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setUserAnswer("");
    setFeedback(null);
    loadNextQuestion();
  };

  const handleFinish = () => {
    setShowCompletion(true);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Trophy className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-semibold">お疲れ様でした！</p>
        <p className="text-muted-foreground">
          {questionCount}問中{correctCount}問正解 ({Math.round((correctCount / questionCount) * 100)}%)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計表示 */}
      <div className="flex items-center justify-between text-sm bg-accent/50 rounded-lg p-4">
        <div>
          <span className="text-muted-foreground">解答数: </span>
          <span className="font-semibold">{questionCount}問</span>
        </div>
        <div>
          <span className="text-muted-foreground">正解: </span>
          <span className="font-semibold">{correctCount}問</span>
        </div>
        <div>
          <span className="text-muted-foreground">正答率: </span>
          <span className="font-semibold">
            {questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* 問題カード */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {question.question}
            </p>
          </div>

          {!feedback ? (
            <>
              <Textarea
                placeholder="回答を入力してください"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="min-h-[120px] text-base"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim() || isSubmitting}
                  className="flex-1"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      採点中...
                    </>
                  ) : (
                    '回答する'
                  )}
                </Button>
                <Button
                  onClick={handleFinish}
                  variant="outline"
                  size="lg"
                >
                  終了
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* 正誤表示 */}
              <div className={`flex items-center gap-2 p-4 rounded-lg ${
                feedback.isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
              }`}>
                {feedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">正解です！</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">不正解</span>
                  </>
                )}
              </div>

              {/* AIフィードバック */}
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold">解説</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback.feedback}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleNext} className="flex-1" size="lg">
                  次の問題へ
                </Button>
                <Button
                  onClick={handleFinish}
                  variant="outline"
                  size="lg"
                >
                  終了
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
