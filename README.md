# SmartTutor AI - 高校生向けAI学習プラットフォーム

AIを活用した効率的な学習体験を提供する高校生向け学習プラットフォームです。

## 主要機能

- **教科・単元別のAI講義＆演習**: 10教科に対応し、動的に問題を生成
- **学習進捗の可視化**: 学習時間、正答率、教科別分析をグラフで表示
- **パーソナライズされた学習サポート**: AIが苦手箇所を分析し、復習を推奨
- **マルチデバイス同期**: Googleアカウントで学習履歴を自動同期
- **4種類のテーマ**: ホワイト、ダーク、ブラック、灰色から選択可能

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide Icons
- **Theme**: next-themes
- **Auth & Database**: Supabase
- **AI**: Google Gemini 2.0 Flash
- **Charts**: Recharts
- **Animations**: Framer Motion

## セットアップ

### 1. 依存関係のインストール

```bash
cd smart-tutor-ai
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、必要な値を設定してください。

```bash
cp .env.example .env
```

#### Supabaseの設定

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. Project Settings > API から URL と anon key を取得
3. `.env` に設定

#### Gemini APIの設定

1. [Google AI Studio](https://makersuite.google.com/app/apikey) でAPIキーを取得
2. `.env` に設定

### 3. データベーステーブルの作成

Supabaseのダッシュボードで以下のSQLを実行してください：

```sql
-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学習ログテーブル
CREATE TABLE study_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('lecture', 'practice')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  question TEXT,
  answer TEXT,
  is_correct BOOLEAN,
  ai_explanation TEXT,
  study_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 復習リストテーブル
CREATE TABLE todo_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  reason TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_study_logs_user_id ON study_logs(user_id);
CREATE INDEX idx_study_logs_created_at ON study_logs(created_at);
CREATE INDEX idx_todo_list_user_id ON todo_list(user_id);
```

### 4. Google OAuth の設定

1. Supabaseダッシュボード > Authentication > Providers > Google を有効化
2. [Google Cloud Console](https://console.cloud.google.com/) でOAuth 2.0クライアントIDを作成
3. 承認済みのリダイレクトURIに Supabase の Callback URL を追加
4. Client ID と Client Secret を Supabase に設定

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構造

```
smart-tutor-ai/
├── app/
│   ├── dashboard/          # ダッシュボードページ
│   ├── login/              # ログインページ
│   ├── study/[subject]/    # 学習ページ（動的ルート）
│   ├── subjects/           # 教科選択ページ
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # ホームページ
├── components/
│   ├── ui/                 # shadcn/ui コンポーネント
│   ├── header.tsx          # ヘッダーコンポーネント
│   ├── theme-provider.tsx  # テーマプロバイダー
│   └── theme-toggle.tsx    # テーマ切り替えボタン
├── lib/
│   ├── gemini.ts           # Gemini AI関連の関数
│   ├── supabase.ts         # Supabase設定と型定義
│   └── utils.ts            # ユーティリティ関数
└── public/                 # 静的ファイル
```

## 使い方

1. **ログイン**: Googleアカウントでログイン
2. **教科選択**: 学習したい教科を選択
3. **学習設定**: 単元名、モード（講義/演習）、難易度を選択
4. **学習開始**: AIが生成したコンテンツで学習
5. **ダッシュボード**: 学習状況を確認し、復習項目をチェック

## 対応教科

- 英語コミュニケーション
- 論理表現
- 数学
- 歴史総合
- 公共
- 言語文化
- 現代の国語
- 化学
- 物理
- 生物

## ライセンス

MIT
