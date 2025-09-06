-- Script para diagnosticar e corrigir dados inconsistentes de progresso de aulas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar dados inconsistentes na tabela lesson_progress
SELECT 
  lp.id,
  lp.lesson_id,
  lp.enrollment_id,
  lp.progress_percentage,
  lp.completed_at,
  l.title as lesson_title,
  e.student_id,
  p.full_name
FROM lesson_progress lp
JOIN lessons l ON lp.lesson_id = l.id
JOIN enrollments e ON lp.enrollment_id = e.id
JOIN profiles p ON e.student_id = p.id
ORDER BY lp.created_at DESC
LIMIT 20;

-- 2. Verificar registros com progress = 0 mas completed_at preenchido
SELECT 
  lp.id,
  lp.lesson_id,
  lp.progress_percentage,
  lp.completed_at,
  l.title
FROM lesson_progress lp
JOIN lessons l ON lp.lesson_id = l.id
WHERE lp.progress_percentage = 0 AND lp.completed_at IS NOT NULL;

-- 3. Verificar registros com progress = 100 mas completed_at vazio
SELECT 
  lp.id,
  lp.lesson_id,
  lp.progress_percentage,
  lp.completed_at,
  l.title
FROM lesson_progress lp
JOIN lessons l ON lp.lesson_id = l.id
WHERE lp.progress_percentage >= 100 AND lp.completed_at IS NULL;

-- 4. Corrigir dados inconsistentes (DESCOMENTE APENAS APÓS VERIFICAR OS RESULTADOS ACIMA)

-- Corrigir registros com 100% mas sem completed_at
-- UPDATE lesson_progress 
-- SET completed_at = NOW()
-- WHERE progress_percentage >= 100 AND completed_at IS NULL;

-- Corrigir registros com 0% mas com completed_at
-- UPDATE lesson_progress 
-- SET completed_at = NULL
-- WHERE progress_percentage = 0 AND completed_at IS NOT NULL;

-- 5. Recalcular progresso geral dos cursos após correção
-- UPDATE enrollments 
-- SET progress = (
--   SELECT ROUND(
--     (COUNT(CASE WHEN lp.progress_percentage >= 100 OR lp.completed_at IS NOT NULL THEN 1 END) * 100.0) / 
--     COUNT(l.id)
--   )
--   FROM lessons l
--   LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = enrollments.id
--   WHERE l.course_id = enrollments.course_id
-- )
-- WHERE EXISTS (
--   SELECT 1 FROM lesson_progress lp2 
--   WHERE lp2.enrollment_id = enrollments.id
-- );

-- 6. Verificar resultado final
SELECT 
  c.title as course_title,
  e.progress as enrollment_progress,
  COUNT(l.id) as total_lessons,
  COUNT(CASE WHEN lp.progress_percentage >= 100 OR lp.completed_at IS NOT NULL THEN 1 END) as completed_lessons
FROM enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN lessons l ON l.course_id = c.id
LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = e.id
WHERE e.progress > 0 OR EXISTS (SELECT 1 FROM lesson_progress lp2 WHERE lp2.enrollment_id = e.id)
GROUP BY c.id, c.title, e.id, e.progress
ORDER BY e.created_at DESC;