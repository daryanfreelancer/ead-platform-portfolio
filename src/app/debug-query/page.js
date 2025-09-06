import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DebugQuery() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Teste 1: Query normal com .single()
  let singleResult = null
  let singleError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    singleResult = data
    singleError = error
  } catch (err) {
    singleError = err
  }

  // Teste 2: Query sem .single() para ver quantos registros retorna
  let multipleResult = null
  let multipleError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
    
    multipleResult = data
    multipleError = error
  } catch (err) {
    multipleError = err
  }

  // Teste 3: Query com limit(1)
  let limitResult = null
  let limitError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1)
    
    limitResult = data?.[0] || null
    limitError = error
  } catch (err) {
    limitError = err
  }

  // Teste 4: Query apenas do role para login
  let roleResult = null
  let roleError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    roleResult = data
    roleError = error
  } catch (err) {
    roleError = err
  }

  // Teste 5: SIE API Config table query
  let sieConfigResult = null
  let sieConfigError = null
  
  try {
    const { data, error } = await supabase
      .from('sie_api_config')
      .select('*')
    
    sieConfigResult = data
    sieConfigError = error
  } catch (err) {
    sieConfigError = err
  }

  // Teste 6: Check if SIE API config table exists
  let tableExistsResult = null
  let tableExistsError = null
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'sie_api_config')
    
    tableExistsResult = data
    tableExistsError = error
  } catch (err) {
    tableExistsError = err
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Query Issues</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">User ID</h2>
          <code className="text-sm bg-gray-200 p-2 rounded">{user.id}</code>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test 1: Query with .single()</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: singleResult,
              error: singleError?.message || singleError,
              errorCode: singleError?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test 2: Query without .single()</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: multipleResult,
              resultCount: multipleResult?.length,
              error: multipleError?.message || multipleError,
              errorCode: multipleError?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test 3: Query with .limit(1)</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: limitResult,
              error: limitError?.message || limitError,
              errorCode: limitError?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test 4: Role query (like login form)</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: roleResult,
              error: roleError?.message || roleError,
              errorCode: roleError?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test 5: SIE API Config table query</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: sieConfigResult,
              resultCount: sieConfigResult?.length,
              error: sieConfigError?.message || sieConfigError,
              errorCode: sieConfigError?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test 6: SIE API Config table exists check</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: tableExistsResult,
              tableExists: tableExistsResult?.length > 0,
              error: tableExistsError?.message || tableExistsError,
              errorCode: tableExistsError?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-blue-800">Fix SQL if needed</h2>
          <pre className="text-sm bg-blue-100 p-3 rounded overflow-auto">
{`-- If there are duplicates, clean them:
DELETE FROM profiles WHERE id = '${user.id}' AND created_at != (
  SELECT MIN(created_at) FROM profiles WHERE id = '${user.id}'
);

-- Ensure exactly one record exists:
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES ('${user.id}', '${user.email}', 'Administrador EduPlatform', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrador EduPlatform',
  updated_at = NOW();`}
          </pre>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-red-800">SIE API Config SQL Fixes</h2>
          <pre className="text-sm bg-red-100 p-3 rounded overflow-auto">
{`-- Reset SIE API to disabled state:
UPDATE sie_api_config SET sync_enabled = false WHERE sync_enabled = true;

-- Or if table is empty, insert default disabled config:
INSERT INTO sie_api_config (api_token, base_url, api_version, sync_enabled, rate_limit_per_minute, timeout_seconds)
SELECT '', 'https://www.iped.com.br', '1.0', false, 60, 30
WHERE NOT EXISTS (SELECT 1 FROM sie_api_config);

-- Check current config:
SELECT * FROM sie_api_config;`}
          </pre>
        </div>
      </div>
    </div>
  )
}