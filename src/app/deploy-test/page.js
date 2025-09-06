export default function DeployTestPage() {
  return (
    <div className="p-8 bg-green-50 min-h-screen">
      <h1 className="text-4xl font-bold text-green-800 mb-4">
        ✅ Deploy Test - Versão 2.0
      </h1>
      <p className="text-xl text-green-700">
        Se você está vendo esta página, o deploy foi atualizado com sucesso!
      </p>
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Informações:</h2>
        <ul className="space-y-2">
          <li>📅 Data do deploy: {new Date().toLocaleString('pt-BR')}</li>
          <li>🔧 Versão: 2.0 com correções de middleware</li>
          <li>✅ Esta página NÃO requer autenticação</li>
          <li>🔍 URL: /deploy-test</li>
        </ul>
      </div>
    </div>
  )
}