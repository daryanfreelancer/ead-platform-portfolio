'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw
} from 'lucide-react'

const supabase = createClient()

export function VideoPlayer({ course, enrollment, user }) {
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

  // Timer para esconder controles
  const controlsTimeoutRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      updateProgress(video.currentTime, video.duration)
    }

    const handleError = () => {
      setError('Erro ao carregar o vídeo. Verifique a URL ou tente novamente.')
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      markAsCompleted()
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
  }, [])

  // Atualizar progresso no banco de dados
  const updateProgress = async (currentTime, duration) => {
    if (!duration || duration === 0) return

    const progressPercent = Math.round((currentTime / duration) * 100)
    
    // Só atualizar se houve mudança significativa (a cada 5%)
    if (Math.abs(progressPercent - (enrollment.progress || 0)) >= 5) {
      try {
        await supabase
          .from('enrollments')
          .update({ 
            progress: progressPercent,
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id)
      } catch (error) {
        console.error('Erro ao atualizar progresso:', error)
      }
    }
  }

  // Marcar como concluído quando chegar ao final
  const markAsCompleted = async () => {
    if (enrollment.completed_at) return

    try {
      await supabase
        .from('enrollments')
        .update({ 
          progress: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id)
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error)
    }
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
    if (course.video_type === 'url' && course.video_url) {
      // Converter URLs do YouTube para embed se necessário
      if (course.video_url.includes('youtube.com/watch?v=')) {
        const videoId = course.video_url.split('v=')[1]?.split('&')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      if (course.video_url.includes('youtu.be/')) {
        const videoId = course.video_url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      return course.video_url
    }

    if (course.video_type === 'upload' && course.video_file_url) {
      // URL do arquivo no Supabase Storage
      const { data } = supabase.storage
        .from('course-files')
        .getPublicUrl(course.video_file_url)
      return data.publicUrl
    }

    return null
  }

  const videoUrl = getVideoUrl()
  const isYouTube = videoUrl?.includes('youtube.com/embed/')

  if (error) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
          <RotateCcw className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Erro ao carregar vídeo</h3>
          <p className="text-gray-300 text-center">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Play className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Vídeo não disponível</h3>
          <p className="text-gray-300">O professor ainda não adicionou o conteúdo do curso.</p>
        </div>
      </div>
    )
  }

  // Player do YouTube
  if (isYouTube) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-black">
        <iframe
          src={videoUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={course.title}
        />
      </div>
    )
  }

  // Player customizado para vídeos próprios
  return (
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

      {/* Controles do Player */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Gradiente para os controles */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Barra de progresso */}
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

        {/* Controles principais */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="hover:text-blue-400">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Skip */}
            <button onClick={() => skip(-10)} className="hover:text-blue-400">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => skip(10)} className="hover:text-blue-400">
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
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
                className="w-20 h-1 bg-white/30 rounded slider"
              />
            </div>

            {/* Tempo */}
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Velocidade */}
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

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="hover:text-blue-400">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}