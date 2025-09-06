-- Tabela para armazenar respostas dos alunos
CREATE TABLE IF NOT EXISTS evaluation_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES evaluation_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
  answer_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS evaluation_answers_attempt_id_idx ON evaluation_answers(attempt_id);
CREATE INDEX IF NOT EXISTS evaluation_answers_question_id_idx ON evaluation_answers(question_id);

-- RLS
ALTER TABLE evaluation_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Students can view own answers" ON evaluation_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_attempts 
      WHERE evaluation_attempts.id = evaluation_answers.attempt_id 
      AND evaluation_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers and admins can view answers" ON evaluation_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );