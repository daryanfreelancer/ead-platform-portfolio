-- Fix WhatsApp template variable inconsistency
-- This script fixes the variable from {curso_nome} to {CURSO_NOME}

UPDATE system_settings 
SET value = '"Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}"'::jsonb,
    description = 'Template da mensagem WhatsApp. Use {CURSO_NOME} como variável'
WHERE key = 'whatsapp_message_template';