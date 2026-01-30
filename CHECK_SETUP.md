# セットアップ確認チェックリスト

デプロイ前に以下を確認してください。

## 1. Vercel本番URLの確認

- [ ] Vercel Dashboard → プロジェクト → Domains で本番URLを確認
- [ ] 本番URLをメモ（例: `https://atama-vgy5.vercel.app`）

## 2. Vercel環境変数の設定

Vercel → Settings → Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` が設定されている
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定されている
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` が設定されている
- [ ] `NEXT_PUBLIC_SITE_URL` が本番URLに設定されている
- [ ] すべての環境変数で Production/Preview/Development が選択されている

## 3. Supabase URL Configuration

Supabase → Authentication → URL Configuration

### Site URL
- [ ] 本番URLが設定されている（例: `https://atama-vgy5.vercel.app`）

### Redirect URLs
以下がすべて追加されているか確認：

- [ ] `https://atama-vgy5.vercel.app/auth/callback`（本番URL）
- [ ] `https://atama-vgy5.vercel.app/**`（本番URL）
- [ ] `https://*.vercel.app/auth/callback`（すべてのPreview環境）
- [ ] `https://*.vercel.app/**`（すべてのPreview環境）
- [ ] `http://localhost:3000/auth/callback`（ローカル開発）
- [ ] `http://localhost:3000/**`（ローカル開発）

## 4. Supabase Google OAuth設定

Supabase → Authentication → Providers → Google

- [ ] Google OAuth が有効化されている
- [ ] Client ID が設定されている
- [ ] Client Secret が設定されている

## 5. Google Cloud Console設定

Google Cloud Console → APIとサービス → 認証情報

### 承認済みのリダイレクトURI
- [ ] `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback` が追加されている
  - 例: `https://dwcmkpdoqcbjlvsohh.supabase.co/auth/v1/callback`

## 6. デプロイ確認

- [ ] Vercelで最新のコミットがデプロイされている
- [ ] デプロイが成功している（緑のチェックマーク）
- [ ] ビルドエラーがない

## 7. 動作確認

### 環境変数の確認
本番URLにアクセス：
```
https://atama-vgy5.vercel.app/api/debug/env
```

期待される結果：
```json
{
  "NEXT_PUBLIC_SUPABASE_URL": "Set",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "Set",
  "NEXT_PUBLIC_GEMINI_API_KEY": "Set",
  "NEXT_PUBLIC_SITE_URL": "Set",
  "SUPABASE_URL_PREFIX": "https://dwcmkpdoqcbjlvsohh..."
}
```

- [ ] すべての環境変数が "Set" になっている
- [ ] SUPABASE_URL_PREFIX が正しいSupabase URLを示している

### ログインテスト
本番URLにアクセス：
```
https://atama-vgy5.vercel.app/login
```

- [ ] ログインページが表示される
- [ ] 「Googleアカウントでログイン」ボタンをクリック
- [ ] Google認証画面が表示される
- [ ] 認証後、`/subjects` ページにリダイレクトされる
- [ ] ローカルホストにリダイレクトされない

## トラブルシューティング

### 環境変数が "Missing" の場合
1. Vercel → Settings → Environment Variables を確認
2. 値が正しく入力されているか確認
3. Production/Preview/Development が選択されているか確認
4. 再デプロイを実行

### ローカルホストにリダイレクトされる場合
1. Supabase → Authentication → URL Configuration を確認
2. Site URL が本番URLになっているか確認
3. Redirect URLs に本番URLが追加されているか確認
4. 設定を保存して2-3分待つ

### "このサイトにアクセスできません" エラー
1. Supabase Redirect URLs に `https://*.vercel.app/auth/callback` を追加
2. Google Cloud Console のリダイレクトURIを確認
3. Supabase Project URL が正しいか確認

## 完了

すべてのチェックが完了したら、本番環境でログインをテストしてください！

問題が発生した場合は、このチェックリストを最初から確認してください。
