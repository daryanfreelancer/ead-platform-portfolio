-- Atualizar constraint de status para incluir novos estados
ALTER TABLE evaluation_attempts 
DROP CONSTRAINT IF EXISTS evaluation_attempts_status_check;

ALTER TABLE evaluation_attempts 
ADD CONSTRAINT evaluation_attempts_status_check 
CHECK (status IN ('in_progress', 'submitted', 'awaiting_grading', 'graded'));

-- Comentário para documentar os status
COMMENT ON COLUMN evaluation_attempts.status IS 'Status: in_progress (em andamento), submitted (antigas tentativas), awaiting_grading (aguardando correção), graded (corrigido)';