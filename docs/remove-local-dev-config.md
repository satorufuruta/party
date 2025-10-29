# 本番運用のみへ切り替える際のローカル専用設定削除手順

ローカル開発向けに追加した API ベース URL の切り替えや CORS 許可設定を、本番運用のみの構成に戻す場合の作業手順です。以下の順番で進めてください。

## 前提
- 作業ブランチを用意し、変更内容をコミット管理できる状態にする。
- ローカル開発補助のために追加した以下の変更がリポジトリに含まれていることを前提としています。
  - `.env.local` による `NEXT_PUBLIC_API_BASE` の指定
  - `workers/index.ts` の `CORS_ALLOWED_ORIGINS` ハンドリング
- `src/lib/api.ts` のベース URL 解決ロジック
- README のローカル専用設定に関する記述

## 手順

1. **環境変数ファイルの削除**
   - `rm .env.local`
   - Cloudflare Worker 用に `.dev.vars` 等へ登録していた `CORS_ALLOWED_ORIGINS` も削除する。

2. **フロントエンド API クライアントのリセット**
   - `src/lib/api.ts` を開き、動的ベース URL 解決を削除して `/api/...` の相対パスだけを使う実装に戻す。
     - `API_BASE` 定数と `resolveApiUrl` 関数を削除。
     - `fetch(resolveApiUrl(path), …)` を `fetch(path, …)` に戻す。

3. **Worker の CORS ロジック削除**
   - `workers/index.ts` から `CORS_ALLOWED_ORIGINS` 関連の型・定数・関数（ワイルドカード許可を含む）を削除。
   - `OPTIONS` ハンドリングや `Access-Control-Allow-Origin` 付与など、ローカル向け CORS 設定を追加した箇所を元の挙動（同一オリジン前提）に戻す。

4. **ドキュメント整備**
   - `README.md` から `NEXT_PUBLIC_API_BASE` および `CORS_ALLOWED_ORIGINS` に関する記述を削除。
   - 他ドキュメントにローカル専用フローが残っていないか確認し、必要に応じて調整する。

5. **動作確認**
   - `npm run dev` を起動し、`http://localhost:3000` でアプリが正しく API にアクセスできることを確認。
   - Cloudflare Worker (`npm run cf:worker:dev`) を併用しない状態でも問題なく動作するかをチェック。

6. **コミット & 展開準備**
   - 変更をコミットし、リモートへプッシュ。
   - 必要に応じて CI/CD でビルド・デプロイが問題なく完了することを確認する。

## メモ
- 将来的に再びローカル専用設定を導入する可能性がある場合は、このドキュメントを残しておき、手戻りの際の参考にしてください。
- 既存の本番環境で CORS 設定が必要になる場合は、Cloudflare 側（Pages/Workers 設定）で適切なヘッダー付与を行うことを検討してください。
