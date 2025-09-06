'use client'

import { jsPDF } from 'jspdf'

/**
 * Gerador de certificados usando Canvas API
 * Cria certificados em PDF com design profissional
 */
export class CertificateGenerator {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.initialized = false
  }

  /**
   * Inicializa o canvas para geração de certificados
   * Tamanho A4 paisagem em 300 DPI: 3508x2480px
   */
  init() {
    if (typeof window === 'undefined') return false
    
    this.canvas = document.createElement('canvas')
    // A4 landscape em alta resolução (300 DPI)
    this.canvas.width = 3508  // 297mm em 300 DPI
    this.canvas.height = 2480 // 210mm em 300 DPI
    this.ctx = this.canvas.getContext('2d')
    this.initialized = true
    return true
  }

  /**
   * Gera um certificado personalizado
   * @param {Object} data - Dados do certificado
   * @param {string} data.studentName - Nome do estudante
   * @param {string} data.courseName - Nome do curso
   * @param {string} data.teacherName - Nome do professor
   * @param {string} data.completionDate - Data de conclusão
   * @param {string} data.certificateId - ID único do certificado
   * @param {number} data.courseHours - Horas do curso
   * @returns {Promise<Blob>} - Blob do certificado em formato PNG
   */
  async generateCertificate(data) {
    if (!this.initialized && !this.init()) {
      throw new Error('Canvas não suportado neste ambiente')
    }

    const ctx = this.ctx
    const canvas = this.canvas
    
    // Fator de escala para adaptar ao novo tamanho A4
    const scaleFactor = canvas.width / 1200 // 3508 / 1200 = ~2.92

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Aplicar escala global para manter proporções
    ctx.scale(scaleFactor, scaleFactor)

    // Configurar qualidade
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Usar dimensões originais para os desenhos (já escalados)
    const drawWidth = 1200
    const drawHeight = 850
    
    // Fundo gradiente
    await this.drawBackground(ctx, { width: drawWidth, height: drawHeight })

    // Bordas decorativas
    await this.drawBorder(ctx, { width: drawWidth, height: drawHeight })

    // Logo/Brasão (placeholder)
    await this.drawLogo(ctx, { width: drawWidth, height: drawHeight })

    // Título principal
    await this.drawTitle(ctx, { width: drawWidth, height: drawHeight })

    // Corpo do certificado
    await this.drawCertificateBody(ctx, { width: drawWidth, height: drawHeight }, data)

    // Assinaturas
    await this.drawSignatures(ctx, { width: drawWidth, height: drawHeight }, data)

    // Rodapé com ID do certificado
    await this.drawFooter(ctx, { width: drawWidth, height: drawHeight }, data)
    
    // Resetar escala
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Converter para blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0)
    })
  }

  /**
   * Desenha o fundo gradiente sofisticado
   */
  async drawBackground(ctx, canvas) {
    // Fundo branco base
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Gradiente radial central sofisticado
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.max(canvas.width, canvas.height)
    
    const radialGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius * 0.8
    )
    radialGradient.addColorStop(0, 'rgba(59, 130, 246, 0.02)')
    radialGradient.addColorStop(0.3, 'rgba(147, 51, 234, 0.03)')
    radialGradient.addColorStop(0.6, 'rgba(212, 175, 55, 0.02)')
    radialGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)')
    
    ctx.fillStyle = radialGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Padrão geométrico decorativo sutil
    await this.drawGeometricPattern(ctx, canvas)
  }

  /**
   * Desenha padrão geométrico inspirado em cédulas
   */
  async drawGeometricPattern(ctx, canvas) {
    // Padrão de linhas curvas inspirado em guilhoche (mais visível)
    ctx.globalAlpha = 0.15
    ctx.lineWidth = 0.8
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // Criar padrão de ondas horizontais apenas (sem verticais douradas)
    for (let radius = 80; radius < Math.max(canvas.width, canvas.height); radius += 25) {
      // Ondas horizontais primárias azuis
      ctx.strokeStyle = '#3B82F6'
      ctx.beginPath()
      for (let x = 0; x <= canvas.width; x += 1.5) {
        const y = centerY + Math.sin(x * 0.02 + radius * 0.01) * (radius * 0.1)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      
      // Ondas horizontais secundárias azuis (offset)
      ctx.strokeStyle = '#6366F1'
      ctx.globalAlpha = 0.12
      ctx.beginPath()
      for (let x = 0; x <= canvas.width; x += 1.5) {
        const y = centerY + Math.sin(x * 0.025 + radius * 0.015 + Math.PI/3) * (radius * 0.08)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = 0.15
    }
    
    // Padrão de rosetas nos cantos
    const corners = [
      { x: 150, y: 150 },
      { x: canvas.width - 150, y: 150 },
      { x: 150, y: canvas.height - 150 },
      { x: canvas.width - 150, y: canvas.height - 150 }
    ]
    
    ctx.strokeStyle = '#9CA3AF'
    corners.forEach(corner => {
      for (let i = 0; i < 12; i++) {
        ctx.beginPath()
        const angle = (i * Math.PI) / 6
        const innerRadius = 20
        const outerRadius = 40
        
        ctx.moveTo(
          corner.x + Math.cos(angle) * innerRadius,
          corner.y + Math.sin(angle) * innerRadius
        )
        ctx.lineTo(
          corner.x + Math.cos(angle) * outerRadius,
          corner.y + Math.sin(angle) * outerRadius
        )
        ctx.stroke()
      }
    })
    
    ctx.globalAlpha = 1
  }

  /**
   * Desenha bordas decorativas com ornamentos
   */
  async drawBorder(ctx, canvas) {
    const margin = 40
    const borderWidth = 8
    
    // Sombra da borda principal
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    // Borda externa - dourada com gradiente
    const borderGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    borderGradient.addColorStop(0, '#F7C44D')
    borderGradient.addColorStop(0.5, '#D4AF37')
    borderGradient.addColorStop(1, '#B8941F')
    
    ctx.strokeStyle = borderGradient
    ctx.lineWidth = borderWidth
    ctx.strokeRect(margin, margin, canvas.width - 2 * margin, canvas.height - 2 * margin)
    
    // Resetar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // Borda interna - azul com gradiente
    const innerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    innerGradient.addColorStop(0, '#60A5FA')
    innerGradient.addColorStop(0.5, '#3B82F6')
    innerGradient.addColorStop(1, '#2563EB')
    
    ctx.strokeStyle = innerGradient
    ctx.lineWidth = 2
    ctx.strokeRect(margin + 20, margin + 20, canvas.width - 2 * (margin + 20), canvas.height - 2 * (margin + 20))
    
    // Bordas ornamentais nos cantos
    await this.drawCornerOrnaments(ctx, canvas, margin)
  }

  /**
   * Desenha ornamentos decorativos nos cantos com posicionamento preciso
   */
  async drawCornerOrnaments(ctx, canvas, margin) {
    const ornamentSize = 75 // Maior para ornamentos mais elaborados
    const borderWidth = 8
    
    // COORDENADAS EXATAS DOS CANTOS DA MOLDURA DOURADA
    const corners = [
      { 
        x: margin, 
        y: margin, 
        rotation: 0,           // Superior esquerdo - sem rotação ✅
        name: 'top-left' 
      },
      { 
        x: canvas.width - margin, 
        y: margin, 
        rotation: Math.PI/2,   // Superior direito - rotação +90° (corrigido)
        name: 'top-right' 
      },
      { 
        x: margin, 
        y: canvas.height - margin, 
        rotation: -Math.PI/2,  // Inferior esquerdo - rotação -90° (corrigido)
        name: 'bottom-left' 
      },
      { 
        x: canvas.width - margin, 
        y: canvas.height - margin, 
        rotation: Math.PI,     // Inferior direito - rotação 180° ✅
        name: 'bottom-right' 
      }
    ]
    
    // Desenhar ornamento em cada canto com rotação específica
    corners.forEach((corner, index) => {
      ctx.save()
      
      // Posicionar exatamente no canto da moldura
      ctx.translate(corner.x, corner.y)
      
      // Rotacionar para alinhar quina do L com canto da moldura
      ctx.rotate(corner.rotation)
      
      // Desenhar ornamento barroco elaborado
      this.drawOrnamentPattern(ctx, ornamentSize)
      
      ctx.restore()
    })
  }

  /**
   * Desenha extensão barroca do canto da moldura (apenas perímetro)
   */
  drawOrnamentPattern(ctx, size) {
    const half = size / 2
    
    // Sombra do ornamento
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    // EXTENSÃO DA MOLDURA NO CANTO (com preenchimento dourado)
    ctx.strokeStyle = '#B8941F'
    ctx.fillStyle = '#B8941F' // Preenchimento dourado igual à borda
    ctx.lineWidth = 2
    
    // Forma em L que se estende da moldura para dentro do certificado
    ctx.beginPath()
    
    // Começar exatamente no canto (0,0) - canto da moldura
    ctx.moveTo(0, 0)
    
    // Braço horizontal (direita)
    ctx.lineTo(half * 1.2, 0) // Linha horizontal
    ctx.bezierCurveTo(
      half * 1.4, half * 0.1,   // Curva decorativa
      half * 1.3, half * 0.3,
      half * 1.0, half * 0.4
    )
    ctx.bezierCurveTo(
      half * 0.8, half * 0.5,   // Volta para dentro
      half * 0.6, half * 0.4,
      half * 0.5, half * 0.25
    )
    
    // Conexão para braço vertical
    ctx.bezierCurveTo(
      half * 0.4, half * 0.3,
      half * 0.3, half * 0.4,
      half * 0.25, half * 0.5
    )
    
    // Braço vertical (baixo)
    ctx.bezierCurveTo(
      half * 0.4, half * 0.6,
      half * 0.5, half * 0.8,
      half * 0.4, half * 1.0
    )
    ctx.bezierCurveTo(
      half * 0.3, half * 1.3,   // Curva decorativa
      half * 0.1, half * 1.4,
      0, half * 1.2              // Linha vertical até o canto
    )
    
    // Fechar no canto
    ctx.lineTo(0, 0)
    ctx.closePath()
    
    // Preencher com cor dourada e desenhar contorno
    ctx.fill()
    ctx.stroke()
    
    // Resetar efeitos
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  /**
   * Desenha logo/brasão
   */
  async drawLogo(ctx, canvas) {
    const centerX = canvas.width / 2
    const logoY = 100
    
    try {
      // Tentar carregar logo do EduPlatform
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        // Tentar carregar de várias possíveis localizações
        img.src = '/icon.png' // ou qualquer logo do EduPlatform disponível
      })
      
      // Layout horizontal: Símbolo + EduPlatform (altura 64px) - perfeitamente alinhado
      const symbolSize = 64 // Altura de 64px
      const fontSize = 64 // Altura de 64px
      const spacing = 12 // Espaço menor entre símbolo e texto
      // Medir texto EduPlatform para centralização precisa
      ctx.font = `bold ${fontSize}px Arial`
      const eduplatformWidth = ctx.measureText('EduPlatform').width
      const totalWidth = symbolSize + spacing + eduplatformWidth // Largura real total
      const symbolX = centerX - totalWidth/2 + symbolSize/2 // Símbolo à esquerda
      const textX = symbolX + symbolSize/2 + spacing   // Texto à direita do símbolo
      
      // Sombra do símbolo
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Desenhar símbolo
      ctx.drawImage(img, symbolX - symbolSize/2, logoY - symbolSize/2, symbolSize, symbolSize)
      
      // Resetar sombra
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Sombra do texto
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      // Texto "EduPlatform" ao lado
      ctx.fillStyle = '#1F2937'
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'left'
      ctx.fillText('EduPlatform', textX, logoY + 20)
      
    } catch (error) {
      // Fallback: layout horizontal com símbolo criado (64px) - perfeitamente alinhado
      console.log('Logo não encontrada, usando fallback textual')
      
      const symbolSize = 64 // Altura de 64px
      const fontSize = 64 // Altura de 64px
      const spacing = 12 // Espaço menor entre símbolo e texto
      // Medir texto EduPlatform para centralização precisa
      ctx.font = `bold ${fontSize}px Arial`
      const eduplatformWidth = ctx.measureText('EduPlatform').width
      const totalWidth = symbolSize + spacing + eduplatformWidth // Largura real total
      const symbolX = centerX - totalWidth/2 + symbolSize/2 // Símbolo à esquerda
      const textX = symbolX + symbolSize/2 + spacing   // Texto à direita do símbolo
      
      // Sombra do símbolo
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Símbolo circular com gradiente
      const gradient = ctx.createRadialGradient(symbolX, logoY, 0, symbolX, logoY, symbolSize/2)
      gradient.addColorStop(0, '#3B82F6')
      gradient.addColorStop(1, '#1E40AF')
      
      ctx.beginPath()
      ctx.arc(symbolX, logoY, symbolSize/2, 0, 2 * Math.PI)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Borda dourada no símbolo
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 4 // Proporcional ao tamanho de 64px
      ctx.stroke()
      
      // Resetar sombra
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Letra "I" no símbolo
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('I', symbolX, logoY + 10)
      
      // Sombra do texto
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      // Texto "EduPlatform" ao lado
      ctx.fillStyle = '#1F2937'
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'left'
      ctx.fillText('EduPlatform', textX, logoY + 20)
    }
    
    // Resetar qualquer sombra anterior
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // Assinatura completa embaixo (independente de usar logo real ou fallback)
    const signatureY = logoY + 70 // Espaço para logo de 64px
    const signatureText = 'INSTITUTO DE APOIO PEDAGÓGICO E CULTURAL EM GOIÁS'
    
    // Sombra da assinatura
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    ctx.fillStyle = '#6B7280'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    
    // Medir texto para ajustar largura da logo completa
    const textMetrics = ctx.measureText(signatureText)
    const textWidth = textMetrics.width
    
    // Desenhar a assinatura centralizada
    ctx.fillText(signatureText, centerX, signatureY)
    
    // Resetar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // Linha decorativa elaborada embaixo da assinatura
    const lineY = signatureY + 15
    const lineMargin = 20
    
    // Gradiente para a linha
    const lineGradient = ctx.createLinearGradient(centerX - textWidth/2, lineY, centerX + textWidth/2, lineY)
    lineGradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)')
    lineGradient.addColorStop(0.5, '#D4AF37')
    lineGradient.addColorStop(1, 'rgba(212, 175, 55, 0.3)')
    
    // Linha principal
    ctx.beginPath()
    ctx.moveTo(centerX - textWidth/2 + lineMargin, lineY)
    ctx.lineTo(centerX + textWidth/2 - lineMargin, lineY)
    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Pontos decorativos nas extremidades
    ctx.fillStyle = '#D4AF37'
    ctx.beginPath()
    ctx.arc(centerX - textWidth/2 + lineMargin, lineY, 2, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(centerX + textWidth/2 - lineMargin, lineY, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  /**
   * Desenha o título principal com sombras
   */
  async drawTitle(ctx, canvas) {
    const centerX = canvas.width / 2
    const titleY = 240 // Espaço para logo de 64px
    
    // Sombra do título principal
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    // Título "CERTIFICADO"
    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 48px serif'
    ctx.textAlign = 'center'
    ctx.fillText('CERTIFICADO', centerX, titleY)
    
    // Sombra do subtítulo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    // Subtítulo
    ctx.fillStyle = '#6B7280'
    ctx.font = '24px serif'
    ctx.fillText('DE CONCLUSÃO', centerX, titleY + 40)
    
    // Resetar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  /**
   * Desenha o corpo do certificado
   */
  async drawCertificateBody(ctx, canvas, data) {
    const centerX = canvas.width / 2
    let currentY = 340 // Ajuste para logo de 64px
    
    // Texto principal
    ctx.fillStyle = '#374151'
    ctx.font = '20px serif'
    ctx.textAlign = 'center'
    
    const lines = [
      'Certificamos que',
      '',
      data.studentName.toUpperCase(),
      `CPF: ${data.studentCpf}`,
      '',
      'concluiu com aproveitamento o curso',
      '',
      `"${data.courseName}"`,
      '',
      `com carga horária de ${data.courseHours || 'N/A'} horas,`,
      `ministrado por ${data.teacherName},`,
      `em ${data.completionDate}.`
    ]
    
    lines.forEach((line, index) => {
      if (line === data.studentName.toUpperCase()) {
        // Nome do estudante em destaque
        ctx.fillStyle = '#3B82F6'
        ctx.font = 'bold 32px serif'
        ctx.fillText(line, centerX, currentY)
        ctx.fillStyle = '#374151'
        ctx.font = '20px serif'
        
        // Linha decorativa sob o nome
        ctx.beginPath()
        ctx.moveTo(centerX - 200, currentY + 10)
        ctx.lineTo(centerX + 200, currentY + 10)
        ctx.strokeStyle = '#D4AF37'
        ctx.lineWidth = 2
        ctx.stroke()
        
      } else if (line.startsWith('CPF:')) {
        // CPF em destaque sutil
        ctx.fillStyle = '#6B7280'
        ctx.font = '18px serif'
        ctx.fillText(line, centerX, currentY)
        ctx.fillStyle = '#374151'
        ctx.font = '20px serif'
      } else if (line.startsWith('"') && line.endsWith('"')) {
        // Nome do curso em destaque
        ctx.fillStyle = '#7C3AED'
        ctx.font = 'bold 24px serif'
        ctx.fillText(line, centerX, currentY)
        ctx.fillStyle = '#374151'
        ctx.font = '20px serif'
      } else {
        // Texto normal
        ctx.fillText(line, centerX, currentY)
      }
      
      currentY += line === '' ? 15 : 35
    })
  }

  /**
   * Desenha as assinaturas
   */
  async drawSignatures(ctx, canvas, data) {
    const signatureY = 650
    const leftX = 250
    const rightX = canvas.width - 250
    
    // Linha para assinatura do aluno
    ctx.beginPath()
    ctx.moveTo(leftX - 100, signatureY)
    ctx.lineTo(leftX + 100, signatureY)
    ctx.strokeStyle = '#6B7280'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Linha para assinatura da instituição
    ctx.beginPath()
    ctx.moveTo(rightX - 100, signatureY)
    ctx.lineTo(rightX + 100, signatureY)
    ctx.stroke()
    
    // Texto das assinaturas
    ctx.fillStyle = '#6B7280'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    
    ctx.fillText(data.studentName, leftX, signatureY + 20)
    ctx.fillText('Aluno(a)', leftX, signatureY + 35)
    
    ctx.fillText('EduPlatform', rightX, signatureY + 20)
    ctx.fillText('Instituição', rightX, signatureY + 35)
  }

  /**
   * Desenha o rodapé com ID do certificado
   */
  async drawFooter(ctx, canvas, data) {
    const margin = 40
    const footerY = canvas.height - (margin + 20) - 80 // 80px acima da moldura azul
    const centerX = canvas.width / 2
    
    // ID do certificado
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`Certificado ID: ${data.certificateId}`, centerX, footerY)
    
    // Data de emissão
    ctx.fillText(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, centerX, footerY + 20)
    
    // URL de verificação individual
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_URL || 'https://eduplatform.com.br'
    ctx.fillText(`Verificar autenticidade em: ${baseUrl}/verify/${data.certificateId}`, centerX, footerY + 40)
    
    // URL de consulta pública por CPF
    ctx.fillText(`Consulta pública por CPF: ${baseUrl}/consulta-certificados`, centerX, footerY + 60)
  }

  /**
   * Converte blob para download
   */
  async downloadCertificate(blob, filename) {
    if (!blob) return
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Gera certificado em PDF protegido
   */
  async generatePDF(data) {
    // Gerar certificado em canvas primeiro
    await this.generateCertificate(data)
    
    // Criar PDF em A4 paisagem
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    })
    
    // Converter canvas para imagem
    const imgData = this.canvas.toDataURL('image/png', 1.0)
    
    // Adicionar imagem ao PDF (ocupando toda a página)
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST')
    
    // Configurar metadados do PDF
    pdf.setProperties({
      title: `Certificado - ${data.courseName}`,
      subject: 'Certificado de Conclusão de Curso',
      author: 'Instituto EduPlatform',
      keywords: 'certificado, EduPlatform, educação',
      creator: 'EduPlatform EAD Platform'
    })
    
    // Adicionar proteção contra edição
    // Nota: jsPDF não suporta proteção nativa, mas podemos adicionar restrições básicas
    pdf.setDocumentProperties({
      title: `Certificado - ${data.courseName}`,
      subject: 'Certificado de Conclusão',
      author: 'EduPlatform',
      keywords: 'certificado, conclusão, curso',
      creator: 'Instituto EduPlatform'
    })
    
    return pdf
  }

  /**
   * Baixa certificado em PDF
   */
  async downloadPDF(data) {
    try {
      const pdf = await this.generatePDF(data)
      const filename = `certificado_${data.studentName.replace(/\s+/g, '_')}_${data.certificateId}.pdf`
      
      // Salvar PDF
      pdf.save(filename)
      
      return { success: true, filename, format: 'pdf' }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Gera e baixa certificado completo (PNG)
   */
  async generateAndDownload(data) {
    try {
      const blob = await this.generateCertificate(data)
      const filename = `certificado_${data.studentName.replace(/\s+/g, '_')}_${data.certificateId}.png`
      await this.downloadCertificate(blob, filename)
      return { success: true, filename, format: 'png' }
    } catch (error) {
      console.error('Erro ao gerar certificado:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Gera e baixa certificado em PDF (método principal)
   */
  async generateAndDownloadPDF(data) {
    return await this.downloadPDF(data)
  }
}

// Instância singleton
export const certificateGenerator = new CertificateGenerator()

/**
 * Função helper para gerar certificado
 */
export async function generateCertificate(enrollmentData) {
  const data = {
    studentName: enrollmentData.student_name,
    studentCpf: enrollmentData.student_cpf || 'N/A',
    courseName: enrollmentData.course_name,
    teacherName: enrollmentData.teacher_name,
    completionDate: new Date(enrollmentData.completed_at).toLocaleDateString('pt-BR'),
    certificateId: enrollmentData.certificate_id || `CERT-${Date.now()}`,
    courseHours: Math.floor(enrollmentData.course_duration / 60) || 1
  }
  
  return await certificateGenerator.generateAndDownload(data)
}