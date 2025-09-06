// ===== ARQUIVO: src/lib/utils.js =====
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCPF(cpf) {
  if (!cpf) return ''
  return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('pt-BR')
}

export function validateCPF(cpf) {
  if (!cpf) return false
  
  // Remove pontos, traços e espaços
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validar primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cleanCPF[9])) return false
  
  // Validar segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cleanCPF[10])) return false
  
  return true
}
