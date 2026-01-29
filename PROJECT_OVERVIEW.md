# SmartTutor AI - プロジェクト概要

## プロジェクトの目的

高校生向けのAI学習プラットフォームを構築し、学習効率の最大化と視覚的に楽しく集中しやすい学習体験を提供します。

## 主要機能

### 1. 教科・単元別のAI講義＆演習
- 10教科に対応（英語、数学、理科、社会など）
- AIによる動的な問題生成
- 難易度別（初級・中級・上級）のコンテンツ
- 詳細な解説とフィードバック

### 2. 学習進捗の可視化
- 日次学習時間のグラフ表示
- 教科別学習時間の円グラフ
- 正答率の追跡
- 学習記録の自動保存

### 3. パーソナライズされた学習サポート
- 過去の誤答データに基づく問題生成
- AIによる苦手箇所の分析
- 復習が必要な単元の自動推奨
- 優先度付きの復習リスト

### 4. マルチデバイス同期
- Googleアカウントでのログイン
- 学習履歴の自動同期
- 設定の同期（テーマなど）

### 5. テーマ切り替え
- ホワイト（明るい）
- ダーク（暗い）
- ブラック（真っ黒）
- 灰色（グレー）

## 技術スタック

### フロントエンド
- **Next.js 15**: React フレームワーク（App Router）
- **TypeScript**: 型安全性
- **Tailwind CSS**: ユーティリティファーストCSS
- **shadcn/ui**: 再利用可能なUIコンポーネント
- **Framer Motion**: アニメーション
- **Lucide Icons**: アイコンライブラリ
- **next-themes**: テーマ管理

### バックエンド
- **Supabase**: 認証とデータベース
  - PostgreSQL データベース
  - Row Level Security (RLS)
  - Google OAuth 連携
  
### AI
- **Google Gemini 2.0 Flash**: 
  - 講義コンテンツの生成
  - 演習問題の生成
  - 回答の評価と解説
  - 単元検索のサジェスト

### データ可視化
- **Recharts**: グラフとチャート

## プロジェクト構造

```
smart-tutor-ai/
├── app/                      # Next.js App Router
│   ├── dashboard/           # ダッシュボードページ
│   ├── login/               # ログインページ
│   ├── study/[subject]/     # 学習ページ（動的ルート）
│   ├── subjects/            # 教科選択ページ
│   ├── globals.css          # グローバルスタイル（テーマ定義）
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # ホームページ（リダイレクト）
│
├── components/              # Reactコンポーネント
│   ├── ui/                  # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   ├── header.tsx           # ヘッダーコンポーネント
│   ├── theme-provider.tsx   # テーマプロバイダー
│   └── theme-toggle.tsx     # テーマ切り替えボタン
│
├── lib/                     # ユーティリティとロジック
│   ├── gemini.ts            # Gemini AI関連の関数
│   ├── supabase.ts          # Supabase設定と型定義
│   └── utils.ts             # ユーティリティ関数
│
├── public/                  # 静的ファイル
│
├── .env.example             # 環境変数のテンプレート
├── supabase-schema.sql      # データベーススキーマ
├── package.json             # 依存関係
├── tailwind.config.ts       # Tailwind CSS設定
├── tsconfig.json            # TypeScript設定
├── next.config.ts           # Next.js設定
├── README.md                # プロジェクト説明
├── SETUP.md                 # セットアップガイド
└── PROJECT_OVERVIEW.md      # このファイル
```

## データベーススキーマ

### profiles テーブル
ユーザーのプロフィール情報を保存
- `id`: ユーザーID（UUID）
- `email`: メールアドレス
- `full_name`: フルネーム
- `theme`: 選択中のテーマ
- `created_at`: 作成日時
- `updated_at`: 更新日時

### study_logs テーブル
学習履歴を保存
- `id`: ログID（UUID）
- `user_id`: ユーザーID
- `subject`: 教科
- `unit`: 単元
- `mode`: モード（lecture/practice）
- `difficulty`: 難易度
- `question`: 問題文
- `answer`: 回答
- `is_correct`: 正誤
- `ai_explanation`: AI解説
- `study_time`: 学習時間（秒）
- `created_at`: 作成日時

### todo_list テーブル
復習リストを保存
- `id`: TodoID（UUID）
- `user_id`: ユーザーID
- `subject`: 教科
- `unit`: 単元
- `priority`: 優先度（high/medium/low）
- `reason`: 理由
- `completed`: 完了フラグ
- `created_at`: 作成日時

## UI/UX設計の原則

### 1. ミニマル＆クリーン
- 学習に集中できるシンプルなデザイン
- 不要な要素を排除
- 余白を効果的に活用

### 2. 直感的な操作性
- 明確なナビゲーション
- 一貫したUIパターン
- 分かりやすいアイコンとラベル

### 3. アクセシビリティ
- テーマ切り替え機能
- 十分なコントラスト比
- キーボードナビゲーション対応

### 4. レスポンシブデザイン
- スマートフォン対応
- タブレット対応
- デスクトップ対応

### 5. フィードバックの明確化
- 正誤の視覚的表示
- ローディング状態の表示
- アニメーションによる状態変化

## AI機能の詳細

### 講義モード
- 単元の重要ポイントを抽出
- 詳細な解説を生成
- キーワードのハイライト
- 理解を深めるヒント

### 演習モード
- 難易度に応じた問題生成
- 過去の誤答を考慮したパーソナライズ
- 詳細な採点と解説
- 励ましのフィードバック

### 単元検索
- 曖昧なキーワードから適切な単元を推奨
- 複数の候補を提示
- 推奨理由の説明

## パフォーマンス最適化

- Server Components の活用
- 画像の最適化
- コード分割
- キャッシング戦略

## セキュリティ

- Row Level Security (RLS) による データアクセス制御
- 環境変数による機密情報の管理
- OAuth 2.0 による安全な認証
- HTTPS 通信

## 今後の拡張可能性

### 機能追加
- 学習目標の設定
- 学習リマインダー
- 友達との学習記録共有
- 学習バッジ・実績システム
- 音声読み上げ機能
- オフラインモード

### AI機能の強化
- より高度なパーソナライゼーション
- 学習スタイルの分析
- 最適な学習時間の提案
- 画像・図解の自動生成

### データ分析
- 学習パターンの分析
- 弱点の詳細分析
- 学習効率の可視化
- 予測モデルの構築

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 作成者

SmartTutor AI Development Team
