# 技術スタック

## 1. 全体構成

```
[React + Vite (SPA)] ──JWT付きAPI呼び出し──> [NestJS (Node.js)] ──> [PostgreSQL]
   Cloudflare Workers                         Google Cloud Run         Supabase
        │                                           │
        └─ ログイン ─> [Supabase Auth]               ├─ JWTを検証 (JWKS)
                                                    ├─ PDF生成 (Playwright / Chromium)
                                                    └─ 証明写真 ─> [Supabase Storage (非公開)]
```

- フロントエンドとバックエンドを分離する。フロントエンドは DB に直接アクセスせず、すべて API を経由する
- 言語は TypeScript で統一する

## 2. リポジトリ構成

pnpm workspaces によるモノレポ。

```
apps/
  web/       # React + Vite
  api/       # NestJS
packages/
  shared/    # zod スキーマ・型・定数（web と api で共有）
docs/
```

## 3. 採用技術

| 領域 | 採用技術 | 備考 |
|---|---|---|
| パッケージ管理 | pnpm（workspaces） | |
| フロントエンド | React, Vite, TypeScript | SPA |
| ルーティング | React Router | |
| サーバー状態 | TanStack Query | |
| フォーム | React Hook Form + zod | スキーマは `packages/shared` のものを使う |
| バックエンド | NestJS | Controller / Service / Repository のレイヤー構成 |
| 入力チェック（API） | nestjs-zod | `packages/shared` の zod スキーマから DTO を作る |
| API仕様 | @nestjs/swagger（OpenAPI） | |
| APIクライアント | openapi-typescript + openapi-fetch | OpenAPI からフロントの型を生成する |
| DB | PostgreSQL（Supabase） | |
| ORM・マイグレーション | Prisma（prisma migrate） | NestJS 公式ドキュメントの手順に沿って PrismaService を作る |
| 認証 | Supabase Auth | API は NestJS の Guard で JWT を JWKS 検証する（jose） |
| ファイル保存 | Supabase Storage（非公開バケット） | 写真の表示には API が署名付きURLを発行する |
| PDF生成 | HTML/CSS → Playwright（Chromium） | API 側で生成する。詳細は試作で確定させる |
| テスト | Vitest | E2E は必要になってから検討 |
| Lint・フォーマット | Biome | |
| CI | GitHub Actions | lint・型チェック・テスト |

## 4. デプロイ

| 対象 | デプロイ先 | 備考 |
|---|---|---|
| web | Cloudflare Workers（Static Assets） | ビルドした静的ファイルを配信する。`not_found_handling = "single-page-application"` で SPA のルーティングに対応。Workers の静的ファイル配信は無料プランで無料・無制限 |
| api | Google Cloud Run | Chromium を含む Docker イメージ。最小インスタンス数は 0 |
| DB・認証・ストレージ | Supabase（無料プラン） | |

## 5. 認可の方針
- API は JWT の `sub`（Supabase のユーザーID）をログインユーザーとして扱う
- DB の全テーブルに `user_id` を持たせ、API のすべてのクエリで `user_id` を絞り込む
- 保険として Supabase の RLS も有効にし、API 用の接続以外からは読み書きできないようにする
- 自分以外のアカウントを作れないよう、Supabase Auth の新規登録を無効化する

## 6. 運用上の注意
- **Supabase の無料プロジェクトは、1週間アクセスがないと一時停止する。** 停止したらダッシュボードから再開する。不便なら DB を Neon に移すことを検討する
- **Cloud Run は無料枠内でも請求先アカウントの登録が必要。** 予算アラートを設定する
- **Supabase の直接接続（Direct connection）は IPv6 のみ。** Cloud Run から接続するときは Supabase の接続プーラー（Supavisor）の接続文字列を使う
- Cloud Run は停止状態から起動するため、しばらくぶりのアクセスでは数秒待たされる（NestJS と Chromium の起動が重め）

## 7. 未決事項
- [ ] PDF生成方式を試作で検証する（日本語フォントの埋め込み、厚労省様式の罫線の再現性、Cloud Run 上でのメモリ量・生成時間）
  - 履歴書は、配布されている Excel を寸法の見本にして HTML/CSS で再現する方針（Excel テンプレートに書き込んで変換する方式は、フォントの置き換えによるずれや行数の制御が難しいため採らない）
