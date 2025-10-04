export type ISODateString = string;

export interface UserRecord {
  id: string;
  name: string;
  display_name: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface QuizRecord {
  id: string;
  title: string;
  description: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface QuestionRecord {
  id: string;
  quiz_id: string;
  text: string;
  order_index: number;
  time_limit_sec: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ChoiceRecord {
  id: string;
  question_id: string;
  text: string;
  is_correct: 0 | 1;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface SessionRecord {
  id: string;
  quiz_id: string;
  status: string;
  auto_progress: 0 | 1;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface AnswerRecord {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  choice_id: string;
  submitted_at: ISODateString;
}
