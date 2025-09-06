import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FixAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Tentar inserir perfil admin diretamente
  let insertResult = null
  let insertError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: 'Administrador EduPlatform',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    
    insertResult = data
    insertError = error
  } catch (err) {
    insertError = err
  }

  // Tentar buscar perfil novamente
  let profileResult = null
  let profileError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profileResult = data
    profileError = error
  } catch (err) {
    profileError = err
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fix Admin Profile</h1>
      
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-red-800">RLS Policy Issue Detected</h2>
          <p className="text-red-700">
            The profiles table has infinite recursion in RLS policies. 
            This needs to be fixed in Supabase dashboard.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">User Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.email
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Insert Attempt</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              result: insertResult,
              error: insertError?.message || insertError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Profile Query</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              profile: profileResult,
              error: profileError?.message || profileError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-blue-800">SQL to Execute in Supabase</h2>
          <pre className="text-sm bg-blue-100 p-2 rounded">
{`-- 1. Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Insert admin profile
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES ('${user.id}', '${user.email}', 'Administrador EduPlatform', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrador EduPlatform',
  updated_at = NOW();

-- 3. Re-enable RLS with simple policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create simple policy
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL USING (true);`}
          </pre>
        </div>
      </div>
    </div>
  )
}