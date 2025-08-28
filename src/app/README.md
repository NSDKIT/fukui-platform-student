# Next.js Dashboard App - 声キャン！

ViteベースのReactアプリケーションをNext.js 15に正常に移行しました。

## 🚀 移行完了内容

### ✅ 技術スタック
- **Next.js 15** - 最新のApp Routerを使用
- **React 19** - 最新バージョンに更新
- **TypeScript** - 型安全性を維持
- **Tailwind CSS** - スタイリングシステム
- **Supabase** - 認証とデータベース
- **Framer Motion** - アニメーション
- **Lucide React** - アイコンライブラリ

### 🔧 主な変更点

1. **プロジェクト構造の変更**
   - `src/App.tsx` → `app/page.tsx`
   - `src/main.tsx` → `app/layout.tsx`
   - Vite設定 → Next.js設定

2. **環境変数の更新**
   - `VITE_*` → `NEXT_PUBLIC_*`
   - `.env.local`ファイルで管理

3. **設定ファイルの最適化**
   - `next.config.js` - Next.js設定
   - `tsconfig.json` - TypeScript設定
   - `tailwind.config.js` - Tailwind CSS設定
   - `postcss.config.js` - PostCSS設定

## 🏃‍♂️ 開発サーバーの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番サーバーの起動
npm start
```

## 🌐 アクセス

開発サーバー起動後、以下のURLでアクセスできます：
- http://localhost:3000 (または利用可能なポート)

## 📱 機能

- **ウェルカム画面** - 美しいアニメーション付きランディングページ
- **認証システム** - Supabaseを使用したログイン・新規登録
- **ダッシュボード** - 役割別のダッシュボード表示
  - Monitor Dashboard
  - Client Dashboard  
  - Admin Dashboard
  - Support Dashboard

## 🔐 環境変数

`.env.local`ファイルに以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📦 デプロイ

このアプリケーションは以下のプラットフォームにデプロイできます：
- Vercel (推奨)
- Netlify
- AWS Amplify
- その他のNext.js対応ホスティングサービス

## 🎯 移行成功

✅ Vite + React → Next.js 15への完全移行完了
✅ 全機能の動作確認済み
✅ 美しいUI/UXの維持
✅ 認証フローの正常動作
✅ レスポンシブデザイン対応

