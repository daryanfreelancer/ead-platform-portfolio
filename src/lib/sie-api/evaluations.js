import { sieApiClient } from './client'

/**
 * Verificar se um curso SIE foi completado pelo usuário
 * @param {string} userId - ID do usuário SIE
 * @param {string} userToken - Token privado do usuário SIE
 * @param {string} courseId - ID do curso SIE
 * @returns {Promise<Object>} Status de conclusão do curso
 */
export async function checkSieCourseCompletion(userId, userToken, courseId) {
  try {
    // Obter resumo do curso do usuário
    const response = await sieApiClient.makeRequest('/api/course/get-summary', {
      user_id: userId,
      user_token: userToken,
      course_id: courseId
    })

    if (response.COURSE) {
      const courseData = response.COURSE
      const userProgress = courseData.course_user

      return {
        success: true,
        completed: userProgress.user_course_completed === 100,
        completionPercentage: userProgress.user_course_completed,
        grade: userProgress.user_course_grade,
        completionDate: userProgress.user_course_date_conclusion,
        lastAccess: userProgress.user_course_date_lastaccess,
        timeElapsed: userProgress.user_course_time_elapsed
      }
    }

    return {
      success: false,
      error: 'Curso não encontrado ou usuário não matriculado'
    }

  } catch (error) {
    console.error('Erro ao verificar conclusão do curso SIE:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Obter tópicos de um curso SIE incluindo avaliações
 * @param {string} userId - ID do usuário SIE
 * @param {string} userToken - Token privado do usuário SIE
 * @param {string} courseId - ID do curso SIE
 * @returns {Promise<Object>} Lista de tópicos do curso
 */
export async function getSieCourseTopics(userId, userToken, courseId) {
  try {
    const response = await sieApiClient.makeRequest('/api/course/get-topics', {
      user_id: userId,
      user_token: userToken,
      course_id: courseId,
      include_reflections: 1,
      include_reactions: 1
    })

    if (response.TOPICS) {
      return {
        success: true,
        topics: response.TOPICS,
        evaluations: response.TOPICS.filter(topic => topic.topic_type === 1), // Avaliações finais
        allTopicsCompleted: response.TOPICS.every(topic => topic.topic_completed === 1)
      }
    }

    return {
      success: false,
      error: 'Tópicos não encontrados'
    }

  } catch (error) {
    console.error('Erro ao obter tópicos do curso SIE:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verificar se um usuário pode obter certificado de um curso SIE
 * @param {string} userId - ID do usuário SIE
 * @param {string} userToken - Token privado do usuário SIE
 * @param {string} courseId - ID do curso SIE
 * @returns {Promise<Object>} Elegibilidade para certificado
 */
export async function checkSieCertificateEligibility(userId, userToken, courseId) {
  try {
    // Verificar conclusão do curso
    const completion = await checkSieCourseCompletion(userId, userToken, courseId)
    
    if (!completion.success) {
      return {
        eligible: false,
        reason: completion.error
      }
    }

    if (!completion.completed) {
      return {
        eligible: false,
        reason: `Curso não concluído (${completion.completionPercentage}% completo)`
      }
    }

    // Verificar tópicos e avaliações
    const topics = await getSieCourseTopics(userId, userToken, courseId)
    
    if (!topics.success) {
      return {
        eligible: false,
        reason: topics.error
      }
    }

    // Verificar se todas as avaliações foram completadas
    const evaluations = topics.evaluations || []
    const pendingEvaluations = evaluations.filter(evaluation => evaluation.topic_completed !== 1)

    if (pendingEvaluations.length > 0) {
      return {
        eligible: false,
        reason: `Avaliações pendentes: ${pendingEvaluations.map(evaluation => evaluation.topic_title).join(', ')}`
      }
    }

    // Verificar se todos os tópicos foram completados
    if (!topics.allTopicsCompleted) {
      return {
        eligible: false,
        reason: 'Nem todos os tópicos foram completados'
      }
    }

    // Verificar nota mínima (se aplicável)
    const minimumGrade = 70 // Pode ser configurável
    if (completion.grade < minimumGrade) {
      return {
        eligible: false,
        reason: `Nota insuficiente: ${completion.grade}% (mínimo: ${minimumGrade}%)`
      }
    }

    return {
      eligible: true,
      reason: 'Curso SIE concluído com sucesso',
      completionData: completion,
      topicsData: topics
    }

  } catch (error) {
    console.error('Erro ao verificar elegibilidade do certificado SIE:', error)
    return {
      eligible: false,
      reason: error.message
    }
  }
}

/**
 * Obter certificados disponíveis para um usuário SIE
 * @param {string} userId - ID do usuário SIE
 * @param {string} userToken - Token privado do usuário SIE
 * @returns {Promise<Object>} Lista de certificados SIE
 */
export async function getSieCertificates(userId, userToken) {
  try {
    const response = await sieApiClient.makeRequest('/api/certificate/get-certificates', {
      user_id: userId,
      user_token: userToken
    })

    if (response.COURSES) {
      return {
        success: true,
        certificates: response.COURSES.map(course => ({
          courseId: course.course_id,
          courseTitle: course.course_title,
          completionDate: course.course_date_start,
          timeElapsed: course.course_time_elapsed,
          certificateUrl: course.course_certificate_pdf, // URL do certificado SIE (ignorar)
          hasCertificate: !!course.course_certificate_pdf,
          cpfExists: course.course_user_cpf_exists === 1
        }))
      }
    }

    return {
      success: false,
      error: 'Certificados não encontrados'
    }

  } catch (error) {
    console.error('Erro ao obter certificados SIE:', error)
    return {
      success: false,
      error: error.message
    }
  }
}