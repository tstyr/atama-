"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/lib/supabase";
import {
  generateDiagnosticQuestions,
  generateLecture,
  generatePracticeQuestion,
  evaluateAnswer,
} from "@/lib/gemini";
import ReactMarkdown from 'react-markdown';

type LearningMode = 'diagnostic' | 'lecture' | 'practice';

interface DiagnosticResult {
  isCorrect: boolean;
  explanation: string;
  weakPoint?: string;
}

interface PracticeResult {
  isCorrect: boolean;
  explanation: string;
  weakPoint?: string;
}

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const unitId = params.unitId as string;
  const initialMode = (searchParams.get('mode') as LearningMode) || 'diagnostic';

  const [unit, setUnit] = useState<Unit | null>(null);
  const [mode] = useState<LearningMode>(initialMode);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 診断フェーズ
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<string[]>([]);
  const [currentDiagnosticIndex, setCurrentDiagnosticIndex] = useState(0);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<string[]>([]);
  const [weakPoints, setWeakPoints] = useState<string[]>([]);

  // 講義フェーズ（スライド）
  const [lectureSlides, setLectureSlides] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // 演習フェーズ
  const [practiceQuestion, setPracticeQuestion] = useState<string>('');
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [practiceCount, setPracticeCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    loadUnitAndProgress();
  }, [unitId]);

  useEffect(() => {
    if (unit && userId) {
      if (mode === 'diagnostic') {
        handleStartDiagnostic();
      } else if (mode === 'lecture') {
        handleStartLecture();
      } else if (mode === 'practice') {
        handleStartPractice();
      }
    }
  }, [mode, unit, userId]);

  const loadUnitAndProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);

      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

      if (unitError) throw unitError;
      setUnit(unitData);

      const progressData = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('unit_id', unitId)
        .single();

      if (progressData.data) {
        setPracticeCount(progressData.data.practice_count || 0);
        setCorrectCount(progressData.data.correct_count || 0);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: session.user.id,
            unit_id: unitId,
            status: 'in_progress',
          })
          .select()
          .single();
      }

      await startSession(session.user.id, mode);
      setLoading(false);
    } catch (error) {
      console.error('Error loading unit:', error);
      setLoading(false);
    }
  };

  const startSession = async (uid: string, sessionType: LearningMode) => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: uid,
          unit_id: unitId,
          session_type: sessionType,
          duration_seconds: 0,
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleStartDiagnostic = async () => {
    if (!unit || diagnosticQuestions.length > 0) return;
    setLoading(true);
    try {
      const questions = await generateDiagnosticQuestions(unit.subject, unit.unit_name, 'standard', 3);
      setDiagnosticQuestions(questions.map((q: { question: string }) => q.question));
      setDiagnosticAnswers(new Array(3).fill(''));
    } catch (error) {
      console.error('Error generating diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticAnswer = async (answer: string) => {
    if (!unit || !userId) return;
    
    const newAnswers = [...diagnosticAnswers];
    newAnswers[currentDiagnosticIndex] = answer;
    setDiagnosticAnswers(newAnswers);

    setLoading(true);
    try {
      const result = await evaluateAnswer(
        diagnosticQuestions[currentDiagnosticIndex],
        answer,
        'Expected answer based on the question'
      );

      await supabase.from('question_attempts').insert({
        user_id: userId,
        unit_id: unitId,
        session_id: sessionId,
        question_type: 'diagnostic',
        question_text: diagnosticQuestions[currentDiagnosticIndex],
        user_answer: answer,
        is_correct: result.isCorrect,
        ai_feedback: result.explanation,
        weak_point_identified: result.weakPoint,
      });

      if (!result.isCorrect && result.weakPoint) {
        setWeakPoints(prev => [...prev, result.weakPoint]);
      }

      if (currentDiagnosticIndex < 2) {
        setCurrentDiagnosticIndex(prev => prev + 1);
      } else {
        await supabase
          .from('user_progress')
          .update({ diagnostic_completed: true, progress_percentage: 20 })
          .eq('user_id', userId)
        .eq('unit_id', unitId);
        
        router.push(`/map/${unit.subject}`);
      }
    } catch (error) {
      console.error('Error evaluating diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLecture = async () => {
    if (!unit || !userId || lectureSlides.length > 0) return;
    setLoading(true);

    try {
      const lecture = await generateLecture(unit.subject, unit.unit_name, unit.description || '', 'standard');
      
      // 講義を複数のスライドに分割
      const slides = lecture.split(/(?=##\s)/g).filter((s: string) => s.trim());
      setLectureSlides(slides.length > 0 ? slides : [lecture]);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error('Error generating lecture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < lectureSlides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handleCompleteLecture = async () => {
    if (!userId || !unitId) return;

    try {
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('progress_percentage')
        .eq('user_id', userId)
        .eq('unit_id', unitId)
        .single();

      await supabase
        .from('user_progress')
        .update({ 
          lecture_completed: true, 
          progress_percentage: Math.max(currentProgress?.progress_percentage || 0, 50)
        })
        .eq('user_id', userId)
        .eq('unit_id', unitId);

      router.push(`/map/${unit?.subject}`);
    } catch (error) {
      console.error('Error completing lecture:', error);
    }
  };

  const handleStartPractice = async () => {
    if (!unit || !userId) return;
    setLoading(true);

    try {
      const { data: previousErrors } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('unit_id', unitId)
        .eq('is_correct', false)
        .limit(3);

      const weakPoints = previousErrors?.map(e => e.weak_point_identified).filter(Boolean) || [];

      const questionData = await generatePracticeQuestion(unit.subject, unit.unit_name, 'standard', weakPoints);
      setPracticeQuestion(questionData.question);
      setPracticeAnswer('');
      setPracticeResult(null);
    } catch (error) {
      console.error('Error generating practice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPractice = async () => {
    if (!unit || !userId || !practiceAnswer.trim()) return;
    setLoading(true);

    try {
      const result = await evaluateAnswer(
        practiceQuestion,
        practiceAnswer,
        'Expected answer based on the question'
      );

      setPracticeResult(result);

      await supabase.from('question_attempts').insert({
        user_id: userId,
        unit_id: unitId,
        session_id: sessionId,
        question_type: 'practice',
        question_text: practiceQuestion,
        user_answer: practiceAnswer,
        is_correct: result.isCorrect,
        ai_feedback: result.explanation,
        weak_point_identified: result.weakPoint,
      });

      const newPracticeCount = practiceCount + 1;
      const newCorrectCount = result.isCorrect ? correctCount + 1 : correctCount;
      
      setPracticeCount(newPracticeCount);
      setCorrectCount(newCorrectCount);

      const masteryScore = (newCorrectCount / newPracticeCount) * 100;
      
      // 合格判定ロジック
      let shouldComplete = false;
      let newProgress = Math.min(50 + (newPracticeCount * 10), 100);
      
      // 1. 全問正解（5問以上）
      if (newCorrectCount >= 5 && newCorrectCount === newPracticeCount) {
        shouldComplete = true;
        newProgress = 100;
      }
      // 2. 上級問題（難易度4-5）で8割以上正答
      else if (unit.difficulty_level >= 4 && masteryScore >= 80 && newPracticeCount >= 5) {
        shouldComplete = true;
        newProgress = 100;
      }
      // 3. 通常問題で正答率80%以上、10問以上
      else if (masteryScore >= 80 && newPracticeCount >= 10) {
        shouldComplete = true;
        newProgress = 100;
      }

      await supabase
        .from('user_progress')
        .update({
          practice_count: newPracticeCount,
          correct_count: newCorrectCount,
          mastery_score: masteryScore,
          progress_percentage: newProgress,
          status: shouldComplete ? 'mastered' : 'in_progress',
          last_studied_at: new Date().toISOString(),
          ...(shouldComplete && { mastered_at: new Date().toISOString() }),
        })
        .eq('user_id', userId)
        .eq('unit_id', unitId);

      if (shouldComplete) {
        setShowComplete(true);
      }
    } catch (error) {
      console.error('Error submitting practice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !unit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (showComplete) {
    return <CompletePhase unitName={unit?.unit_name || ''} practiceCount={practiceCount} correctCount={correctCount} onBackToMap={() => router.push(`/map/${unit?.subject}`)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ミニマルヘッダー */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/map/${unit?.subject}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div className="text-sm font-medium">{unit?.unit_name}</div>
          <div className="w-20"></div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <AnimatePresence mode="wait">
          {mode === 'diagnostic' && (
            <DiagnosticPhase
              diagnosticQuestions={diagnosticQuestions}
              currentIndex={currentDiagnosticIndex}
              loading={loading}
              onAnswer={handleDiagnosticAnswer}
            />
          )}

          {mode === 'lecture' && (
            <LecturePhase
              slides={lectureSlides}
              currentIndex={currentSlideIndex}
              loading={loading}
              onNext={handleNextSlide}
              onComplete={handleCompleteLecture}
            />
          )}

          {mode === 'practice' && (
            <PracticePhase
              question={practiceQuestion}
              answer={practiceAnswer}
              setAnswer={setPracticeAnswer}
              result={practiceResult}
              practiceCount={practiceCount}
              correctCount={correctCount}
              loading={loading}
              onSubmit={handleSubmitPractice}
              onNext={handleStartPractice}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 診断フェーズ
interface DiagnosticPhaseProps {
  diagnosticQuestions: string[];
  currentIndex: number;
  loading: boolean;
  onAnswer: (answer: string) => void;
}

function DiagnosticPhase({ diagnosticQuestions, currentIndex, loading, onAnswer }: DiagnosticPhaseProps) {
  const [answer, setAnswer] = useState('');

  if (diagnosticQuestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="p-12 max-w-2xl w-full text-center space-y-6">
          {loading && <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />}
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* 進捗インジケーター */}
      <div className="flex gap-2 justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 w-16 rounded-full transition-all ${
              i === currentIndex ? 'bg-primary' : i < currentIndex ? 'bg-primary/50' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <div className="text-sm text-muted-foreground mb-2">問題 {currentIndex + 1} / 3</div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{diagnosticQuestions[currentIndex]}</ReactMarkdown>
            </div>
          </div>

          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="回答を入力してください"
            rows={6}
            className="text-base resize-none"
          />

          <Button
            onClick={() => {
              onAnswer(answer);
              setAnswer('');
            }}
            disabled={loading || !answer.trim()}
            size="lg"
            className="w-full h-14 text-lg"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            回答する
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// 講義フェーズ（スライド型）
interface LecturePhaseProps {
  slides: string[];
  currentIndex: number;
  loading: boolean;
  onNext: () => void;
  onComplete: () => void;
}

function LecturePhase({ slides, currentIndex, loading, onNext, onComplete }: LecturePhaseProps) {
  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* スライド進捗 */}
      <div className="flex gap-2 justify-center">
        {slides.map((_: string, i: number) => (
          <div
            key={i}
            className={`h-2 w-12 rounded-full transition-all ${
              i === currentIndex ? 'bg-primary' : i < currentIndex ? 'bg-primary/50' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* スライドコンテンツ */}
      <Card className="p-10 min-h-[500px] flex flex-col">
        <div className="flex-1 prose prose-lg max-w-none dark:prose-invert">
          <ReactMarkdown>{slides[currentIndex]}</ReactMarkdown>
        </div>

        <div className="mt-8 flex justify-end">
          {!isLastSlide ? (
            <Button onClick={onNext} size="lg" className="gap-2">
              次へ
              <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button onClick={onComplete} size="lg" className="gap-2">
              <CheckCircle2 className="h-5 w-5" />
              講義完了
            </Button>
          )}
        </div>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {slides.length}
      </div>
    </motion.div>
  );
}

// 演習フェーズ
interface PracticePhaseProps {
  question: string;
  answer: string;
  setAnswer: (answer: string) => void;
  result: PracticeResult | null;
  practiceCount: number;
  correctCount: number;
  loading: boolean;
  onSubmit: () => void;
  onNext: () => void;
}

function PracticePhase({ question, answer, setAnswer, result, practiceCount, correctCount, loading, onSubmit, onNext }: PracticePhaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      {/* 正答率表示 */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-1">正答率</div>
        <div className="text-3xl font-bold">
          {practiceCount > 0 ? Math.round((correctCount / practiceCount) * 100) : 0}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {correctCount} / {practiceCount} 問正解
        </div>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <div className="text-sm text-muted-foreground mb-3">演習問題 #{practiceCount + 1}</div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{question}</ReactMarkdown>
            </div>
          </div>

          {!result && (
            <>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="回答を入力してください"
                rows={8}
                className="text-base resize-none"
              />
              <Button
                onClick={onSubmit}
                disabled={loading || !answer.trim()}
                size="lg"
                className="w-full h-14 text-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                採点する
              </Button>
            </>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-6 rounded-lg ${result.isCorrect ? 'bg-[hsl(var(--success))]/10 border-2 border-[hsl(var(--success))]' : 'bg-destructive/10 border-2 border-destructive'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {result.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />
                      <span className="text-xl font-bold text-[hsl(var(--success))]">正解！</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <span className="text-xl font-bold text-destructive">不正解</span>
                    </>
                  )}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{result.explanation}</ReactMarkdown>
                </div>
              </div>
              <Button onClick={onNext} size="lg" className="w-full h-14 text-lg gap-2">
                次の問題へ
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// 完了フェーズ
interface CompletePhaseProps {
  unitName: string;
  practiceCount: number;
  correctCount: number;
  onBackToMap: () => void;
}

function CompletePhase({ unitName, practiceCount, correctCount, onBackToMap }: CompletePhaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <Card className="p-12 max-w-2xl w-full text-center space-y-8 bg-[hsl(var(--success))]/10 border-2 border-[hsl(var(--success))]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Trophy className="h-24 w-24 text-[hsl(var(--success))] mx-auto" />
        </motion.div>
        
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold text-[hsl(var(--success))] flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8" />
              単元習得！
              <Sparkles className="h-8 w-8" />
            </h2>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-muted-foreground"
          >
            「{unitName}」の学習を完了しました
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-2"
        >
          <div className="text-5xl font-bold text-[hsl(var(--success))]">
            {Math.round((correctCount / practiceCount) * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {correctCount} / {practiceCount} 問正解
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button onClick={onBackToMap} size="lg" className="w-full h-14 text-lg">
            学習マップに戻る
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
}
