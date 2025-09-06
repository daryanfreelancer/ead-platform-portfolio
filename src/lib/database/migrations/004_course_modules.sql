-- Migração 004: Sistema de Módulos para Aulas
-- Esta migração cria a estrutura necessária para organizar aulas em módulos
-- com funcionalidade de ativação/desativação não destrutiva

-- Tabela de módulos de curso
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT course_modules_course_id_order_index_key UNIQUE (course_id, order_index)
);

-- Adicionar módulo_id às aulas (nullable para backwards compatibility)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL;

-- Atualizar tabela de auditoria para incluir módulos
ALTER TABLE activation_audit_log DROP CONSTRAINT IF EXISTS activation_audit_log_entity_type_check;
ALTER TABLE activation_audit_log ADD CONSTRAINT activation_audit_log_entity_type_check 
  CHECK (entity_type IN ('course', 'lesson', 'module'));

-- Função para alternar ativação de módulos
CREATE OR REPLACE FUNCTION toggle_module_activation(
  module_id UUID,
  is_active BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  old_state BOOLEAN;
  admin_user_id UUID;
BEGIN
  -- Obter estado atual
  SELECT course_modules.is_active INTO old_state
  FROM course_modules
  WHERE course_modules.id = module_id;
  
  -- Verificar se o módulo existe
  IF old_state IS NULL THEN
    RAISE EXCEPTION 'Módulo não encontrado';
  END IF;
  
  -- Atualizar estado
  UPDATE course_modules
  SET is_active = toggle_module_activation.is_active,
      updated_at = NOW()
  WHERE course_modules.id = module_id;
  
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
    'module',
    module_id,
    CASE WHEN is_active THEN 'activate' ELSE 'deactivate' END,
    old_state,
    is_active,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para reordenar módulos
CREATE OR REPLACE FUNCTION reorder_modules(
  course_id UUID,
  module_orders JSONB -- Array de objetos {id: UUID, order_index: INTEGER}
) RETURNS BOOLEAN AS $$
DECLARE
  module_order JSONB;
BEGIN
  -- Iterar sobre os módulos e atualizar ordem
  FOR module_order IN SELECT * FROM jsonb_array_elements(module_orders)
  LOOP
    UPDATE course_modules
    SET order_index = (module_order->>'order_index')::INTEGER,
        updated_at = NOW()
    WHERE id = (module_order->>'id')::UUID
    AND course_modules.course_id = reorder_modules.course_id;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para reordenar aulas dentro de um módulo
CREATE OR REPLACE FUNCTION reorder_lessons_in_module(
  module_id UUID,
  lesson_orders JSONB -- Array de objetos {id: UUID, order_index: INTEGER}
) RETURNS BOOLEAN AS $$
DECLARE
  lesson_order JSONB;
BEGIN
  -- Iterar sobre as aulas e atualizar ordem
  FOR lesson_order IN SELECT * FROM jsonb_array_elements(lesson_orders)
  LOOP
    UPDATE lessons
    SET order_index = (lesson_order->>'order_index')::INTEGER,
        updated_at = NOW()
    WHERE id = (lesson_order->>'id')::UUID
    AND lessons.module_id = reorder_lessons_in_module.module_id;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política RLS para course_modules
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários podem ver módulos dos cursos que têm acesso
CREATE POLICY "Users can view course modules" ON course_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
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

-- Política de inserção: apenas professores e admins podem criar módulos
CREATE POLICY "Teachers and admins can create modules" ON course_modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
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

-- Política de atualização: apenas professores e admins podem atualizar módulos
CREATE POLICY "Teachers and admins can update modules" ON course_modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
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

-- Política de exclusão: apenas professores e admins podem deletar módulos
CREATE POLICY "Teachers and admins can delete modules" ON course_modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS course_modules_course_id_idx ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS course_modules_order_index_idx ON course_modules(order_index);
CREATE INDEX IF NOT EXISTS course_modules_is_active_idx ON course_modules(is_active);
CREATE INDEX IF NOT EXISTS lessons_module_id_idx ON lessons(module_id);

-- Atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_course_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON course_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_course_modules_updated_at();

-- Comentários para documentação
COMMENT ON TABLE course_modules IS 'Módulos de organização de aulas dentro de cursos';
COMMENT ON COLUMN course_modules.course_id IS 'ID do curso ao qual o módulo pertence';
COMMENT ON COLUMN course_modules.title IS 'Título do módulo';
COMMENT ON COLUMN course_modules.description IS 'Descrição opcional do módulo';
COMMENT ON COLUMN course_modules.order_index IS 'Ordem de exibição do módulo no curso';
COMMENT ON COLUMN course_modules.is_active IS 'Se o módulo está ativo (visível para estudantes)';
COMMENT ON COLUMN lessons.module_id IS 'ID do módulo ao qual a aula pertence (opcional)';