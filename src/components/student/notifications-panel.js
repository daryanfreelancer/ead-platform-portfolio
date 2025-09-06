'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  BellRing,
  Check,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  CreditCard,
  Trash2,
  Mail
} from 'lucide-react'

export default function NotificationsPanel({ className = '' }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar contagem:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const markAsUnread = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/unread`, {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: false, read_at: null }
              : notif
          )
        )
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Erro ao marcar como não lida:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'evaluation_result':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'course_enrollment':
        return <BookOpen className="w-5 h-5 text-green-600" />
      case 'payment_success':
        return <CreditCard className="w-5 h-5 text-green-600" />
      case 'payment_failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel */}
          <Card className="absolute right-0 top-12 w-80 sm:w-96 max-h-96 overflow-y-auto z-50 p-3 sm:p-4 bg-white shadow-lg border max-w-[calc(100vw-2rem)] sm:max-w-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Notificações
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  Nenhuma notificação ainda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      notification.is_read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs sm:text-sm font-medium break-words ${
                          notification.is_read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs mt-1 break-words ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {!notification.is_read ? (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(notification.id)}
                            className="p-1.5 text-gray-400 hover:bg-gray-200 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Marcar como não lida"
                          >
                            <Mail className="w-3 h-3" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 text-red-400 hover:bg-red-100 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Deletar notificação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      +{notifications.length - 10} notificações mais antigas
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}