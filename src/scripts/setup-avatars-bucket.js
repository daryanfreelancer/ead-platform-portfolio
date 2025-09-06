// Script para configurar o bucket 'avatars' no Supabase
// Execute este script no console do navegador na página do Supabase Storage

const setupAvatarsBucket = async () => {
  console.log('🔧 Configurando bucket avatars...')
  
  // Verificar se o bucket já existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError)
    return
  }
  
  const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars')
  
  if (avatarsBucket) {
    console.log('✅ Bucket avatars já existe')
  } else {
    console.log('📦 Criando bucket avatars...')
    
    // Criar bucket público para avatars
    const { error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    })
    
    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError)
      return
    }
    
    console.log('✅ Bucket avatars criado com sucesso')
  }
  
  // Configurar política RLS para avatars
  console.log('🔐 Configurando políticas RLS...')
  
  // Permitir upload para usuários autenticados
  const uploadPolicy = `
    CREATE POLICY "Usuários podem fazer upload de avatars" ON storage.objects 
    FOR INSERT WITH CHECK (
      bucket_id = 'avatars' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  `
  
  // Permitir visualização pública
  const viewPolicy = `
    CREATE POLICY "Avatars são públicos" ON storage.objects 
    FOR SELECT USING (bucket_id = 'avatars');
  `
  
  // Permitir atualização para o próprio usuário
  const updatePolicy = `
    CREATE POLICY "Usuários podem atualizar seus avatars" ON storage.objects 
    FOR UPDATE USING (
      bucket_id = 'avatars' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  `
  
  // Permitir exclusão para o próprio usuário
  const deletePolicy = `
    CREATE POLICY "Usuários podem deletar seus avatars" ON storage.objects 
    FOR DELETE USING (
      bucket_id = 'avatars' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  `
  
  console.log('📋 Políticas RLS a serem criadas:')
  console.log('1. Upload:', uploadPolicy)
  console.log('2. Visualização:', viewPolicy)
  console.log('3. Atualização:', updatePolicy)
  console.log('4. Exclusão:', deletePolicy)
  
  console.log('⚠️  Execute essas políticas no SQL Editor do Supabase')
  console.log('🎉 Configuração do bucket avatars concluída!')
}

// Executar automaticamente se estiver no console
if (typeof window !== 'undefined' && window.supabase) {
  setupAvatarsBucket()
} else {
  console.log('⚠️  Execute este script no console do navegador na página do Supabase')
}

export default setupAvatarsBucket