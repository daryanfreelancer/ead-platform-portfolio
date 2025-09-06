# Educational Hubs Dropdown Issue - Documentation

## Problem Description

The educational hub (polo educacional) dropdown in the course creation form only shows "Sem polo específico" instead of displaying the 9 educational hubs mentioned in CLAUDE.md.

## Root Cause

The issue occurs due to a combination of factors:

1. **Row Level Security (RLS)**: The `educational_hubs` table has RLS enabled with a policy that only allows viewing hubs where `is_active = true`
2. **Database State**: The educational hubs might not be active in the database, either because:
   - The migration hasn't been run
   - The hubs were created but are inactive
   - The hubs were manually deactivated

## Solution

### Immediate Fix (for Admins)

1. Navigate to the admin panel: `/administrador/polos`
2. If you see a diagnostic tool, click "Executar Diagnóstico" to check the hub status
3. If hubs are inactive or missing, click "Ativar Todos os Hubs"
4. Alternatively, manually activate each hub using the toggle in the hub management interface

### SQL Fix (Database Administrator)

Run the following SQL in Supabase SQL Editor:

```sql
-- Check current status
SELECT name, is_active FROM educational_hubs ORDER BY name;

-- Activate all hubs
UPDATE educational_hubs
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false OR is_active IS NULL;

-- If hubs don't exist, insert them
INSERT INTO educational_hubs (name, description, is_active) VALUES 
  ('EduPlatform', 'Cursos próprios do Instituto EduPlatform', true),
  ('SIE', 'Sistema Integrado de Ensino', true),
  ('Escola Avançada', 'Parceria com Escola Avançada', true),
  ('UniUnica', 'Universidade UniUnica', true),
  ('UniFil', 'Centro Universitário Filadélfia', true),
  ('Faculdade Guerra', 'Faculdade Guerra', true),
  ('UNAR', 'Centro Universitário de Araras', true),
  ('CEPET', 'Centro de Educação Profissional e Tecnológica', true),
  ('Ember', 'Ember Educação', true)
ON CONFLICT (name) DO UPDATE
SET is_active = true,
    updated_at = NOW();
```

### API Endpoints Created

1. **Check Hub Status**: `GET /api/admin/check-hubs`
   - Returns diagnostic information about educational hubs
   - Shows total, active, inactive counts
   - Admin access only

2. **Activate All Hubs**: `POST /api/admin/activate-hubs`
   - Creates missing hubs or activates inactive ones
   - Admin access only

### Code Changes Made

1. **Added debug logging** to `course-form-enhanced.js` to help identify when no hubs are loaded
2. **Created diagnostic tool** component for admins to check and fix hub status
3. **Added diagnostic tool** to the admin hubs page when issues are detected

## Prevention

To prevent this issue in the future:

1. Ensure migrations are run properly during deployment
2. Don't manually deactivate all educational hubs
3. Use the admin interface to manage hub status
4. Monitor the console logs in the course creation form for warnings

## Technical Details

The course creation form queries educational hubs with:
```javascript
const { data, error } = await supabase
  .from('educational_hubs')
  .select('*')
  .eq('is_active', true)  // Only shows active hubs
  .order('name')
```

The RLS policy ensures non-admin users can only see active hubs:
```sql
CREATE POLICY "Anyone can view active educational hubs" ON educational_hubs
  FOR SELECT
  USING (is_active = true);
```

This is correct behavior for security, but requires that at least some hubs are active in the database.