'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LessonProgressButton } from './lesson-progress-button'
import { 
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  AlertCircle,
  Loader2
} from 'lucide-react'

const supabase = createClient()

export function VideoPlayerSimple({ lesson, enrollment, onProgressUpdate }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)

  useEffect(() => {
    loadVideo()
  }, [lesson.id])

  const loadVideo = async () => {
    try {
      setLoading(true)
      setError(null)

      if (lesson.video_url) {
        // URL externa (YouTube, Vimeo, etc)
        setVideoUrl(lesson.video_url)
      } else if (lesson.video_file_url) {
        // Arquivo no Supabase
        const { data } = supabase.storage
          .from('public-assets')
          .getPublicUrl(lesson.video_file_url)
        
        if (data?.publicUrl) {
          setVideoUrl(data.publicUrl)
        }
      } else {
        setError('Vídeo não encontrado')
      }
    } catch (error) {
      console.error('Error loading video:', error)
      setError('Erro ao carregar vídeo')
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  const isVimeo = videoUrl?.includes('vimeo.com')
  const isExternal = isYouTube || isVimeo

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
          <p className="text-white">Carregando vídeo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Erro ao carregar vídeo</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <h3 className="font-semibold">{lesson.title}</h3>
          </div>
          
          <LessonProgressButton
            lesson={lesson}
            enrollment={enrollment}
            onProgressUpdate={onProgressUpdate}
          />
        </div>
      </div>

      {/* Video Player */}
      <div className="relative bg-black aspect-video">
        {isExternal ? (
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => setLoading(false)}
            />
            
            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
                
                <div className="flex-1" />
                
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize className="w-6 h-6" />
                  ) : (
                    <Maximize className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}