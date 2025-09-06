/**
 * Script para criar buckets necessários no Supabase Storage
 * Execute: node src/scripts/setup-storage-buckets.js
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bucketsToCreate = [
  {
    id: 'public-assets',
    name: 'public-assets',
    public: true,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'video/avi',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ]
  }
]

async function setupBuckets() {
  console.log('🚀 Configurando buckets do Supabase Storage...')
  
  // Listar buckets existentes
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError.message)
    return
  }
  
  console.log('📋 Buckets existentes:', existingBuckets.map(b => b.name))
  
  for (const bucketConfig of bucketsToCreate) {
    const bucketExists = existingBuckets.some(b => b.name === bucketConfig.id)
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketConfig.id}' já existe`)
      continue
    }
    
    console.log(`🆕 Criando bucket '${bucketConfig.id}'...`)
    
    const { data, error } = await supabase.storage.createBucket(bucketConfig.id, {
      public: bucketConfig.public,
      allowedMimeTypes: bucketConfig.allowedMimeTypes,
      fileSizeLimit: 104857600 // 100MB
    })
    
    if (error) {
      console.error(`❌ Erro ao criar bucket '${bucketConfig.id}':`, error.message)
    } else {
      console.log(`✅ Bucket '${bucketConfig.id}' criado com sucesso`)
    }
  }
  
  console.log('🎉 Configuração de buckets concluída!')
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupBuckets().catch(console.error)
}

export { setupBuckets }