"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/lib/supabase";
import { generatePracticeQuestion, evaluateAnswer } from "@/lib/gemini";
import { MathContent } from "@/components/math-content";

interface Question {
  type: 'choice' | 'text';
  question: string;
  choices?: string[];
  correctAnswer?: number;
  expectedAnswer?: string;
  explanation?: string;
}

interface Feedback {
  isCorrect: boolean;
  feedback: string;
  weakPoint?: string;
  explanation?: string;
}

interface EvaluationResult {
  isCorrect: boolean;
  explanation: string;
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
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);

  const loadNextQuestion = useCallback(async () => {
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

      console.log('Generated question:', newQuestion); // デバッグ用
      setQuestion(newQuestion);
    } catch (error) {
      console.error('Error loading question:', error);
      // エラー時のフォールバック
      setQuestion({
        type: 'text',
        question: '問題の読み込みに失敗しました。もう一度お試しください。',
        expectedAnswer: ''
      });
    } finally {
      setLoading(false);
    }
  }, [unit.id, unit.subject, unit.unit_name, difficulty]);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  const handleSubmit = async () => {
    if (!question) return;
    
    // 選択肢問題の場合
    if (question.type === 'choice') {
      if (selectedChoice === null) return;
      
      const isCorrect = selectedChoice === question.correctAnswer;
      const normalizedFeedback: Feedback = {
        isCorrect,
        feedback: question.explanation || (isCorrect ? '正解です！' : '不正解です。'),
        explanation: question.explanation || (isCorrect ? '正解です！' : '不正解です。'),
      };

      // 回答を記録
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('question_attempts').insert({
          user_id: session.user.id,
          unit_id: unit.id,
          session_id: sessionId,
          question_type: 'practice',
          question_text: question.question,
          user_answer: question.choices?.[selectedChoice] || '',
          is_correct: isCorrect,
          ai_feedback: normalizedFeedback.feedback,
          time_spent_seconds: 0,
        });

        updateProgress(isCorrect);
      }

      setFeedback(normalizedFeedback);
      return;
    }

    // 記述問題の場合
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const evaluationResult: EvaluationResult = await evaluateAnswer(
        question.question,
        userAnswer,
        question.expectedAnswer || ''
      );

      // EvaluationResultをFeedbackに変換
      const normalizedFeedback: Feedback = {
        isCorrect: evaluationResult.isCorrect,
        feedback: evaluationResult.explanation,
        weakPoint: evaluationResult.weakPoint,
        explanation: evaluationResult.explanation,
      };

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
          is_correct: normalizedFeedback.isCorrect,
          ai_feedback: normalizedFeedback.feedback,
          weak_point_identified: normalizedFeedback.weakPoint,
          time_spent_seconds: 0,
        });

        updateProgress(normalizedFeedback.isCorrect);
      }

      setFeedback(normalizedFeedback);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProgress = async (isCorrect: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
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
  };

  const handleNext = () => {
    setUserAnswer("");
    setSelectedChoice(null);
    setFeedback(null);
    loadNextQuestion();
  };

  const handleFinish = () => {
    setShowCompletion(true);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (loading || !question) {
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
          <MathContent 
            content={question.question}
            className="text-lg leading-relaxed"
          />

          {!feedback ? (
            <>
              {question.type === 'choice' && question.choices ? (
                <div className="space-y-3">
                  {question.choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedChoice(index)}
                      disabled={isSubmitting}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedChoice === index
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedChoice === index
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border'
                        }`}>
                          {selectedChoice === index && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <MathContent content={choice} className="flex-1" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  placeholder="回答を入力してください"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="min-h-[120px] text-base"
                  disabled={isSubmitting}
                />
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    (question.type === 'choice' ? selectedChoice === null : !userAnswer.trim()) || 
                    isSubmitting
                  }
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
                <MathContent 
                  content={feedback.feedback || feedback.explanation || ''}
                  className="text-sm leading-relaxed"
                />
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
