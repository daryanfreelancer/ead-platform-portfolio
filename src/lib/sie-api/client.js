/**
 * Cliente para API SIE (Sistema Integrado de Ensino)
 * Documentação: https://www.sie.com.br/api/doc/
 * Base URL: https://www.iped.com.br/
 */

class SieApiClient {
  constructor() {
    this.baseUrl = 'https://www.iped.com.br'
    // IMPORTANTE: Usar apenas a chave server-side para segurança
    this.token = process.env.SIE_API_TOKEN
    this.apiVersion = '1.0'
    
    // Rate limiting - máximo 60 requisições por minuto
    this.rateLimitQueue = []
    this.rateLimitWindow = 60 * 1000 // 1 minuto
    this.maxRequestsPerWindow = 60
    
    // Cache simples para dados que não mudam frequentemente
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutos
  }

  /**
   * Verificar rate limiting
   * @returns {Promise<void>}
   */
  async checkRateLimit() {
    const now = Date.now()
    
    // Remover requisições antigas da janela
    this.rateLimitQueue = this.rateLimitQueue.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    )
    
    // Verificar se excedeu o limite
    if (this.rateLimitQueue.length >= this.maxRequestsPerWindow) {
      const oldestRequest = Math.min(...this.rateLimitQueue)
      const waitTime = this.rateLimitWindow - (now - oldestRequest)
      
      console.warn(`Rate limit atingido. Aguardando ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // Tentar novamente após aguardar
      return this.checkRateLimit()
    }
    
    // Adicionar timestamp atual
    this.rateLimitQueue.push(now)
  }

  /**
   * Obter dados do cache
   * @param {string} key - Chave do cache
   * @returns {*} - Dados do cache ou null
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  /**
   * Salvar dados no cache
   * @param {string} key - Chave do cache
   * @param {*} data - Dados a serem salvos
   */
  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Fazer requisição para API SIE
   * @param {string} endpoint - Endpoint da API
   * @param {Object} params - Parâmetros da requisição
   * @param {boolean|string} useCache - Se deve usar cache ou chave específica
   * @returns {Promise<Object>} - Resposta da API
   */
  async makeRequest(endpoint, params = {}, useCache = false) {
    if (!this.token) {
      throw new Error('Token da API SIE não configurado')
    }

    // Verificar cache primeiro
    if (useCache) {
      const cacheKey = typeof useCache === 'string' 
        ? useCache 
        : `${endpoint}:${JSON.stringify(params)}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log(`📦 Cache hit para ${cacheKey}`)
        return cached
      }
    }

    // Verificar rate limiting
    await this.checkRateLimit()

