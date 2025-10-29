# Party Quiz Application

Cloudflare プラットフォームに最適化したリアルタイムクイズアプリのフロントエンド/バックエンドを同一リポジトリで管理する。Next.js (Pages Router) をベースに UI を構築し、Cloudflare Workers・Durable Objects・D1 でリアルタイム制御とデータ永続化を行う。

## 開発フロー

### Next.js UI (ローカル)
```bash
npm install
npm run dev
```
`http://localhost:3000` で参加者/管理者 UI の開発を行う。

Cloudflare Worker を別ポートで動かす場合は、Next.js 側の環境変数で API ベース URL を切り替えられる。
`.env.local` に `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8787` などを設定すると、フロントエンドが指定先の Worker へ API リクエストを送る。
ローカルの Worker 側では `wrangler dev` の `.dev.vars` などに `CORS_ALLOWED_ORIGINS` を設定することで、必要に応じてアクセス元のオリジンを調整できる（未設定時はすべてのオリジンを許可）。

### Cloudflare Workers / Durable Objects
```bash
npm run cf:worker:dev         # wrangler dev --local	nodejs_compat で Worker を起動
npm run cf:worker:deploy      # wrangler deploy		本番/preview デプロイ
```
- エントリーポイントは `workers/index.ts`。
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

## データ初期化と参加者リンク
- `migrations/0002_seed.sql` にあらかじめクイズ問題と参加ユーザーを投入するシードを用意している。参加者を追加する場合はこのシードを更新し、`wrangler d1 migrations apply` で反映する。
- 参加者は事前配布した URL（形式: `/quiz/{userId}`）からアクセスし、ブラウザが割り当て済みの `userId` と環境変数で固定された `sessionId` を用いて自動的にセッションへ参加する。名前入力フォームは存在しない。
- 管理画面（`/admin/[sessionId]`）では `/api/users` から取得したユーザー一覧を基に参加者用 URL を表示する。セッション作成後にこのリストを配布すれば、各参加者が該当ページで回答できる。
- セッション ID は `DEFAULT_SESSION_ID`（Workers）/`NEXT_PUBLIC_DEFAULT_SESSION_ID`（Next.js）環境変数で指定できる。デフォルトは `quiz1102` で、事前に共有したい場合は環境ごとに同じ値を設定する。

## 必要なツール
- Node.js 18 以上
- npm / pnpm / yarn (本プロジェクトは npm lockfile を使用)
- Cloudflare `wrangler` CLI v3 (`npm install` 実行時にローカルへインストール)

## ドキュメント
- `requirements.md`: 参加者/管理者向け要件、再接続時の挙動などを定義。
- `implementation-sequence.md`: 開発フェーズの全体像。
- `quiz-state-protocol.md`: Durable Object の状態設計と WebSocket プロトコル仕様。

各ドキュメントを更新しながら、Cloudflare 環境へのデプロイ準備と実装を進める。
