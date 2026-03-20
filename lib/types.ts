export type QuestionType = 'multiple-choice' | 'true-false' | 'open-answer'
export type Block = 1 | 2 | 3 | 4  // 4 = Maths supplement
export type StrictnessLevel = 'lenient' | 'balanced' | 'strict'
export type UserRole = 'student' | 'admin'

export interface FurtherReading {
  label: string    // e.g. "Block 1, Part 2, Section 2.4 - The language of computers"
  section: string  // e.g. "2.4"
  page: number     // e.g. 84
}

export interface Question {
  id: string
  block: Block
  topic: string
  type: QuestionType
  question: string
  options: string[]           // empty array for open-answer
  correct_index: number       // -1 for open-answer
  explanation: string
  topic_summary: string
  further_reading: FurtherReading[]
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
  user_id: string
}

export interface TopicStats {
  topic: string
  block: Block
  total_answers: number
  correct: number
  last_seen: string
  weakness_score: number  // 0.0 (strong) to 1.0 (weak)
  user_id: string
}

export interface QuizSession {
  block: Block | 'all'
  topic?: string
  questions: Question[]
  current_index: number
  answers: (number | null)[]
  open_answers: (string | null)[]
  score: number
}

export interface Profile {
  id: string
  display_name: string
  role: UserRole
  quiz_strictness: StrictnessLevel
}

export interface EvaluationResult {
  is_correct: boolean
  feedback: string
}

// Stored in sessionStorage after quiz completion for the results page
export interface SessionResult {
  block: Block | 'all'
  topic?: string
  score: number
  total: number
  answers: SessionAnswer[]
}

export interface SessionAnswer {
  questionId: string
  questionText: string
  topic: string
  block: number
  isCorrect: boolean
  selectedIndex: number | null
  openText: string | null
  aiFeedback?: string
  topicSummary: string
  furtherReading: FurtherReading[]
}
