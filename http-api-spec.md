# HTTP API Specification

Cloudflare Functions (Workers) で提供する REST API の責務と入出力フォーマットを定義する。Durable Object (QuizRoom) や D1 データベースと連携し、管理者 UI・参加者 UI が必要とする操作を一貫した形で提供する。

## 1. 基本設計
- ベースパス: `/api` (Cloudflare Pages から相対呼び出し)
- レスポンス形式: `application/json`
- エラーフォーマット: `{ "error": { "code": "...", "message": "...", "details": {...} } }`
- 認証/認可: 管理者 API は `Authorization: Bearer <token>` などの仕組みを導入予定 (実装時に確定)。
- 時刻: ISO 8601 (`2024-12-05T12:34:56.789Z`) または epoch ms。内部では epoch ms を保持し、クライアント向け JSON は ISO 8601 を推奨。

## 2. クイズ管理 API
### 2.1 `GET /api/quizzes`
- 概要: 管理者 UI で一覧表示用にクイズのサマリーを取得。
- クエリ: `?offset`, `?limit`
- レスポンス例:
```json
{
  "quizzes": [
    { "id": "quiz_1", "title": "年末パーティークイズ", "questionCount": 10, "createdAt": "2024-10-01T09:00:00Z" }
  ],
  "pagination": { "offset": 0, "limit": 20, "total": 35 }
}
```

### 2.2 `POST /api/quizzes`
- 概要: 新しいクイズを作成。
- リクエスト:
```json
{
  "title": "年末パーティー2024",
  "description": "忘年会向けクイズ",
  "questions": [
    {
      "text": "今年の社員旅行の行き先は?",
      "orderIndex": 0,
      "timeLimitSec": 20,
      "pendingResultSec": 5,
      "revealDurationSec": 5,
      "choices": [
        { "text": "沖縄", "isCorrect": true },
        { "text": "北海道", "isCorrect": false }
      ]
    }
  ]
}
```
- `pendingResultSec` は回答締切後に集計へ移るまでの待機時間 (秒)。
- `revealDurationSec` は結果表示を続ける待機時間 (秒)。いずれも未指定時は既定値を適用する。
- レスポンス `201 Created`:
```json
{
  "id": "quiz_1",
  "title": "年末パーティー2024",
  "questionCount": 1,
  "createdAt": "2024-10-01T09:00:00Z"
}
```

### 2.3 `GET /api/quizzes/:quizId`
- 概要: クイズ詳細を取得 (編集/閲覧用)。
- レスポンス例: questions/choices に加え `pendingResultSec`, `revealDurationSec` を含む。

### 2.4 `PUT /api/quizzes/:quizId`
- 概要: 既存クイズの編集。部分更新は `PATCH` で対応可。

### 2.5 `DELETE /api/quizzes/:quizId`
- 概要: クイズ削除。削除ポリシー(物理/論理)は実装時に決定。

## 3. セッション管理 API
### 3.1 `POST /api/quizzes/:quizId/sessions`
- 概要: 指定クイズで新しいリアルタイムセッションを生成。
- アクション: D1 で `sessions` 行を作成 → Durable Object を初期化し `sessionId` を返却。
- レスポンス `201 Created`:
```json
{
  "sessionId": "sess_abc",
  "quizId": "quiz_1",
  "joinUrl": "https://example.com/quiz/sess_abc",
  "adminUrl": "https://example.com/admin/sess_abc",
  "status": "lobby"
}
```

### 3.2 `POST /api/sessions/:sessionId/initialize`
- 概要: 生成済みセッションに対し、Durable Object を初期化してクイズ内容をロードする。
- リクエスト:
```json
{
  "quizId": "quiz_1"
}
```
- アクション: `QUIZ_ROOM_DO` に `sessionId` を名前指定して呼び出し、`/initialize` エンドポイントへフォワード。
- レスポンス: `202 Accepted`（即時開始しない）。クライアントは続けて `/start` などを呼び出す。

