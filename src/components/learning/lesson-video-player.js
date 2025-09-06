'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayerSimple } from './video-player-simple'
import { PDFPlayerSimple } from './pdf-player-simple'
import { TextPlayerSimple } from './text-player-simple'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  FileText,
  Type,
  Video
} from 'lucide-react'

const supabase = createClient()

export function LessonVideoPlayer({ course, enrollment, lessons, currentLessonId, onLessonChange, user }) {
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lessonProgress, setLessonProgress] = useState({})

  const currentLesson = lessons.find(lesson => lesson.id === currentLessonId)
  const currentLessonIndex = lessons.findIndex(lesson => lesson.id === currentLessonId)
  const controlsTimeoutRef = useRef(null)

  // Load lesson progress on mount
  useEffect(() => {
    loadLessonProgress()
  }, [course.id])

  // Update lesson progress when current lesson changes
  useEffect(() => {
    if (currentLessonId && lessonProgress[currentLessonId]) {
      const progress = lessonProgress[currentLessonId]
      if (videoRef.current && progress.watch_time_seconds) {
        videoRef.current.currentTime = progress.watch_time_seconds
      }
    }
  }, [currentLessonId, lessonProgress])

  const loadLessonProgress = async () => {
    try {
      const response = await fetch(`/api/lesson-progress?course_id=${course.id}`)
      if (response.ok) {
        const progress = await response.json()
        const progressMap = {}
        progress.forEach(p => {
          progressMap[p.lesson_id] = p
        })
        setLessonProgress(progressMap)
      }
    } catch (error) {
      console.error('Error loading lesson progress:', error)
    }
  }

  const updateLessonProgress = async (lessonId, progressPercentage, watchTime) => {
    try {
      const response = await fetch('/api/lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          progress_percentage: progressPercentage,
          watch_time_seconds: watchTime
        })
      })

      if (response.ok) {
        const updatedProgress = await response.json()
        setLessonProgress(prev => ({
          ...prev,
          [lessonId]: updatedProgress
        }))
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Update lesson progress
      if (currentLessonId && video.duration) {
        const progressPercent = Math.round((video.currentTime / video.duration) * 100)
        const watchTime = Math.round(video.currentTime)
        
        // Update every 5 seconds of watch time
        if (watchTime % 5 === 0) {
          updateLessonProgress(currentLessonId, progressPercent, watchTime)
        }
      }
    }

    const handleError = () => {
      setError('Erro ao carregar o vídeo. Verifique a URL ou tente novamente.')
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Mark lesson as completed
      if (currentLessonId) {
        updateLessonProgress(currentLessonId, 100, Math.round(duration))
      }
      
      // Auto-advance to next lesson
      goToNextLesson()
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('error', handleError)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('error', handleError)
      video.removeEventListener('ended', handleEnded)
    }
  }, [currentLessonId, duration])

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1]
      onLessonChange(nextLesson.id)
    }
  }

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1]
      onLessonChange(prevLesson.id)
    }
  }

  const selectLesson = (lessonId) => {
    onLessonChange(lessonId)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    const progressBar = progressRef.current
    if (!video || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skip = (seconds) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const changePlaybackRate = (rate) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement
    if (!videoContainer) return

    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getVideoUrl = () => {
    if (!currentLesson || currentLesson.content_type !== 'video') return null

    if (currentLesson.video_type === 'url' && currentLesson.video_url) {
      // Convert YouTube URLs to embed if needed
      if (currentLesson.video_url.includes('youtube.com/watch?v=')) {
        const videoId = currentLesson.video_url.split('v=')[1]?.split('&')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      if (currentLesson.video_url.includes('youtu.be/')) {
        const videoId = currentLesson.video_url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      return currentLesson.video_url
    }

    if (currentLesson.video_type === 'upload' && currentLesson.video_file_url) {
      const { data } = supabase.storage
        .from('public-assets')
        .getPublicUrl(currentLesson.video_file_url)
      return data.publicUrl
    }

    return null
  }

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'text':
        return <Type className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const isLessonCompleted = (lessonId) => {
    return lessonProgress[lessonId]?.progress_percentage >= 100
  }

  const getLessonProgress = (lessonId) => {
    return lessonProgress[lessonId]?.progress_percentage || 0
  }

  const videoUrl = getVideoUrl()
  const isYouTube = videoUrl?.includes('youtube.com/embed/')
  const contentType = currentLesson?.content_type || 'video'

  if (!currentLesson) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <BookOpen className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Selecione uma aula</h3>
          <p className="text-gray-300">Escolha uma aula para começar a assistir.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
          <Play className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Erro ao carregar vídeo</h3>
          <p className="text-gray-300 text-center">{error}</p>
        </div>
      </div>
    )
  }

  // Handle PDF content
  if (contentType === 'pdf') {
    return (
      <div className="space-y-4">
        {/* Lesson Navigation */}
        <div className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousLesson}
              disabled={currentLessonIndex === 0}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h3 className="font-semibold">{currentLesson.title}</h3>
              <p className="text-sm text-gray-400">
                Aula {currentLessonIndex + 1} de {lessons.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToNextLesson}
              disabled={currentLessonIndex === lessons.length - 1}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Player */}
        <PDFPlayerSimple 
          lesson={currentLesson}
          enrollment={enrollment}
          onProgressUpdate={(progress) => {
            setLessonProgress(prev => ({
              ...prev,
              [currentLesson.id]: { ...prev[currentLesson.id], reading_progress_percentage: progress }
            }))
          }}
        />

        {/* Lesson List removed - navigation now via sidebar */}
        {false && (
          <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-4">Aulas do Curso</h4>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    lesson.id === currentLessonId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => selectLesson(lesson.id)}
                >
                  <div className="flex-shrink-0">
                    {isLessonCompleted(lesson.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <h5 className="font-medium">{lesson.title}</h5>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration} min
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getContentTypeIcon(lesson.content_type || 'video')}
                        <span className="capitalize">
                          {lesson.content_type === 'video' ? 'Vídeo' : 
                           lesson.content_type === 'pdf' ? 'PDF' : 
                           lesson.content_type === 'text' ? 'Texto' : 'Conteúdo'}
                        </span>
                      </div>
                      
                      {!isLessonCompleted(lesson.id) && getLessonProgress(lesson.id) > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${getLessonProgress(lesson.id)}%` }}
                            />
                          </div>
                          <span className="text-xs">{getLessonProgress(lesson.id)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Handle Text content
  if (contentType === 'text') {
    return (
      <div className="space-y-4">
        {/* Lesson Navigation */}
        <div className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousLesson}
              disabled={currentLessonIndex === 0}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h3 className="font-semibold">{currentLesson.title}</h3>
              <p className="text-sm text-gray-400">
                Aula {currentLessonIndex + 1} de {lessons.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToNextLesson}
              disabled={currentLessonIndex === lessons.length - 1}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Text Player */}
        <TextPlayer 
          lesson={currentLesson}
          enrollment={enrollment}
          onProgressUpdate={(progress) => {
            setLessonProgress(prev => ({
              ...prev,
              [currentLesson.id]: { ...prev[currentLesson.id], reading_progress_percentage: progress }
            }))
          }}
        />

        {/* Lesson List removed - navigation now via sidebar */}
        {false && (
          <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-4">Aulas do Curso</h4>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    lesson.id === currentLessonId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => selectLesson(lesson.id)}
                >
                  <div className="flex-shrink-0">
                    {isLessonCompleted(lesson.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <h5 className="font-medium">{lesson.title}</h5>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration} min
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getContentTypeIcon(lesson.content_type || 'video')}
                        <span className="capitalize">
                          {lesson.content_type === 'video' ? 'Vídeo' : 
                           lesson.content_type === 'pdf' ? 'PDF' : 
                           lesson.content_type === 'text' ? 'Texto' : 'Conteúdo'}
                        </span>
                      </div>
                      
                      {!isLessonCompleted(lesson.id) && getLessonProgress(lesson.id) > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${getLessonProgress(lesson.id)}%` }}
                            />
                          </div>
                          <span className="text-xs">{getLessonProgress(lesson.id)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Play className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Conteúdo não disponível</h3>
          <p className="text-gray-300">Esta aula ainda não tem conteúdo disponível.</p>
        </div>
      </div>
    )
  }

  // YouTube Player
  if (isYouTube) {
    return (
      <div className="space-y-4">
        {/* Lesson Navigation */}
        <div className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousLesson}
              disabled={currentLessonIndex === 0}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h3 className="font-semibold">{currentLesson.title}</h3>
              <p className="text-sm text-gray-400">
                Aula {currentLessonIndex + 1} de {lessons.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToNextLesson}
              disabled={currentLessonIndex === lessons.length - 1}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* YouTube Video */}
        <div className="relative w-full h-0 pb-[56.25%] bg-black">
          <iframe
            src={videoUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={currentLesson.title}
          />
        </div>

        {/* Lesson List removed - navigation now via sidebar */}
        {false && (
          <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-4">Aulas do Curso</h4>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    lesson.id === currentLessonId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => selectLesson(lesson.id)}
                >
                  <div className="flex-shrink-0">
                    {isLessonCompleted(lesson.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <h5 className="font-medium">{lesson.title}</h5>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration} min
                      </div>
                      
                      {!isLessonCompleted(lesson.id) && getLessonProgress(lesson.id) > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${getLessonProgress(lesson.id)}%` }}
                            />
                          </div>
                          <span className="text-xs">{getLessonProgress(lesson.id)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Custom Video Player
  return (
    <div className="space-y-4">
      {/* Lesson Navigation */}
      <div className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousLesson}
            disabled={currentLessonIndex === 0}
            className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-semibold">{currentLesson.title}</h3>
            <p className="text-sm text-gray-400">
              Aula {currentLessonIndex + 1} de {lessons.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToNextLesson}
            disabled={currentLessonIndex === lessons.length - 1}
            className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div 
        className="relative w-full h-0 pb-[56.25%] bg-black group"
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          src={videoUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {/* Video Controls */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Progress Bar */}
          <div className="absolute bottom-16 left-4 right-4">
            <div 
              ref={progressRef}
              className="w-full h-1 bg-white/30 rounded cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-500 rounded transition-all duration-100"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Main Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button onClick={togglePlay} className="hover:text-blue-400">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button onClick={() => skip(-10)} className="hover:text-blue-400">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={() => skip(10)} className="hover:text-blue-400">
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="hover:text-blue-400">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative group">
                <button className="hover:text-blue-400 text-sm">
                  {playbackRate}x
                </button>
                <div className="absolute bottom-8 right-0 bg-black/80 rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`block w-full text-left px-2 py-1 text-sm hover:bg-white/20 ${
                        playbackRate === rate ? 'text-blue-400' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={toggleFullscreen} className="hover:text-blue-400">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson List removed - navigation now via sidebar */}
      {false && (
        <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
          <h4 className="font-semibold mb-4">Aulas do Curso</h4>
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  lesson.id === currentLessonId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => selectLesson(lesson.id)}
              >
                <div className="flex-shrink-0">
                  {isLessonCompleted(lesson.id) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}.
                    </span>
                    <h5 className="font-medium">{lesson.title}</h5>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration} min
                    </div>
                    
                    {!isLessonCompleted(lesson.id) && getLessonProgress(lesson.id) > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${getLessonProgress(lesson.id)}%` }}
                          />
                        </div>
                        <span className="text-xs">{getLessonProgress(lesson.id)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}