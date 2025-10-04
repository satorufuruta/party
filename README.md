# Party Quiz Application

Cloudflare プラットフォームに最適化したリアルタイムクイズアプリのフロントエンド/バックエンドを同一リポジトリで管理する。Next.js (Pages Router) をベースに UI を構築し、Cloudflare Workers・Durable Objects・D1 でリアルタイム制御とデータ永続化を行う。

## 開発フロー

### Next.js UI (ローカル)
```bash
npm install
npm run dev
```
`http://localhost:3000` で参加者/管理者 UI の開発を行う。

### Cloudflare Workers / Durable Objects
```bash
npm run cf:worker:dev         # wrangler dev --local	nodejs_compat で Worker を起動
npm run cf:worker:deploy      # wrangler deploy		本番/preview デプロイ
```
- エントリーポイントは `workers/index.ts` (未作成の場合は今後実装)。
- Durable Object `QuizRoomDurableObject` や D1 バインディングは `wrangler.toml` で管理。

### Cloudflare Pages
```bash
npm run build                 # Next.js ビルド (Turbopack)
npm run cf:pages:dev          # wrangler pages dev
npm run cf:pages:deploy       # wrangler pages deploy
```
- `wrangler.toml` の `[pages]` 設定に基づき、`.vercel/output/static` を配信ターゲットとして利用予定。
- Pages dev では内部で `npm run dev` を併用する想定 (必要に応じて別ターミナルで実行)。

### D1 マイグレーション
```bash
npm run cf:d1:migration:create -- --name init-schema
npm run cf:d1:migrate         # 本番環境の D1 に適用 (database_id 要設定)
npm run cf:d1:migrate:dev     # dev 環境の D1 に適用 (--env dev)
```
- `wrangler.toml` の `database_id` は Cloudflare ダッシュボードで作成後に設定する。
- ローカル開発 (`--local`) では `wrangler` が一時的な SQLite を使用する。

## 必要なツール
- Node.js 18 以上
- npm / pnpm / yarn (本プロジェクトは npm lockfile を使用)
- Cloudflare `wrangler` CLI v3 (`npm install` 実行時にローカルへインストール)

## ドキュメント
- `requirements.md`: 参加者/管理者向け要件、再接続時の挙動などを定義。
- `implementation-sequence.md`: 開発フェーズの全体像。
- `quiz-state-protocol.md`: Durable Object の状態設計と WebSocket プロトコル仕様。

各ドキュメントを更新しながら、Cloudflare 環境へのデプロイ準備と実装を進める。