### 3.3 `GET /api/sessions/:sessionId`
- 概要: 管理画面がセッション情報を初期取得。Durable Object から最新状態をフェッチ。
- レスポンス例:
```json
{
  "sessionId": "sess_abc",
  "quizId": "quiz_1",
  "status": "question",
  "questionIndex": 1,
  "questionDeadline": "2024-12-05T12:34:56Z",
  "questionLockedAt": null,
  "questionRevealAt": null,
  "questionRevealEndsAt": null,
  "autoProgress": true,
  "participants": [
    {
      "userId": "u1",
      "displayName": "Alice",
      "connected": true,
      "answers": { "q1": { "choiceId": "c1", "submittedAt": "2024-12-05T12:31:00Z", "isCorrect": true } }
    }
  ]
}
```

### 3.4 `POST /api/sessions/:sessionId/start`
- 概要: 管理者がセッションを開始 (`startQuiz`)。
- アクション: Durable Object に開始コマンドを送信。成功時 `202 Accepted`。

### 3.5 `POST /api/sessions/:sessionId/advance`
- 概要: 進行中の問題を強制終了し次へ進める (`forceEndQuestion` + 次開始)。
- リクエスト例: `{ "action": "next" }` または `{ "action": "skip", "questionIndex": 4 }`
- レスポンス: `202 Accepted`

### 3.6 `POST /api/sessions/:sessionId/cancel`
- 概要: セッションを終了 (`cancelQuiz`)。
- アクション: DO と D1 状態更新。

### 3.7 `POST /api/sessions/:sessionId/participants`
- 概要: 管理者が事前に参加者登録する場合用のエンドポイント (任意)。
- リクエスト例: `{ "participants": [{ "userId": "u1", "displayName": "Alice" }] }`

## 4. 結果閲覧 API
### 4.1 `GET /api/sessions/:sessionId/results`
- 概要: クイズ終了後に参加者のスコアや回答履歴を取得。
- 備考: 参加者は `score` の降順、同点の場合は `totalElapsedMs` が小さい順でソートされる。
- レスポンス例:
```json
{
  "sessionId": "sess_abc",
  "summary": {
    "totalParticipants": 30,
    "averageScore": 7.2
  },
  "participants": [
    {
      "userId": "u1",
      "displayName": "Alice",
      "score": 8,
      "totalElapsedMs": 9250,
      "answers": [
        {
          "questionId": "q1",
          "choiceId": "c1",
          "isCorrect": true,
          "submittedAt": "2024-12-05T12:31:00Z",
          "elapsedMs": 3200
        }
      ]
    }
  ]
}
```

### 4.2 `GET /api/quizzes/:quizId/results`
- 概要: 過去のセッションの集計 (オプション)。

## 5. 参加者向けユーティリティ API
参加者は主に WebSocket を利用するが、クライアント初期化や待機画面に HTTP API を併用できる。

### 5.1 `GET /api/sessions/:sessionId/participants/:participantId`
- 概要: 参加者が参加URLアクセス時に自身の基本情報を取得。
- レスポンス例: `{ "userId": "u1", "displayName": "Alice", "status": "lobby" }`

### 5.2 `POST /api/sessions/:sessionId/participants/:participantId/ack`
- 概要: WebSocket 接続前に参加を確定させる場合の任意のエンドポイント。

## 6. エラーコード例
| code | 説明 |
| --- | --- |
| `quiz_not_found` | 指定されたクイズが存在しない |
| `session_conflict` | セッション状態が遷移できない (例: すでに開始済み) |
| `invalid_action` | 指定された管理操作が不正 |
| `not_authorized` | 認証エラー |
| `validation_failed` | 入力バリデーションエラー |

## 7. Durable Object との連携
- セッション系エンドポイントは Durable Object の `fetch` を内部で呼び出し、WebSocket と共通のコマンドを利用する。
- HTTP API では結果を JSON で返却し、リアルタイム通知は WebSocket イベントで補完。
- 冪等性: `start`, `advance`, `cancel` などの操作はリクエスト ID をヘッダーに持たせて再送時の重複実行を防ぐ。

## 8. 今後の検討事項
- 認証方式 (管理者トークン、参加者用 URL の署名など)。
- レート制限と監査ログ。
- 参加者のプレゲーム情報 (アバター、事前アンケート) を扱う場合の追加エンドポイント。
