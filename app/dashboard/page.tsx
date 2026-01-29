"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Clock, Target, TrendingUp, AlertCircle } from "lucide-react";

interface StudyLog {
  subject: string;
  study_time: number;
  created_at: string;
  is_correct?: boolean;
}

interface TodoItem {
  subject: string;
  unit: string;
  priority: string;
  reason: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: logs } = await supabase
        .from("study_logs")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      const { data: todos } = await supabase
        .from("todo_list")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("completed", false)
        .order("priority", { ascending: true });

      setStudyLogs(logs || []);
      setTodoList(todos || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const getDailyStudyTime = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const dayLogs = studyLogs.filter(
        (log) => log.created_at.split("T")[0] === date
      );
      const totalTime = dayLogs.reduce((sum, log) => sum + log.study_time, 0);
      return {
        date: new Date(date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
        time: Math.round(totalTime / 60),
      };
    });
  };

  const getSubjectDistribution = () => {
    const subjectTime: Record<string, number> = {};
    studyLogs.forEach((log) => {
      subjectTime[log.subject] = (subjectTime[log.subject] || 0) + log.study_time;
    });

    return Object.entries(subjectTime).map(([subject, time]) => ({
      subject,
      time: Math.round(time / 60),
    }));
  };

  const getTotalStudyTime = () => {
    const total = studyLogs.reduce((sum, log) => sum + log.study_time, 0);
    return Math.round(total / 60);
  };

  const getAccuracyRate = () => {
    const practiceLog = studyLogs.filter((log) => log.is_correct !== null);
    if (practiceLog.length === 0) return 0;
    const correct = practiceLog.filter((log) => log.is_correct).length;
    return Math.round((correct / practiceLog.length) * 100);
  };

  const dailyData = getDailyStudyTime();
  const subjectData = getSubjectDistribution();
  const totalTime = getTotalStudyTime();
  const accuracyRate = getAccuracyRate();

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f97316", "#6366f1"];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">学習ダッシュボード</h1>
        <p className="text-muted-foreground">あなたの学習状況を確認しましょう</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTime}分</div>
              <p className="text-xs text-muted-foreground">全期間</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">正答率</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracyRate}%</div>
              <p className="text-xs text-muted-foreground">演習問題</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">学習記録</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studyLogs.length}回</div>
              <p className="text-xs text-muted-foreground">全期間</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">復習項目</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoList.length}件</div>
              <p className="text-xs text-muted-foreground">要復習</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>日次学習時間</CardTitle>
              <CardDescription>直近7日間の学習時間の推移</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="time" fill="#3b82f6" name="学習時間（分）" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>教科別学習時間</CardTitle>
              <CardDescription>全期間の教科別学習時間の割合</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ subject, percent }) => `${subject} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="time"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  学習データがありません
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {todoList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>復習が必要な単元</CardTitle>
              <CardDescription>AIが推奨する復習項目</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todoList.map((todo, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      todo.priority === "high" ? "bg-red-500" :
                      todo.priority === "medium" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{todo.subject} - {todo.unit}</p>
                      <p className="text-sm text-muted-foreground">{todo.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
