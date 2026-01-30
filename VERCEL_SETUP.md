# Vercelデプロイ設定ガイド

## 必須環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

### 1. Vercelダッシュボードにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動

### 2. 環境変数を追加

以下の環境変数を**すべて**追加してください：

#### NEXT_PUBLIC_SUPABASE_URL
- **値**: あなたのSupabaseプロジェクトURL
- **例**: `https://abcdefghijklmnop.supabase.co`
- **取得方法**: Supabaseダッシュボード → Settings → API → Project URL

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **値**: あなたのSupabase匿名キー
- **例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **取得方法**: Supabaseダッシュボード → Settings → API → Project API keys → anon public

#### NEXT_PUBLIC_GEMINI_API_KEY
- **値**: Google Gemini APIキー
- **例**: `AIzaSyD...`
- **取得方法**: [Google AI Studio](https://makersuite.google.com/app/apikey)

#### NEXT_PUBLIC_SITE_URL
- **値**: あなたのVercelデプロイURL
- **例**: `https://atama-gilt.vercel.app`
- **注意**: プロトコル（https://）を含めてください

### 3. 環境変数の適用範囲

各環境変数に対して、以下の環境を選択してください：
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. 再デプロイ

環境変数を追加した後、必ず再デプロイしてください：

1. **Deployments** タブに移動
2. 最新のデプロイメントの右側にある **...** メニューをクリック
3. **Redeploy** を選択
4. **Redeploy** ボタンをクリック

## Supabase側の設定

### 1. URL Configuration

Supabaseダッシュボード → Authentication → URL Configuration

- **Site URL**: `https://atama-gilt.vercel.app`
- **Redirect URLs** に追加:
  - `https://atama-gilt.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (ローカル開発用)

### 2. Google OAuth設定

Supabaseダッシュボード → Authentication → Providers → Google

1. **Enable** をオンにする
2. Google Cloud Consoleで取得した以下を入力:
   - Client ID
   - Client Secret

### 3. Google Cloud Console設定

[Google Cloud Console](https://console.cloud.google.com/)

1. プロジェクトを選択
2. **APIとサービス** → **認証情報**
3. OAuth 2.0 クライアントIDを選択
4. **承認済みのリダイレクトURI** に追加:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - 例: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

## トラブルシューティング

### エラー: "placeholder.supabase.co"が表示される

**原因**: 環境変数が設定されていない、または反映されていない

**解決方法**:
1. Vercelダッシュボードで環境変数が正しく設定されているか確認
2. 環境変数の値に`placeholder`が含まれていないか確認
3. 再デプロイを実行

### エラー: "このサイトにアクセスできません"

**原因**: SupabaseのRedirect URLsが正しく設定されていない

**解決方法**:
1. Supabase → Authentication → URL Configuration を確認
2. Redirect URLsに正しいURLが追加されているか確認
3. Google Cloud ConsoleのリダイレクトURIを確認

### ログインボタンを押しても反応しない

**原因**: Google OAuthが有効化されていない

**解決方法**:
1. Supabase → Authentication → Providers → Google を確認
2. Enabledになっているか確認
3. Client IDとClient Secretが正しく設定されているか確認

## 確認チェックリスト

デプロイ前に以下を確認してください：

- [ ] Vercelに4つの環境変数を設定した
- [ ] 環境変数の適用範囲をProduction/Preview/Developmentに設定した
- [ ] SupabaseのSite URLを設定した
- [ ] SupabaseのRedirect URLsを設定した
- [ ] Google OAuthを有効化した
- [ ] Google Cloud ConsoleのリダイレクトURIを設定した
- [ ] Vercelで再デプロイを実行した

すべてチェックが完了したら、デプロイされたアプリにアクセスしてログインをテストしてください。
