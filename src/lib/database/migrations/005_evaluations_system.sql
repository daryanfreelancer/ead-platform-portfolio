-- Migração 005: Sistema de Avaliações
-- Esta migração cria a estrutura completa para avaliações, questões e respostas

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT evaluations_course_id_idx UNIQUE (course_id, title),
  INDEX evaluations_lesson_id_idx (lesson_id),
  INDEX evaluations_module_id_idx (module_id),
  INDEX evaluations_is_active_idx (is_active)
);

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX evaluation_questions_evaluation_id_idx (evaluation_id),
  INDEX evaluation_questions_order_idx (order_index)
);

-- Tabela de opções de questões (para múltipla escolha e verdadeiro/falso)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT, -- explicação específica da opção
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX question_options_question_id_idx (question_id),
  INDEX question_options_order_idx (order_index)
);

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
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  
  -- Índices para performance e constraints
  INDEX evaluation_attempts_evaluation_id_idx (evaluation_id),
  INDEX evaluation_attempts_student_id_idx (student_id),
  UNIQUE KEY evaluation_attempts_unique (evaluation_id, student_id, attempt_number)
);

-- Tabela de respostas dos estudantes
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES evaluation_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  text_answer TEXT, -- para questões de texto
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2) DEFAULT 0.00,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX student_answers_attempt_id_idx (attempt_id),
  INDEX student_answers_question_id_idx (question_id),
  UNIQUE KEY student_answers_unique (attempt_id, question_id)
);

-- Atualizar tabela de auditoria para incluir avaliações
ALTER TABLE activation_audit_log DROP CONSTRAINT IF EXISTS activation_audit_log_entity_type_check;
ALTER TABLE activation_audit_log ADD CONSTRAINT activation_audit_log_entity_type_check 
  CHECK (entity_type IN ('course', 'lesson', 'module', 'evaluation'));

-- Função para alternar ativação de avaliações
CREATE OR REPLACE FUNCTION toggle_evaluation_activation(
  evaluation_id UUID,
  is_active BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  old_state BOOLEAN;
  admin_user_id UUID;
BEGIN
  -- Obter estado atual
  SELECT evaluations.is_active INTO old_state
  FROM evaluations
  WHERE evaluations.id = evaluation_id;
  
  -- Verificar se a avaliação existe
  IF old_state IS NULL THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;
  
  -- Atualizar estado
  UPDATE evaluations
  SET is_active = toggle_evaluation_activation.is_active,
      updated_at = NOW()
  WHERE evaluations.id = evaluation_id;
  
  -- Obter ID do usuário admin atual (via RLS context)
  SELECT auth.uid() INTO admin_user_id;
  
  -- Registrar log de auditoria
  INSERT INTO activation_audit_log (
    admin_id,
    entity_type,
    entity_id,
    action,
    previous_state,
    new_state,
    created_at
  ) VALUES (
    admin_user_id,
    'evaluation',
    evaluation_id,
    CASE WHEN is_active THEN 'activate' ELSE 'deactivate' END,
    old_state,
    is_active,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular pontuação de uma tentativa
CREATE OR REPLACE FUNCTION calculate_attempt_score(
  attempt_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  total_points DECIMAL(5,2) := 0;
  max_points DECIMAL(5,2) := 0;
  final_score DECIMAL(5,2);
  passing_score DECIMAL(5,2);
  passed BOOLEAN := false;
BEGIN
  -- Calcular pontuação total e máxima
  SELECT 
    COALESCE(SUM(sa.points_earned), 0),
    COALESCE(SUM(eq.points), 0)
  INTO total_points, max_points
  FROM student_answers sa
  JOIN evaluation_questions eq ON sa.question_id = eq.id
  WHERE sa.attempt_id = calculate_attempt_score.attempt_id;
  
  -- Calcular porcentagem final
  IF max_points > 0 THEN
    final_score := (total_points / max_points) * 100;
  ELSE
    final_score := 0;
  END IF;
  
  -- Obter nota mínima da avaliação
  SELECT e.passing_score INTO passing_score
  FROM evaluation_attempts ea
  JOIN evaluations e ON ea.evaluation_id = e.id
  WHERE ea.id = calculate_attempt_score.attempt_id;
  
  -- Verificar se passou
  passed := final_score >= passing_score;
  
  -- Atualizar tentativa
  UPDATE evaluation_attempts
  SET total_score = final_score,
      max_possible_score = max_points,
      passed = calculate_attempt_score.passed,
      status = 'graded'
  WHERE id = calculate_attempt_score.attempt_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

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

-- Políticas similares para question_options
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view options" ON question_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_questions eq
      JOIN evaluations e ON eq.evaluation_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE eq.id = question_options.question_id
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

CREATE POLICY "Teachers and admins can manage options" ON question_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_questions eq
      JOIN evaluations e ON eq.evaluation_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE eq.id = question_options.question_id
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

-- Políticas para evaluation_attempts
ALTER TABLE evaluation_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attempts" ON evaluation_attempts
  FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM evaluations e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = evaluation_attempts.evaluation_id
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

CREATE POLICY "Students can create own attempts" ON evaluation_attempts
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own attempts" ON evaluation_attempts
  FOR UPDATE
  USING (student_id = auth.uid());

-- Políticas para student_answers
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own answers" ON student_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_attempts ea
      WHERE ea.id = student_answers.attempt_id
      AND (
        ea.student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM evaluations e
          JOIN courses c ON e.course_id = c.id
          WHERE e.id = ea.evaluation_id
          AND (
            c.teacher_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
            )
          )
        )
      )
    )
  );

CREATE POLICY "Students can create own answers" ON student_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluation_attempts ea
      WHERE ea.id = student_answers.attempt_id
      AND ea.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own answers" ON student_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_attempts ea
      WHERE ea.id = student_answers.attempt_id
      AND ea.student_id = auth.uid()
    )
  );

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

CREATE TRIGGER update_evaluation_questions_updated_at
  BEFORE UPDATE ON evaluation_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

-- Comentários para documentação
COMMENT ON TABLE evaluations IS 'Avaliações e questionários dos cursos';
COMMENT ON TABLE evaluation_questions IS 'Questões das avaliações';
COMMENT ON TABLE question_options IS 'Opções de resposta para questões de múltipla escolha';
COMMENT ON TABLE evaluation_attempts IS 'Tentativas de resolução das avaliações pelos estudantes';
COMMENT ON TABLE student_answers IS 'Respostas dos estudantes às questões das avaliações';