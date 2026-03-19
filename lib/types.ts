export type QuestionType = 'multiple-choice' | 'true-false'
export type Block = 1 | 2 | 3

export interface Question {
  id: string
  block: Block
  topic: string
  type: QuestionType
  question: string
  options: string[]
  correct_index: number
  explanation: string
  source: 'hardcoded' | 'ai-generated'
  created_at: string
}

export interface AnswerLog {
  id: string
  question_id: string
  block: Block
  topic: string
  is_correct: boolean
  answered_at: string
}

export interface TopicStats {
  topic: string
  block: Block
  total_answers: number
  correct: number
  last_seen: string
  weakness_score: number // 0.0 (strong) → 1.0 (weak)
}

export interface QuizSession {
  block: Block | 'all'
  questions: Question[]
  current_index: number
  answers: (number | null)[]
  score: number
}
