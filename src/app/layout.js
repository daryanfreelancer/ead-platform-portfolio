import { Inter } from 'next/font/google'
import Navigation from '@/components/navigation'
import AuthHandler from '@/components/auth-handler'
import SessionRefresher from '@/components/session-refresher'
import VersionGuard from '@/components/version-guard'
import ScrollToTop from '@/components/ui/scroll-to-top'
import { AuthProvider } from '@/hooks/use-auth'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'EduPlatform - Plataforma EAD',
    template: '%s | EduPlatform'
  },
  description: 'Plataforma de ensino à distância do Instituto EduPlatform. Cursos de capacitação, tecnólogo, bacharel, licenciatura, mestrado e doutorado reconhecidos pelo MEC.',
  keywords: ['EduPlatform', 'EAD', 'ensino à distância', 'cursos online', 'MEC', 'capacitação', 'tecnólogo', 'bacharel', 'mestrado', 'doutorado'],
  authors: [{ name: 'EduPlatform Instituto' }],
  creator: 'EduPlatform Instituto',
  publisher: 'EduPlatform Instituto',
  metadataBase: new URL('https://www.eduplatform.com.br'),
  
  
  // Open Graph / Facebook
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.eduplatform.com.br',
    siteName: 'EduPlatform - Plataforma EAD',
    title: 'EduPlatform - Plataforma de Ensino à Distância',
    description: 'Plataforma de ensino à distância do Instituto EduPlatform. Cursos de capacitação, tecnólogo, bacharel, licenciatura, mestrado e doutorado reconhecidos pelo MEC.',
    images: [
      {
        url: 'https://www.eduplatform.com.br/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'EduPlatform - Plataforma EAD'
      }
    ]
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'EduPlatform - Plataforma de Ensino à Distância',
    description: 'Plataforma de ensino à distância do Instituto EduPlatform. Cursos reconhecidos pelo MEC.',
    images: ['https://www.eduplatform.com.br/opengraph-image.png']
  },
  
  // Icons - Next.js App Router detecta automaticamente os arquivos na pasta app/
  // Removido para usar convenção automática
  
  // Manifest
  manifest: '/manifest.json',
  
  // Additional meta tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification (adicionar quando tiver)
  // verification: {
  //   google: 'google-site-verification-code',
  // },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <VersionGuard>
            <AuthHandler />
            <SessionRefresher />
            <div className="min-h-screen bg-gray-50">
              <Navigation />
            
            <main>
              {children}
            </main>
          
          <footer className="bg-gray-800 text-white py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">EduPlatform</h3>
                  <p className="text-gray-300">
                    Instituto de capacitação e ensino à distância com cursos reconhecidos pelo MEC.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contato</h3>
                  <p className="text-gray-300">
                    📞 (61) 3299-8180<br/>
                    📧 atendimento@eduplatform.com.br
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Localização</h3>
                  <p className="text-gray-300">
                    Valparaíso de Goiás - GO<br/>
                    CEP: 72.870-531
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-700 mt-8 pt-8 text-center">
                <p className="text-gray-400">
                  © 2025 EduPlatform. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </footer>
          
          {/* Botão Voltar ao Topo */}
          <ScrollToTop />
          </div>
          </VersionGuard>
        </AuthProvider>
      </body>
    </html>
  )
}