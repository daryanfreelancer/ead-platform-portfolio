'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LessonPlayerUnified } from './lesson-player-unified'
import { CourseContentEnhanced } from './course-content-enhanced'
import { VideoPlayer } from './video-player'
import { CourseContent } from './course-content'
import { ProgressTracker } from './progress-tracker'

const supabase = createClient()

export function LearningInterface({ course, enrollment, user }) {
  const [lessons, setLessons] = useState([])
  const [currentLessonId, setCurrentLessonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasLessons, setHasLessons] = useState(false)
  const [lessonTransitioning, setLessonTransitioning] = useState(false)
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0)

  useEffect(() => {
    loadLessons()
  }, [course.id])

  const loadLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index')
      
      if (error) throw error
      
      const lessonsData = data || []
      setLessons(lessonsData)
      setHasLessons(lessonsData.length > 0)
      
      // Set first lesson as current if there are lessons
      if (lessonsData.length > 0 && !currentLessonId) {
        setCurrentLessonId(lessonsData[0].id)
      }
    } catch (error) {
      console.error('Error loading lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLessonChange = (lessonId) => {
    setCurrentLessonId(lessonId)
  }

  const handleLessonSelect = (lessonId) => {
    console.log('🔄 LearningInterface: Changing lesson to:', lessonId)
    setLessonTransitioning(true)
    setCurrentLessonId(lessonId)
    // Reset transitioning state after a short delay
    setTimeout(() => setLessonTransitioning(false), 300)
  }

  const handleProgressUpdate = () => {
    // Trigger re-render of CourseContentEnhanced to reload progress
    setProgressUpdateTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando curso...</p>
        </div>
      </div>
    )
  }

  // If course has lessons, use the enhanced lesson-based interface
  if (hasLessons) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {/* Lesson Video Player - Main Area */}
            <div className="lg:col-span-3">
              <div className={`transition-opacity duration-300 ${lessonTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                <LessonPlayerUnified
                  course={course}
                  enrollment={enrollment}
                  lessons={lessons}
                  currentLessonId={currentLessonId}
                  onLessonChange={handleLessonChange}
                  onProgressUpdate={handleProgressUpdate}
                  user={user}
                />
              </div>
              
              {/* Enhanced Course Content */}
              <div className="bg-white">
                <CourseContentEnhanced
                  course={course}
                  enrollment={enrollment}
                  onLessonSelect={handleLessonSelect}
                  currentLessonId={currentLessonId}
                  progressUpdateTrigger={progressUpdateTrigger}
                  user={user}
                />
              </div>
            </div>

            {/* Sidebar - Progress and Information */}
            <div className="lg:col-span-1 bg-gray-50 min-h-screen">
              <ProgressTracker
                course={course}
                enrollment={enrollment}
                user={user}
                progressUpdateTrigger={progressUpdateTrigger}
                onLessonSelect={handleLessonSelect}
                currentLessonId={currentLessonId}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If course has no lessons, use the original single-video interface
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Original Video Player - Main Area */}
          <div className="lg:col-span-3">
            <VideoPlayer
              course={course}
              enrollment={enrollment}
              user={user}
            />
            
            {/* Original Course Content */}
            <div className="bg-white">
              <CourseContent
                course={course}
                enrollment={enrollment}
                progressUpdateTrigger={progressUpdateTrigger}
              />
            </div>
          </div>

          {/* Sidebar - Progress and Information */}
          <div className="lg:col-span-1 bg-gray-50 min-h-screen">
            <ProgressTracker
              course={course}
              enrollment={enrollment}
              user={user}
              progressUpdateTrigger={progressUpdateTrigger}
              onLessonSelect={handleLessonSelect}
              currentLessonId={currentLessonId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}