'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Link from 'next/link'
import EnrollmentCard from './enrollment-card'

export default function EnrollmentList({ initialEnrollments = [] }) {
  const [enrollments, setEnrollments] = useState(initialEnrollments)

  const handleUnenroll = (enrollmentId) => {
    setEnrollments(enrollments.filter(e => e.id !== enrollmentId))
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Meus Cursos
      </h3>
      
      {enrollments && enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              onUnenroll={handleUnenroll}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h4 className="text-lg font-semibold mb-2">
            Nenhum curso encontrado
          </h4>
          <p className="text-gray-600 mb-4">
            Você ainda não está matriculado em nenhum curso. Explore nosso catálogo!
          </p>
          <Link href="/courses">
            <Button>
              Explorar Cursos
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}