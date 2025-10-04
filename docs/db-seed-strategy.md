# D1 Seed Strategy

開発・テストで共通して利用できる初期データ投入手順を整理する。Cloudflare D1 は SQLite ベースのため、`wrangler d1` コマンドで SQL ファイルを適用する運用を想定する。

## 1. シードデータの構造
- `seeds/` ディレクトリを作成し、用途別に SQL ファイルを分割する。
  - `seeds/base.sql`: users/quizzes/questions/choices の共通データ。
  - `seeds/demo_session.sql`: デモ用セッション・回答データ。
- 各 SQL ファイルは `INSERT ... ON CONFLICT DO NOTHING` で冪等化する。

## 2. 適用コマンド
```bash
# dev (ローカル SQLite) への適用
wrangler d1 execute party-db --local --file=seeds/base.sql
wrangler d1 execute party-db --local --file=seeds/demo_session.sql

# dev 環境 (Cloudflare) への適用
wrangler d1 execute party-db --env dev --file=seeds/base.sql
```
- 本番環境には明示的な承認フロー後に適用する。
- CI での e2e テスト用には `--local` を使用し、テスト開始前にシードする。

## 3. ID 採番ポリシー
- レコード ID は UUID v4 を推奨 (アプリ側で生成)。
- マイグレーションやシード内で固定 ID を利用する場合は、`quiz_demo` など読みやすいスラッグを採用し、環境間で一貫させる。

## 4. テスト観点
- 自動テストでは `wrangler d1 create --local` で一時データベースを作り、マイグレーション → シード → テスト → クリーンアップの順で実行。
- 回答データは多様な正答/誤答パターンを含めて、集計ロジックやランキングのテストケースを準備する。

## 5. 今後のタスク
- `seeds/` ディレクトリとサンプル SQL を追加。
- npm スクリプトに `cf:d1:seed` などのコマンドを登録し、運用を統一。
- データ量が増えた場合は、CSV 取り込みや独自シードスクリプト (TypeScript) も検討する。
