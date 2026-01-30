# SmartTutor AI - atama+スタイル学習システム セットアップガイド

## 概要

atama+のような個別最適化学習システムです。

### 主な機能
- **永続的な学習マップ**: プリセット単元 + AI生成カスタム単元
- **ステータス管理**: locked → available → in_progress → mastered
- **学習フロー**: 診断（3問）→ AI講義 → 演習
- **弱点特定**: AIが過去の誤答から弱点を分析
- **秒単位の時間記録**: 全デバイスでリアルタイム同期
- **無彩色デザイン**: White/Gray/Dark/Black + Deep Blue アクセント

## セットアップ手順

### 1. 環境変数の設定

`.env`ファイルを作成し、以下を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 2. データベースのセットアップ

Supabaseダッシュボードで以下のSQLを順番に実行：

1. **スキーマ作成**: `supabase-schema.sql`
2. **プリセット単元挿入**: `scripts/seed-units.sql`

### 3. Google OAuth設定（重要）

#### Supabase側の設定

1. Supabaseダッシュボード → Authentication → Providers → Google
2. Google OAuth を有効化
3. **Redirect URLs** に以下を追加：
   - ローカル: `http://localhost:3000/auth/callback`
   - 本番: `https://your-domain.vercel.app/auth/callback`

#### Google Cloud Console側の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアントID」作成
3. **承認済みのリダイレクトURI** に以下を追加：
   - Supabaseのコールバック: `https://your-project.supabase.co/auth/v1/callback`
4. クライアントIDとシークレットをSupabaseに設定

#### Vercel環境変数の設定

Vercelダッシュボード → Settings → Environment Variables に以下を追加：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (例: `https://your-app.vercel.app`)

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## データベース構造

### 主要テーブル

- **units**: 単元マスター（プリセット + カスタム）
- **user_progress**: ユーザーごとの単元進捗
- **study_sessions**: 秒単位の学習セッション記録
- **question_attempts**: 診断・演習の回答記録

### ステータスフロー

```
locked (前提未完了)
  ↓
available (学習可能)
  ↓
in_progress (学習中)
  ↓
mastered (習得完了、80%以上)
```

## 学習フロー

### 1. 診断フェーズ
- AIが3問の診断問題を生成
- 回答を評価し、弱点を特定

### 2. 講義フェーズ
- 診断結果に基づいた個別最適化講義
- atama+スタイル：簡潔・図解重視

### 3. 演習フェーズ
- 過去の誤答データから問題を生成
- 正答率80%以上で単元完了

## デザインシステム

### テーマ
- **White**: 明るい無彩色
- **Gray**: 中間トーン
- **Dark**: 暗めの無彩色
- **Black**: 完全な黒

### アクセントカラー
- **Deep Blue** (HSL: 217 91% 35-55%)

### ステータス色
- トーンで判別（色相は使わない）
- locked: 薄いグレー
- available: 中間グレー
- in_progress: Deep Blue
- mastered: 濃いグレー

## トラブルシューティング

### Gemini APIエラー
- モデル名: `gemini-2.5-flash` を使用
- APIキーの権限を確認

### データベース接続エラー
- Supabase URLとAnon Keyを確認
- RLSポリシーが有効か確認

### 単元が表示されない
- `scripts/seed-units.sql`を実行
- ブラウザのキャッシュをクリア

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Markdown**: react-markdown

## ライセンス

MIT
