'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'

export default function UserRoleManager({ user, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const roles = [
    { value: 'student', label: 'Estudante', color: 'text-blue-600' },
    { value: 'teacher', label: 'Professor', color: 'text-green-600' },
    { value: 'admin', label: 'Administrador', color: 'text-yellow-600' }
  ]

  const handleRoleChange = async (newRole) => {
    if (newRole === user.role) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)

      if (error) throw error

      onUpdate({ ...user, role: newRole })
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      alert('Erro ao atualizar papel do usuário')
    } finally {
      setLoading(false)
    }
  }

  const currentRole = roles.find(r => r.value === user.role)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full
          border transition-colors min-h-[44px] max-w-full overflow-hidden
          ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
          ${user.role === 'teacher' ? 'bg-green-100 text-green-800 border-green-200' : ''}
          ${user.role === 'student' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
          hover:opacity-80 disabled:opacity-50 flex-shrink-0
        `}
      >
        <span className="whitespace-nowrap truncate">{currentRole?.label || 'Não definido'}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              className={`
                w-full text-left px-4 py-2 text-sm hover:bg-gray-50 min-h-[44px] flex items-center
                ${role.value === user.role ? 'bg-gray-50 font-medium' : ''}
              `}
            >
              <span className={`${role.color} truncate flex-1`}>{role.label}</span>
              {role.value === user.role && <span className="flex-shrink-0 ml-2">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}