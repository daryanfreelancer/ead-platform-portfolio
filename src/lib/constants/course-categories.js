// Course categories configuration
export const COURSE_CATEGORIES = {
  capacitacao: { 
    label: 'Capacitação', 
    description: 'Cursos de curta duração para desenvolvimento profissional',
    duration: '40-180 horas',
    icon: '📚'
  },
  tecnologo: { 
    label: 'Tecnólogo', 
    description: 'Graduação tecnológica focada no mercado de trabalho',
    duration: '2-3 anos',
    icon: '💻'
  },
  bacharel: { 
    label: 'Bacharel', 
    description: 'Graduação tradicional com formação ampla',
    duration: '4-5 anos',
    icon: '🎓'
  },
  licenciatura: { 
    label: 'Licenciatura', 
    description: 'Formação para profissionais da educação',
    duration: '4 anos',
    icon: '👨‍🏫'
  },
  tecnico_competencia: { 
    label: 'Técnico por Competência', 
    description: 'Reconhecimento de competências profissionais',
    duration: 'Variável',
    icon: '🏆'
  },
  tecnico: { 
    label: 'Técnico', 
    description: 'Formação técnica de nível médio',
    duration: '1-2 anos',
    icon: '🔧'
  },
  mestrado: { 
    label: 'Mestrado', 
    description: 'Pós-graduação stricto sensu',
    duration: '2 anos',
    icon: '📖'
  },
  doutorado: { 
    label: 'Doutorado', 
    description: 'Formação para pesquisa e docência superior',
    duration: '4 anos',
    icon: '🔬'
  },
  pos_doutorado: { 
    label: 'Pós-Doutorado', 
    description: 'Pesquisa avançada pós-doutoramento',
    duration: '1-2 anos',
    icon: '🌟'
  }
}

// Helper function to get category label
export function getCategoryLabel(categoryKey) {
  return COURSE_CATEGORIES[categoryKey]?.label || categoryKey
}

// Helper function to get category info
export function getCategoryInfo(categoryKey) {
  return COURSE_CATEGORIES[categoryKey] || null
}

// Get all categories as options for select
export function getCategoryOptions() {
  return Object.entries(COURSE_CATEGORIES).map(([value, category]) => ({
    value,
    label: category.label,
    description: category.description
  }))
}

// Category colors for UI
export const CATEGORY_COLORS = {
  capacitacao: 'blue',
  tecnologo: 'purple',
  bacharel: 'green',
  licenciatura: 'yellow',
  tecnico_competencia: 'orange',
  tecnico: 'red',
  mestrado: 'indigo',
  doutorado: 'pink',
  pos_doutorado: 'gray'
}