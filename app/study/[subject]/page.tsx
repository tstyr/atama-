"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, PenTool, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { generateLecture, generatePractice, evaluateAnswer } from "@/lib/gemini";

const subjectNames: Record<string, string> = {
  "english-communication": "英語コミュニケーション",
  "logical-expression": "論理表現",
  "mathematics": "数学",
  "history": "歴史総合",
  "civics": "公共",
  "language-culture": "言語文化",
  "modern-japanese": "現代の国語",
  "chemistry": "化学",
  "physics": "物理",
  "biology": "生物",
};

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const subject = params.subject as string;
  const subjectName = subjectNames[subject] || subject;

  const [showModal, setShowModal] = useState(true);
  const [mode, setMode] = useState<"lecture" | "practice">("lecture");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [router]);

  const handleStart = async () => {
    if (!unit.trim()) {
      alert("単元名を入力してください");
      return;
    }

    setShowModal(false);
    setLoading(true);
    setStartTime(Date.now());

    try {
      if (mode === "lecture") {
        const lectureContent = await generateLecture(subjectName, unit, difficulty);
        setContent(lectureContent);
      } else {
        const practiceContent = await generatePractice(subjectName, unit, difficulty);
        setQuestion(practiceContent);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("コンテンツの生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("回答を入力してください");
      return;
    }

    setLoading(true);
    try {
      const result = await evaluateAnswer(question, userAnswer, subjectName, unit);
      setEvaluation(result);

      const studyTime = Math.floor((Date.now() - startTime) / 1000);
      
      await supabase.from("study_logs").insert({
        user_id: userId,
        subject: subjectName,
        unit: unit,
        mode: mode,
        difficulty: difficulty,
        question: question,
        answer: userAnswer,
        is_correct: result.isCorrect,
        ai_explanation: result.explanation,
        study_time: studyTime,
      });

      if (!result.isCorrect) {
        await supabase.from("todo_list").insert({
          user_id: userId,
          subject: subjectName,
          unit: unit,
          priority: "high",
          reason: "演習で誤答があったため復習が必要",
          completed: false,
        });
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
      alert("採点に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const studyTime = Math.floor((Date.now() - startTime) / 1000);
    
    await supabase.from("study_logs").insert({
      user_id: userId,
      subject: subjectName,
      unit: unit,
      mode: mode,
      difficulty: difficulty,
      study_time: studyTime,
    });

    router.push("/subjects");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/subjects")}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        教科選択に戻る
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent onClose={() => setShowModal(false)}>
          <DialogHeader>
            <DialogTitle>{subjectName} - 学習設定</DialogTitle>
            <DialogDescription>学習モードと難易度を選択してください</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">単元名</label>
              <input
                type="text"
                placeholder="例：二次関数、明治維新、DNA"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">学習モード</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={mode === "lecture" ? "default" : "outline"}
                  onClick={() => setMode("lecture")}
                  className="h-20 flex-col gap-2"
                >
                  <BookOpen className="h-6 w-6" />
                  講義モード
                </Button>
                <Button
                  variant={mode === "practice" ? "default" : "outline"}
                  onClick={() => setMode("practice")}
                  className="h-20 flex-col gap-2"
                >
                  <PenTool className="h-6 w-6" />
                  演習モード
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">難易度</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "beginner", label: "初級" },
                  { value: "intermediate", label: "中級" },
                  { value: "advanced", label: "上級" },
                ].map((level) => (
                  <Button
                    key={level.value}
                    variant={difficulty === level.value ? "default" : "outline"}
                    onClick={() => setDifficulty(level.value as any)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleStart} className="w-full" size="lg">
              学習を開始
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">生成中...</span>
        </div>
      )}

      {!loading && mode === "lecture" && content && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {unit} - 講義
              </CardTitle>
              <CardDescription>難易度: {difficulty === "beginner" ? "初級" : difficulty === "intermediate" ? "中級" : "上級"}</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }} />
            </CardContent>
          </Card>
          <Button onClick={handleComplete} className="mt-6 w-full" size="lg">
            学習を完了
          </Button>
        </motion.div>
      )}

      {!loading && mode === "practice" && question && !evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                {unit} - 演習問題
              </CardTitle>
              <CardDescription>難易度: {difficulty === "beginner" ? "初級" : difficulty === "intermediate" ? "中級" : "上級"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: question.replace(/\n/g, "<br/>") }} />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">あなたの回答</label>
                <Textarea
                  placeholder="回答を入力してください..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <Button onClick={handleSubmitAnswer} className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                採点する
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {evaluation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={evaluation.isCorrect ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {evaluation.isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    よくできました！
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-500" />
                    もう一度確認しましょう
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: evaluation.explanation.replace(/\n/g, "<br/>") }} />
              </div>
              
              <div className="flex gap-3">
                <Button onClick={() => {
                  setEvaluation(null);
                  setUserAnswer("");
                  setQuestion("");
                  handleStart();
                }} className="flex-1">
                  次の問題へ
                </Button>
                <Button onClick={() => router.push("/subjects")} variant="outline" className="flex-1">
                  教科選択に戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
