-- Migração SQL: Sistema de Notificações
-- Execute no Supabase SQL Editor

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  related_id UUID, -- ID relacionado (tentativa, curso, etc.)
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- 3. Adicionar constraint para tipos de notificação
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('general', 'evaluation_result', 'course_enrollment', 'course_completion', 'payment_success', 'payment_failed'));

-- 4. Comentários para documentação
COMMENT ON TABLE notifications IS 'Notificações do sistema para usuários';
COMMENT ON COLUMN notifications.type IS 'Tipos: general, evaluation_result, course_enrollment, course_completion, payment_success, payment_failed';
COMMENT ON COLUMN notifications.related_id IS 'ID relacionado dependendo do tipo (tentativa, curso, pagamento, etc.)';

-- 5. Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para notificações
-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Sistema pode inserir notificações (service role)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- 7. Atualizar tabela evaluation_attempts para suportar correção manual
-- Adicionar colunas para rastreamento de correção
ALTER TABLE evaluation_attempts
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);

-- Comentários para documentação
COMMENT ON COLUMN evaluation_attempts.graded_at IS 'Data/hora quando a correção manual foi finalizada';
COMMENT ON COLUMN evaluation_attempts.graded_by IS 'Professor/admin que fez a correção manual';

-- 8. Atualizar tabela evaluation_answers para suportar correção manual
-- Adicionar colunas para nota e feedback manual
ALTER TABLE evaluation_answers
ADD COLUMN IF NOT EXISTS manual_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS manual_feedback TEXT;

-- Comentários para documentação
COMMENT ON COLUMN evaluation_answers.manual_score IS 'Nota atribuída manualmente pelo professor/admin';
COMMENT ON COLUMN evaluation_answers.manual_feedback IS 'Feedback textual do professor/admin sobre a resposta';

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Trigger para updated_at na tabela notifications
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = true,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- 12. Função para obter contagem de notificações não lidas
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE user_id = auth.uid() AND is_read = false;
  
  RETURN unread_count;
END;
$$;

-- 13. View para facilitar consultas de notificações
CREATE OR REPLACE VIEW user_notifications AS
SELECT 
  n.*,
  CASE 
    WHEN n.type = 'evaluation_result' THEN 
      (SELECT e.title FROM evaluations e 
       JOIN evaluation_attempts ea ON ea.evaluation_id = e.id 
       WHERE ea.id = n.related_id::uuid)
    ELSE null
  END as evaluation_title
FROM notifications n
WHERE n.user_id = auth.uid()
ORDER BY n.created_at DESC;

-- 14. Índice composto para melhor performance
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read, created_at DESC);

-- Finalizado: Sistema de notificações criado com sucesso