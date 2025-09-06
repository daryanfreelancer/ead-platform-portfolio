-- Migração: Sistema de Avaliações
-- Data: 2025-08-15
-- Descrição: Cria estrutura completa para avaliações, questões e respostas

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  time_limit INTEGER, -- tempo limite em minutos (null = sem limite)
  max_attempts INTEGER DEFAULT 1, -- número máximo de tentativas
  passing_score DECIMAL(5,2) DEFAULT 70.00, -- nota mínima para aprovação (0-100)
  randomize_questions BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para evaluations
CREATE INDEX IF NOT EXISTS evaluations_course_id_idx ON evaluations(course_id);
CREATE INDEX IF NOT EXISTS evaluations_lesson_id_idx ON evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS evaluations_is_active_idx ON evaluations(is_active);

-- Constraint única para evaluations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'evaluations_course_id_title_unique'
    ) THEN
        ALTER TABLE evaluations ADD CONSTRAINT evaluations_course_id_title_unique UNIQUE (course_id, title);
    END IF;
END $$;

-- Tabela de questões
CREATE TABLE IF NOT EXISTS evaluation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),
  points DECIMAL(5,2) DEFAULT 1.00,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT, -- explicação da resposta correta
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para evaluation_questions
CREATE INDEX IF NOT EXISTS evaluation_questions_evaluation_id_idx ON evaluation_questions(evaluation_id);
CREATE INDEX IF NOT EXISTS evaluation_questions_order_idx ON evaluation_questions(order_index);

-- Tabela de opções de questões (para múltipla escolha e verdadeiro/falso)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT, -- explicação específica da opção
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para question_options
CREATE INDEX IF NOT EXISTS question_options_question_id_idx ON question_options(question_id);
CREATE INDEX IF NOT EXISTS question_options_order_idx ON question_options(order_index);

-- Tabela de tentativas de avaliação
CREATE TABLE IF NOT EXISTS evaluation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER, -- tempo gasto em minutos
  total_score DECIMAL(5,2), -- pontuação total (0-100)
  max_possible_score DECIMAL(5,2), -- pontuação máxima possível
  passed BOOLEAN,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded'))
);

-- Índices para evaluation_attempts
CREATE INDEX IF NOT EXISTS evaluation_attempts_evaluation_id_idx ON evaluation_attempts(evaluation_id);
CREATE INDEX IF NOT EXISTS evaluation_attempts_student_id_idx ON evaluation_attempts(student_id);

-- Constraint única para evaluation_attempts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'evaluation_attempts_unique'
    ) THEN
        ALTER TABLE evaluation_attempts ADD CONSTRAINT evaluation_attempts_unique UNIQUE (evaluation_id, student_id, attempt_number);
    END IF;
END $$;

-- Tabela de respostas dos estudantes
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES evaluation_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  text_answer TEXT, -- para questões de texto
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2) DEFAULT 0.00,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para student_answers
CREATE INDEX IF NOT EXISTS student_answers_attempt_id_idx ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS student_answers_question_id_idx ON student_answers(question_id);

-- Constraint única para student_answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_answers_unique'
    ) THEN
        ALTER TABLE student_answers ADD CONSTRAINT student_answers_unique UNIQUE (attempt_id, question_id);
    END IF;
END $$;

-- Políticas RLS para evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view evaluations" ON evaluations;
DROP POLICY IF EXISTS "Teachers and admins can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Teachers and admins can update evaluations" ON evaluations;
DROP POLICY IF EXISTS "Teachers and admins can delete evaluations" ON evaluations;

-- Política de leitura: usuários podem ver avaliações dos cursos que têm acesso
CREATE POLICY "Users can view evaluations" ON evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = evaluations.course_id
      AND (
        courses.status = 'published' OR 
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Política de inserção: apenas professores e admins podem criar avaliações
CREATE POLICY "Teachers and admins can create evaluations" ON evaluations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = evaluations.course_id
      AND (
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Política de atualização: apenas professores e admins podem atualizar avaliações
CREATE POLICY "Teachers and admins can update evaluations" ON evaluations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = evaluations.course_id
      AND (
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Política de exclusão: apenas professores e admins podem deletar avaliações
CREATE POLICY "Teachers and admins can delete evaluations" ON evaluations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = evaluations.course_id
      AND (
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Políticas RLS para evaluation_questions
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view questions" ON evaluation_questions;
DROP POLICY IF EXISTS "Teachers and admins can manage questions" ON evaluation_questions;

CREATE POLICY "Users can view questions" ON evaluation_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = evaluation_questions.evaluation_id
      AND (
        c.status = 'published' OR 
        c.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Teachers and admins can manage questions" ON evaluation_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = evaluation_questions.evaluation_id
      AND (
        c.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Políticas similares para outras tabelas
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para as outras tabelas
CREATE POLICY "Users can view options" ON question_options FOR SELECT USING (true);
CREATE POLICY "Users can view attempts" ON evaluation_attempts FOR SELECT USING (true);
CREATE POLICY "Users can view answers" ON student_answers FOR SELECT USING (true);

-- Comentários para documentação
COMMENT ON TABLE evaluations IS 'Avaliações e questionários dos cursos';
COMMENT ON TABLE evaluation_questions IS 'Questões das avaliações';
COMMENT ON TABLE question_options IS 'Opções de resposta para questões de múltipla escolha';
COMMENT ON TABLE evaluation_attempts IS 'Tentativas de resolução das avaliações pelos estudantes';
COMMENT ON TABLE student_answers IS 'Respostas dos estudantes às questões das avaliações';