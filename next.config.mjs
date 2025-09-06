/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure static files are served correctly
  trailingSlash: false,
  
  // Custom headers for static files and cache control
  async headers() {
    return [
      {
        // No-cache para rotas de API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'X-Deployment-ID',
            value: process.env.VERCEL_DEPLOYMENT_ID || 'local-dev',
          },
        ],
      },
      {
        // No-cache para rotas de debug
        source: '/(session-debug|deploy-test|test-redirect|administrador/debug)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'X-Debug-Page',
            value: 'true',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Content-Type',
            value: 'image/x-icon'
          }
        ]
      },
      {
        source: '/favicon-:size.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Content-Type',
            value: 'image/png'
          }
        ]
      }
    ]
  },
  
  // Adicionar variáveis de ambiente para tracking de deploy
  env: {
    NEXT_PUBLIC_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || 'local-dev',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  }
};

export default nextConfig;
