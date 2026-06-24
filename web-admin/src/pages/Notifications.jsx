import { useEffect, useState } from 'react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/logs'

const typeColors = {
  STATUS_UPDATE: 'bg-blue-100 text-blue-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
  SYSTEM: 'bg-gray-100 text-gray-600',
  ALERT: 'bg-red-100 text-red-600',
}

const typeLabels = {
  STATUS_UPDATE: 'Cập nhật trạng thái',
  TRANSFER: 'Chuyển giao',
  SYSTEM: 'Hệ thống',
  ALERT: 'Cảnh báo',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [marking, setMarking] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    getNotifications(onlyUnread)
      .then(res => setNotifications(res.data || []))
      .catch(() => setError('Không tải được thông báo'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [onlyUnread])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch {}
  }

  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      setError('Không thể đánh dấu tất cả đã đọc')
    } finally {
      setMarking(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{notifications.length} thông báo</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={e => setOnlyUnread(e.target.checked)}
              className="rounded"
            />
            Chỉ chưa đọc
          </label>
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ↻ Làm mới
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={marking}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            >
              {marking ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Đang tải...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {onlyUnread ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border px-5 py-4 flex items-start gap-4 transition-colors ${
                n.is_read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              {/* Dot */}
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-200' : 'bg-blue-500'}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[n.type] || 'bg-gray-100 text-gray-600'}`}>
                    {typeLabels[n.type] || n.type}
                  </span>
                  {n.related_product_id && (
                    <span className="text-xs text-gray-400 font-mono">{n.related_product_id}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                )}
              </div>

              {/* Right */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {n.created_at?.substring(0, 16).replace('T', ' ')}
                </span>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
