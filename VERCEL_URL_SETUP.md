# Vercel URL設定ガイド

## URLの種類

Vercelには3種類のURLがあります：

### 1. Production URL（本番URL）
- **形式**: `https://your-project.vercel.app`
- **例**: `https://atama-vgy5.vercel.app`
- **用途**: 本番環境、mainブランチのデプロイ
- **確認方法**: Vercel Dashboard → プロジェクト → Domains

### 2. Preview URL（プレビューURL）
- **形式**: `https://your-project-xxx-team.vercel.app`
- **例**: `https://atama-vgy5-cn9wd0sq6-hakas-projects-cfdb1d2a.vercel.app`
- **用途**: プルリクエストやブランチのプレビュー
- **特徴**: デプロイごとに変わる

### 3. Custom Domain（カスタムドメイン）
- **形式**: `https://yourdomain.com`
- **用途**: 独自ドメインを使用する場合

## 本番URLの確認方法

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト（atama-vgy5）を選択
3. 上部の **Domains** タブをクリック
4. **Production Domain** を確認（通常は `*.vercel.app` 形式）

## Supabase設定の更新

本番URLを確認したら、Supabaseの設定を更新してください：

### 1. Site URL
Supabase → Authentication → URL Configuration → Site URL

```
https://atama-vgy5.vercel.app
```
（実際の本番URLに置き換えてください）

### 2. Redirect URLs
以下をすべて追加：

```
https://atama-vgy5.vercel.app/auth/callback
https://atama-vgy5.vercel.app/**
https://*.vercel.app/auth/callback
http://localhost:3000/auth/callback
http://localhost:3000/**
```

⚠️ **重要**: `https://*.vercel.app/auth/callback` を追加すると、すべてのPreview環境でも認証が動作します。

## Vercel環境変数の更新

Vercel → Settings → Environment Variables

### NEXT_PUBLIC_SITE_URL
本番URLを設定：
```
https://atama-vgy5.vercel.app
```

## トラブルシューティング

### Preview URLでログインできない

**原因**: Preview URLは毎回変わるため、Supabaseに登録できない

**解決方法**:
1. Supabaseの Redirect URLs に `https://*.vercel.app/auth/callback` を追加
2. または、本番URL（`https://atama-vgy5.vercel.app`）を使用してテスト

### 本番URLがわからない

**確認方法**:
1. Vercel Dashboard → プロジェクト
2. 最新のProduction Deploymentをクリック
3. 上部に表示されているURLを確認
4. または、Domainsタブで確認

## 推奨設定

開発とテストをスムーズに行うため、以下の設定を推奨します：

### Supabase Redirect URLs
```
https://atama-vgy5.vercel.app/auth/callback
https://atama-vgy5.vercel.app/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

これにより、本番・Preview・ローカルすべての環境で認証が動作します。
