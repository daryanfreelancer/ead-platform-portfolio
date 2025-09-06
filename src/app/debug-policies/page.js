import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DebugPolicies() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Tentar query direta sem RLS
  let directResult = null
  let directError = null
  
  try {
    // Usar query SQL direta para contornar RLS
    const { data, error } = await supabase.rpc('get_profile_direct', {
      user_id: user.id
    })
    directResult = data
    directError = error
  } catch (err) {
    directError = err
  }

  // Tentar query normal
  let normalResult = null
  let normalError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    normalResult = data
    normalError = error
  } catch (err) {
    normalError = err
  }

  // Tentar query com auth.uid()
  let authResult = null
  let authError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1)
    
    authResult = data
    authError = error
  } catch (err) {
    authError = err
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug RLS Policies</h1>
      
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-red-800">RLS Issue Analysis</h2>
          <p className="text-red-700 mb-4">
            The profiles table has infinite recursion in RLS policies. This typically happens when:
          </p>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            <li>Policy references auth.uid() in a circular way</li>
            <li>Policy references the same table it&apos;s protecting</li>
            <li>Multiple policies conflict with each other</li>
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">User ID</h2>
          <code className="text-sm bg-gray-200 p-2 rounded">{user.id}</code>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Normal Query Result</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: normalResult,
              error: normalError?.message || normalError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Direct RPC Result</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: directResult,
              error: directError?.message || directError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Auth Query Result</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: authResult,
              error: authError?.message || authError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-blue-800">Complete RLS Fix SQL</h2>
          <pre className="text-sm bg-blue-100 p-3 rounded overflow-auto">
{`-- 1. COMPLETELY DISABLE RLS AND DROP ALL POLICIES
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- 2. INSERT ADMIN PROFILE (FORCE)
DELETE FROM profiles WHERE id = '${user.id}';
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES ('${user.id}', '${user.email}', 'Administrador EduPlatform', 'admin', NOW(), NOW());

-- 3. VERIFY INSERT
SELECT * FROM profiles WHERE id = '${user.id}';

-- 4. CREATE SIMPLE, NON-RECURSIVE POLICY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simple_profiles_policy" ON profiles
  FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- 5. FINAL VERIFICATION
SELECT * FROM profiles WHERE id = '${user.id}';`}
          </pre>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-yellow-800">Alternative: Create RPC Function</h2>
          <pre className="text-sm bg-yellow-100 p-3 rounded overflow-auto">
{`-- Create a function to bypass RLS for admin operations
CREATE OR REPLACE FUNCTION get_profile_direct(user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  cpf text,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT p.id, p.email, p.full_name, p.role, p.cpf, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_profile_direct(uuid) TO authenticated;`}
          </pre>
        </div>
      </div>
    </div>
  )
}