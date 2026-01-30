"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/lib/supabase";
import { generateDiagnosticQuestions, evaluateAnswer } from "@/lib/gemini";

interface Question {
  question: string;
  expectedAnswer: string;
}

interface Evaluation {
  isCorrect: boolean;
  feedback: string;
  weakPoint?: string;
  explanation?: string;
}

interface QuestionResult extends Question {
  userAnswer: string;
  evaluation: Evaluation;
}

interface DiagnosticModeProps {
  unit: Unit;
  sessionId: string | null;
  difficulty: string;
  onComplete: () => void;
}

export function DiagnosticMode({
  unit,
  sessionId,
  difficulty,
  onComplete,
}: DiagnosticModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Evaluation | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const generatedQuestions = await generateDiagnosticQuestions(
        unit.subject,
        unit.unit_name,
        difficulty,
        5
      );
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  }, [unit.subject, unit.unit_name, difficulty]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const currentQuestion = questions[currentIndex];
      const evaluation = await evaluateAnswer(
        currentQuestion.question,
        userAnswer,
        currentQuestion.expectedAnswer
      );

      // evaluateAnswerの戻り値の型に合わせて変換
      const normalizedEvaluation: Evaluation = {
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.explanation || evaluation.feedback || '',
        weakPoint: evaluation.weakPoint,
        explanation: evaluation.explanation,
      };

      // 回答を記録
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('question_attempts').insert({
          user_id: session.user.id,
          unit_id: unit.id,
          session_id: sessionId,
          question_type: 'diagnostic',
          question_text: currentQuestion.question,
          user_answer: userAnswer,
          is_correct: normalizedEvaluation.isCorrect,
          ai_feedback: normalizedEvaluation.feedback,
          weak_point_identified: normalizedEvaluation.weakPoint,
          time_spent_seconds: 0,
        });
      }

      setFeedback(normalizedEvaluation);
      setResults([...results, { ...currentQuestion, userAnswer, evaluation: normalizedEvaluation }]);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setFeedback(null);
    } else {
      completeDiagnostic();
    }
  };

  const completeDiagnostic = async () => {
    try {
      const correctCount = results.filter(r => r.evaluation.isCorrect).length;
      const masteryScore = (correctCount / questions.length) * 100;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('user_progress')
          .upsert({
            user_id: session.user.id,
            unit_id: unit.id,
            diagnostic_completed: true,
            mastery_score: masteryScore,
            progress_percentage: 20,
            status: 'in_progress',
          });
      }

      onComplete();
    } catch (error) {
      console.error('Error completing diagnostic:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      {/* 進捗表示 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          問題 {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-muted-foreground">
          正解: {results.filter(r => r.evaluation.isCorrect).length} / {results.length}
        </span>
      </div>

      {/* 問題カード */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {currentQuestion.question}
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
              <Button
                onClick={handleSubmit}
                disabled={!userAnswer.trim() || isSubmitting}
                className="w-full"
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

              <Button onClick={handleNext} className="w-full" size="lg">
                {currentIndex < questions.length - 1 ? '次の問題へ' : '診断を完了'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
