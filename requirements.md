# 1. 概要
本ドキュメントは、リアルタイムクイズイベントで使用するWebアプリケーションの設計要件を定義する。

参加者はリアルタイムで出題される問題に回答し、管理者はクイズの進行を管理する。システムはCloudflareのEdgeコンピューティング環境に最適化され、多数の同時接続下での低遅延な体験を提供することを目的とする。

# 2. システム構成
アプリケーションはCloudflareプラットフォームのみで構成し、サーバーレスアーキテクチャを採用する。

- フロントエンド: Cloudflare Pages
  - Next.js (Pages Router) を用いて構築されたUI。参加者画面と管理画面を提供する。
- バックエンド (API): Cloudflare Functions
  - クイズのCRUD操作など、ステートレスなHTTPリクエストを処理する。
- バックエンド (リアルタイム): Cloudflare Worker + Durable Objects
  - WebSocketサーバーとして機能し、クイズセッション中の状態（現在の問題、接続ユーザーなど）をDurable Objectで管理する。
- データベース: Cloudflare D1
  - クイズの内容、ユーザーの回答結果などを保存するSQLデータベース。

コード スニペット

```
graph TD
    subgraph Browser
        User[参加者]
        Admin[管理画面]
    end

    subgraph Cloudflare
        CFDashboard[Cloudflare Pages]
        WO_DO[Worker + Durable Objects]
        CFF[Cloudflare Functions]
        D1[D1 Database]

        CFDashboard ==> |WebSocket| WO_DO
        CFDashboard ==> |HTTP API| CFF
        WO_DO --> CFF
        WO_DO <-->|CRUD| D1
        CFF <-->|CRUD| D1
    end

    User -.-> |WebSocket| CFDashboard
    Admin -.-> |HTTP/API| CFDashboard
```

# 3. 機能要件
## 3.1. 参加者向け機能
- クイズ参加: 指定されたURLからクイズセッションに参加できる。
  - 各参加者は、割り振られたIDのURLで、自身に一意のクイズページにアクセスできる
- リアルタイム表示: サーバーからのプッシュ通知により、問題の表示・切り替えが自動で行われる。
- 回答送信: 制限時間内に選択肢から回答を送信する。制限時間を過ぎると回答はできなくなる。
- 結果表示: 各問題の終了時に、正解・不正解が即座に表示される。
- 再接続復帰: 画面オフや通信断で WebSocket が切断された場合でも、再アクセス時に自動で現在の問題・残り時間・回答状況が同期され、参加者は即時に回答継続できる。

## 3.2. 管理者向け機能

- セッション管理:
  - 作成したクイズを開始し、参加用のURLを発行する。
  - 現在の参加者一覧と接続状況をリアルタイムで確認できる。
- リアルタイム進行管理:
  - 自動進行: 最初の問題を開始すると、以降は各問題に設定された時間で自動的に次の問題へ進行する。
  - 手動介入: 自動進行中であっても、管理画面から以下の操作を任意で行える。
    - 現在の問題を即時終了する。
    - 次の問題を即時開始する。
    - 特定の問題へスキップする。
- 結果閲覧: クイズ終了後、参加者の回答状況や正解率などを閲覧できる。

# 4. 技術要件
## 4.1. 主要技術スタック
言語: TypeScript

フレームワーク: Next.js (Pages Router)

インフラ: Cloudflare (Pages, Workers, Durable Objects, D1)

パッケージ管理: npm / pnpm / yarn

## 4.2. リアルタイム通信
プロトコル: WebSocketを採用する。

状態管理:

クイズセッションごとの状態（参加者リスト、現在の問題、タイマー等）は、QuizRoom Durable Object インスタンス内で管理する。

1つのクイズセッションが1つのDurable Objectインスタンスに対応する。

通信メッセージ (例):

client_to_server: submit_answer

server_to_client: quiz_start, question_start, question_end, answer_result, quiz_finish

## 4.3. 状態管理と復帰処理
ネットワーク切断からの復帰を考慮し、クライアントがWebSocketに接続・再接続した際、サーバー（Durable Object）は必ず現在のクイズの最新状態（現在の問題、残り時間など）を当該クライアントに送信する。

これにより、途中離脱した参加者が復帰した際に、即座に正しい画面状態に同期されることを保証する。

再接続時の期待フロー:

- 参加者がページを再読み込み、またはディスプレイ再点灯時にページへ戻ると、クライアントは既存の参加者IDで自動的にWebSocket接続を再確立する。
- サーバーは`session_ready`イベントで最新状態を返し、直後に進行中の`question_start`または`reveal`イベントを再送して画面表示を補正する。
- 締切直前に復帰した場合でも、残り時間と回答可否が正しく反映されるよう、Durable Objectでタイマー情報を再計算して配信する。
- 参加者が既に回答済みだった場合は、回答内容と結果表示がそのまま維持される。

## 4.4. インフラ管理とデプロイ
IaC: Cloudflareリソース（Worker, Durable Objects, D1のバインディング等）の定義は wrangler.toml ファイルで一元管理する。

コマンド集約: wrangler を用いた開発、ビルド、デプロイなどの各種コマンドは、すべてプロジェクトルートの package.json の scripts に集約する。

# 5. データベース設計（案）
テーブル名	カラム	説明
users id, name 参加者の管理
quizzes	id, title, description, created_at	クイズの基本情報
questions	id, quiz_id, text, order_index, time_limit_sec	各問題の内容と順序、制限時間
choices	id, question_id, text, is_correct	各問題の選択肢。is_correctで正解を指定
answers	id, session_id, question_id, user_id, choice_id, submitted_at	ユーザーごとの回答ログ