    try {
      const formData = new FormData()
      
      // Adicionar token obrigatório
      formData.append('token', this.token)
      
      // Adicionar versão da API
      formData.append('api_version', this.apiVersion)
      
      // Adicionar outros parâmetros
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          formData.append(key, params[key])
        }
      })

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          // Adicionar User-Agent para melhor identificação
          'User-Agent': 'EduPlatform-EAD-Platform/1.0',
          // Não definir Content-Type - deixar o navegador definir para FormData
          // 'Content-Type': 'multipart/form-data' // ❌ Incorreto
        },
        // Adicionar timeout para evitar requisições infinitas
        timeout: 30000 // 30 segundos
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      // Verificar se a resposta indica sucesso
      if (data.STATE !== 1) {
        throw new Error(data.ERROR || 'Erro na API SIE')
      }

      // Salvar no cache se solicitado
      if (useCache) {
        const cacheKey = typeof useCache === 'string' 
          ? useCache 
          : `${endpoint}:${JSON.stringify(params)}`
        this.saveToCache(cacheKey, data)
        console.log(`💾 Dados salvos no cache: ${cacheKey}`)
      }

      return data
    } catch (error) {
      console.error('Erro na requisição SIE:', error)
      throw error
    }
  }

  /**
   * Buscar cursos disponíveis
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} - Lista de cursos
   */
  async getCourses(filters = {}) {
    const params = {
      // Parâmetros obrigatórios já incluídos no makeRequest (token)
      
      // Parâmetros de paginação (máximo 100 por página)
      results: Math.min(filters.results || 20, 100),
      page: filters.page || 1,
      
      // Filtros opcionais conforme documentação SIE
      category_id: filters.category_id,
      query: filters.query, // Busca por título
      order: filters.order || 'title',
      all_formats: filters.all_formats || true,
      
      // Outros filtros opcionais
      user_id: filters.user_id,
      user_token: filters.user_token,
      profession_id: filters.profession_id,
      course_id: filters.course_id,
      teacher_id: filters.teacher_id,
      type: filters.type,
      always_show: filters.always_show,
      external_lms: filters.external_lms,
      expire_url_minutes: filters.expire_url_minutes,
      include_topics: filters.include_topics,
      include_skills: filters.include_skills,
      include_unlimited: filters.include_unlimited,
      iped_only: filters.iped_only
    }

    // Limpar parâmetros vazios ou undefined
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    // Cache mais granular baseado nos filtros (chave única por combinação)
    const cacheKey = `courses:${JSON.stringify({
      page: params.page,
      results: params.results,
      category_id: params.category_id,
      query: params.query,
      order: params.order
    })}`
    
    // Usar cache apenas para consultas públicas (sem user context)
    const useCache = !params.user_id && !params.user_token
    
    return this.makeRequest('/api/course/get-courses', params, useCache ? cacheKey : false)
  }

  /**
   * Buscar detalhes de um curso específico
   * @param {string} courseId - ID do curso
   * @returns {Promise<Object>} - Detalhes do curso
   */
  async getCourseDetails(courseId) {
    return this.makeRequest('/api/course/get-details', {
      course_id: courseId
    })
  }

  /**
   * Buscar cursos em destaque
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Object>} - Cursos em destaque
   */
  async getFeaturedCourses(limit = 10) {
    return this.makeRequest('/api/course/get-featured', {
      results: limit
    })
  }

  /**
   * Buscar categorias disponíveis
   * @returns {Promise<Object>} - Lista de categorias
   */
  async getCategories() {
    // Categorias raramente mudam, usar cache sempre
    return this.makeRequest('/api/category/get-categories', {
      all_formats: true
    }, true)
  }

  /**
   * Fazer login de usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Dados do usuário logado
   */
  async userLogin(email, password) {
    return this.makeRequest('/api/user/login', {
      user_email: email,
      user_password: password
    })
  }

  /**
   * Cadastrar novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} - Dados do usuário criado
   */
  async userSignup(userData) {
    const params = {
      user_name: userData.name,
      user_email: userData.email,
      user_password: userData.password,
      user_cpf: userData.cpf,
      user_country: userData.country || 34, // Brasil
      user_genre: userData.gender || 2, // Não especificado
      user_info: userData.info || ''
    }

    return this.makeRequest('/api/user/signup', params)
  }

  /**
   * Matricular usuário em curso
   * @param {string} userId - ID do usuário SIE
   * @param {string} userToken - Token privado do usuário SIE
   * @param {string} courseId - ID do curso
   * @param {number} courseType - Tipo do curso (padrão: 3)
   * @param {number} coursePlan - Plano do curso (padrão: 1)
   * @returns {Promise<Object>} - Confirmação da matrícula
   */
  async enrollUser(userId, userToken, courseId, courseType = 3, coursePlan = 1) {
    return this.makeRequest('/api/user/set-registration', {
      user_id: userId,
      user_token: userToken,
      course_id: courseId,
      course_type: courseType,
      course_plan: coursePlan
    })
  }

  /**
   * Obter ambiente/URL de acesso ao curso
   * @param {string} userId - ID do usuário SIE
   * @param {string} courseId - ID do curso
   * @returns {Promise<Object>} - URL de acesso ao curso
   */
  async getCourseEnvironment(userId, courseId) {
    return this.makeRequest('/api/course/get-environment', {
      user_id: userId,
      course_id: courseId,
      course_layout: 2,
      course_activities: 1
    })
  }

  /**
   * Buscar cursos completados pelo usuário
   * @param {string} userId - ID do usuário SIE
   * @returns {Promise<Object>} - Cursos completados
   */
  async getCompletedCourses(userId) {
    return this.makeRequest('/api/course/get-completed', {
      user_id: userId
    })
  }

  /**
   * Buscar cursos em progresso pelo usuário
   * @param {string} userId - ID do usuário SIE
   * @returns {Promise<Object>} - Cursos em progresso
   */
  async getInProgressCourses(userId) {
    return this.makeRequest('/api/course/get-inprogress', {
      user_id: userId
    })
  }

  /**
   * Verificar status da API
   * @returns {Promise<boolean>} - Se API está funcionando
   */
  async checkApiStatus() {
    try {
      // Fazer uma requisição simples para verificar conectividade
      await this.getCategories()
      return true
    } catch (error) {
      console.error('API SIE indisponível:', error)
      return false
    }
  }

  /**
   * Sincronizar usuário EduPlatform com SIE
   * @param {Object} userData - Dados do usuário EduPlatform
   * @returns {Promise<Object>} - Dados do usuário SIE
   */
  async syncUser(userData) {
    try {
      // Primeiro, tentar fazer login
      const loginResponse = await this.userLogin(userData.email, userData.password)
      console.log('✅ Usuário já existe na SIE, login realizado')
      return loginResponse
    } catch (loginError) {
      console.log('📝 Usuário não existe na SIE, criando novo usuário...')
      
      // Se login falhar, criar novo usuário
      const signupResponse = await this.userSignup({
        name: userData.full_name,
        email: userData.email,
        password: userData.password || userData.cpf?.replace(/\D/g, '').slice(0, 8),
        cpf: userData.cpf,
        country: 34, // Brasil
        gender: userData.gender || 2,
        info: `Usuário EduPlatform ID: ${userData.id} - Criado automaticamente`
      })

      console.log('🎉 Usuário criado na SIE com sucesso!')
      return signupResponse
    }
  }
}

// Instância singleton do cliente
export const sieApiClient = new SieApiClient()

// Exportar também a classe para testes
export { SieApiClient }

// Funções auxiliares para uso comum
export const sieApi = {
  getCourses: (filters) => sieApiClient.getCourses(filters),
  getCourseDetails: (courseId) => sieApiClient.getCourseDetails(courseId),
  getFeaturedCourses: (limit) => sieApiClient.getFeaturedCourses(limit),
  getCategories: () => sieApiClient.getCategories(),
  syncUser: (userData) => sieApiClient.syncUser(userData),
  enrollUser: (userId, courseId) => sieApiClient.enrollUser(userId, courseId),
  checkStatus: () => sieApiClient.checkApiStatus()
}