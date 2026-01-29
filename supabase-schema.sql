-- SmartTutor AI データベーススキーマ (atama+スタイル)
-- Supabaseのダッシュボードで実行してください

-- 既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 既存のテーブルを削除（CASCADE で関連するポリシーも自動削除）
DROP TABLE IF EXISTS question_attempts CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('white', 'gray', 'dark', 'black')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 単元マスターテーブル（プリセット + AI生成カスタム単元）
CREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  unit_key TEXT NOT NULL UNIQUE,
  description TEXT,
  is_preset BOOLEAN DEFAULT TRUE,
  prerequisite_units TEXT[], -- 前提単元のunit_keyの配列
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_time INTEGER DEFAULT 30, -- 推定学習時間（分）
  created_by UUID REFERENCES auth.users, -- カスタム単元の作成者
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー進捗テーブル
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  unit_id UUID REFERENCES units NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'in_progress', 'mastered')),
  mastery_score DECIMAL(5,2) DEFAULT 0.0 CHECK (mastery_score BETWEEN 0 AND 100),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  diagnostic_completed BOOLEAN DEFAULT FALSE,
  lecture_completed BOOLEAN DEFAULT FALSE,
  practice_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, unit_id)
);

-- 学習セッションテーブル（秒単位の時間記録）
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  unit_id UUID REFERENCES units NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('diagnostic', 'lecture', 'practice', 'review')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 講義コンテンツテーブル（生成済み講義を保存して再利用）
CREATE TABLE lecture_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units NOT NULL,
  content TEXT NOT NULL, -- Markdown形式の講義内容
  weak_points TEXT[], -- この講義が対応する弱点
  usage_count INTEGER DEFAULT 0, -- 使用回数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 演習問題テーブル（生成済み問題を保存して再利用）
CREATE TABLE practice_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units NOT NULL,
  question_text TEXT NOT NULL, -- Markdown形式の問題文
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  target_weak_points TEXT[], -- この問題が対応する弱点
  usage_count INTEGER DEFAULT 0, -- 使用回数
  correct_rate DECIMAL(5,2) DEFAULT 0.0, -- 正答率
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 診断・演習の問題回答記録テーブル
CREATE TABLE question_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  unit_id UUID REFERENCES units NOT NULL,
  session_id UUID REFERENCES study_sessions,
  question_id UUID REFERENCES practice_questions, -- 演習問題の場合のみ
  question_type TEXT NOT NULL CHECK (question_type IN ('diagnostic', 'practice')),
  question_text TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN,
  ai_feedback TEXT,
  weak_point_identified TEXT, -- AIが特定した弱点
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_units_subject ON units(subject);
CREATE INDEX idx_units_unit_key ON units(unit_key);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_unit_id ON study_sessions(unit_id);
CREATE INDEX idx_lecture_contents_unit_id ON lecture_contents(unit_id);
CREATE INDEX idx_practice_questions_unit_id ON practice_questions(unit_id);
CREATE INDEX idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_unit_id ON question_attempts(unit_id);
CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- プロフィールのRLSポリシー
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 単元のRLSポリシー
CREATE POLICY "Everyone can view preset units" ON units
  FOR SELECT USING (is_preset = TRUE OR created_by = auth.uid());
CREATE POLICY "Users can create custom units" ON units
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- ユーザー進捗のRLSポリシー
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- 学習セッションのRLSポリシー
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 講義コンテンツのRLSポリシー（全員が閲覧可能、システムが作成）
CREATE POLICY "Everyone can view lecture contents" ON lecture_contents
  FOR SELECT USING (TRUE);
CREATE POLICY "System can insert lecture contents" ON lecture_contents
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "System can update lecture contents" ON lecture_contents
  FOR UPDATE USING (TRUE);

-- 演習問題のRLSポリシー（全員が閲覧可能、システムが作成）
CREATE POLICY "Everyone can view practice questions" ON practice_questions
  FOR SELECT USING (TRUE);
CREATE POLICY "System can insert practice questions" ON practice_questions
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "System can update practice questions" ON practice_questions
  FOR UPDATE USING (TRUE);

-- 問題回答記録のRLSポリシー
CREATE POLICY "Users can view own attempts" ON question_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON question_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 新規ユーザー登録時に自動的にプロフィールを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
