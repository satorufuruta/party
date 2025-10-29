-- Seed data for party quiz application

-- Users (3)
INSERT INTO users (id, name, display_name, public_id)
VALUES
  ('user-0', 'テスト', 'テスト', '123e4567-e89b-12d3-a456-426614174000'),
  ('user-1', '古田悟', '古田 悟', 'cbb0a0b2-3f44-4ef6-9d3f-18e9f0b5d602'),
  ('user-2', '中野藍美', '中野 藍美', 'd177abd0-5e59-4dd6-93b9-6274957332fb'),
  ('user-3', '古田誠', '古田 誠', '37b04b2d-e3df-425f-88df-8036f2fa14de');

-- Quiz (1)
INSERT INTO quizzes (id, title, description)
VALUES
  ('quiz-1', 'General Knowledge', 'Sample quiz with three questions');

INSERT INTO questions (id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, pending_result_sec)
VALUES
  ('q-1', 'quiz-1', '新郎の好きな食べ物は?', 1, 30, 20, 5),
  ('q-2', 'quiz-1', '新婦の好きな果物は?', 2, 30, 20, 5),
  ('q-3', 'quiz-1', '新郎の趣味は?', 3, 30, 20, 5);

-- Choices (4) for each question
-- q-1 choices
INSERT INTO choices (id, question_id, text, is_correct)
VALUES
  ('c-1-1', 'q-1', 'ゴーヤ', 0),
  ('c-1-2', 'q-1', 'キャベツ', 0),
  ('c-1-3', 'q-1', 'ラーメン', 1),
  ('c-1-4', 'q-1', '味噌汁', 0),
  ('c-2-1', 'q-2', 'パイナップル', 0),
  ('c-2-2', 'q-2', 'バナナ', 0),
  ('c-2-3', 'q-2', 'キウイフルーツ', 0),
  ('c-2-4', 'q-2', '桃', 1),
  ('c-3-1', 'q-3', '読書', 0),
  ('c-3-2', 'q-3', 'ゲーム', 0),
  ('c-3-3', 'q-3', 'バイク', 1),
  ('c-3-4', 'q-3', 'カメラ', 0);
