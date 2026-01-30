import { createClient } from '@supabase/supabase-js';

// 環境変数の取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数のバリデーション
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('Supabase environment variables are not set properly');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  }
}

// Supabaseクライアントの作成（フォールバック値を使用してビルドエラーを防ぐ）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  theme?: 'white' | 'gray' | 'dark' | 'black';
  created_at: string;
  updated_at: string;
};

export type Unit = {
  id: string;
  subject: string;
  unit_name: string;
  unit_key: string;
  description?: string;
  is_preset: boolean;
  prerequisite_units?: string[];
  difficulty_level: number;
  estimated_time: number;
  created_by?: string;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  unit_id: string;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  mastery_score: number;
  progress_percentage: number;
  diagnostic_completed: boolean;
  lecture_completed: boolean;
  practice_count: number;
  correct_count: number;
  last_studied_at?: string;
  mastered_at?: string;
  created_at: string;
  updated_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  unit_id: string;
  session_type: 'diagnostic' | 'lecture' | 'practice' | 'review';
  duration_seconds: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
};

export type LectureContent = {
  id: string;
  unit_id: string;
  content: string;
  weak_points?: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type PracticeQuestion = {
  id: string;
  unit_id: string;
  question_text: string;
  difficulty_level: number;
  target_weak_points?: string[];
  usage_count: number;
  correct_rate: number;
  created_at: string;
  updated_at: string;
};

export type QuestionAttempt = {
  id: string;
  user_id: string;
  unit_id: string;
  session_id?: string;
  question_id?: string;
  question_type: 'diagnostic' | 'practice';
  question_text: string;
  user_answer?: string;
  is_correct?: boolean;
  ai_feedback?: string;
  weak_point_identified?: string;
  time_spent_seconds: number;
  created_at: string;
};
