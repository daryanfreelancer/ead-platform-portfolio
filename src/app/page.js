import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import CourseCatalogWrapper from '@/components/home/course-catalog-wrapper'
import CategorizedCourseCatalog from '@/components/home/categorized-course-catalog-v2'
import HeroSection from '@/components/home/hero-section'
import CallToAction from '@/components/home/call-to-action'
import MaintenanceBanner from '@/components/ui/maintenance-banner'
import CountUpNumber from '@/components/ui/count-up-number'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <>
      {/* Script para capturar hash de recovery imediatamente */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Verificar se há hash de recovery do Supabase
              if (window.location.hash && window.location.hash.includes('type=recovery')) {
                console.log('Recovery hash detected on home page, redirecting...');
                window.location.href = '/reset-password' + window.location.hash;
              }
              // Também verificar query params
              const params = new URLSearchParams(window.location.search);
              if (params.get('type') === 'recovery') {
                console.log('Recovery params detected on home page, redirecting...');
                window.location.href = '/reset-password' + window.location.search + window.location.hash;
              }
            })();
          `,
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Banner de Manutenção */}
        <MaintenanceBanner />
        
        {/* Hero Section */}
        <HeroSection />

        {/* Como Funciona - Fluxo para Alunos */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Como Funciona - Seu Caminho para o Sucesso
          </h2>
          <p className="text-xl text-gray-600">
            Três passos simples para transformar sua carreira
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <Card className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-0 animate-fade-in-up delay-100">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float delay-200">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">1. Escolha seu Curso</h3>
              <p className="text-blue-100">
                Navegue pelo catálogo, compare opções e encontre o curso ideal para seus objetivos profissionais.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-0 animate-fade-in-up delay-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float delay-300">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">2. Estude e Aprenda</h3>
              <p className="text-blue-100">
                Acesse aulas em vídeo, PDFs interativos e realize avaliações online no seu próprio ritmo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-0 animate-fade-in-up delay-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float delay-400">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">3. Receba seu Certificado</h3>
              <p className="text-blue-100">
                Complete o curso, seja aprovado nas avaliações e baixe seu certificado reconhecido nacionalmente.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Student Success Section */}
        <div className="mb-32 animate-fade-in-up delay-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content - Left Side */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Transforme seu futuro com educação de qualidade
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Junte-se a milhares de estudantes que já conquistaram seus objetivos profissionais conosco
                </p>
                <p className="text-gray-600 mb-8">
                  Nossa metodologia comprovada e suporte personalizado garantem que você tenha sucesso em sua jornada de aprendizado.
                </p>
              </div>
              
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-lg">🏆</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Certificação Reconhecida</h4>
                    <p className="text-sm text-gray-600">Certificados válidos em todo território nacional</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-lg">⏰</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Flexibilidade Total</h4>
                    <p className="text-sm text-gray-600">Estude no seu ritmo, quando e onde quiser</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-lg">👥</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Suporte Especializado</h4>
                    <p className="text-sm text-gray-600">Acompanhamento pedagógico durante todo o curso</p>
                  </div>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="pt-4">
                <a 
                  href="https://wa.me/5561992559412"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                  >
                    Comece sua jornada
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Image - Right Side */}
            <div className="order-first lg:order-last">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://rsobmgtsefsumuqyylrm.supabase.co/storage/v1/object/public/public-assets/hero-images/student-hero.jpg"
                  alt="Estudante em ambiente de aprendizado"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
                {/* Subtle overlay for better image quality */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Catálogo Categorizado de Cursos */}
        <div id="catalogo-cursos">
          <CategorizedCourseCatalog />
        </div>

        {/* TODO: Reativar quando sistema estiver populado com cursos reais funcionais
        {/* Catálogo de Cursos Dinâmico - Cursos Recentes Cadastrados */}
        {/* <CourseCatalogWrapper /> */}

        {/* Diferenciais */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 mb-32 animate-scale-in delay-400">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Por que escolher o EduPlatform?</h2>
            <p className="text-blue-100 text-lg">
              Mais de 10 anos formando profissionais qualificados
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="hover:scale-110 transition-transform duration-300">
              <CountUpNumber end="100" suffix="%" duration={2000} />
              <div className="text-blue-100">Reconhecidos pelo MEC</div>
            </div>
            <div className="hover:scale-110 transition-transform duration-300">
              <CountUpNumber end="900" suffix="+" duration={2200} />
              <div className="text-blue-100">Alunos Formados</div>
            </div>
            <div className="hover:scale-110 transition-transform duration-300">
              <CountUpNumber end="1000" suffix="+" duration={2400} />
              <div className="text-blue-100">Cursos Disponíveis</div>
            </div>
            <div className="hover:scale-110 transition-transform duration-300">
              <CountUpNumber end="24" suffix="/7" duration={1800} />
              <div className="text-blue-100">Suporte Contínuo</div>
            </div>
          </div>
        </div>


        {/* Call to Action */}
        <CallToAction />
      </div>
    </>
  )
}