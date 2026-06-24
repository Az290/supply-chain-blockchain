import { useEffect, useState } from 'react'
import { getActivityLogs } from '../api/logs'

const actionColors = {
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-red-100 text-red-600',
  REGISTER: 'bg-green-100 text-green-700',
  CREATE: 'bg-teal-100 text-teal-700',
  UPDATE: 'bg-orange-100 text-orange-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    getActivityLogs()
      .then(res => setLogs(res.data || []))
      .catch(() => setError('Không tải được activity logs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = logs.filter(l =>
    (!search ||
      l.user_id?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())) &&
    (!actionFilter || l.action === actionFilter)
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Activity Logs</h2>
          <p className="text-sm text-gray-400 mt-0.5">{logs.length} hoạt động được ghi nhận</p>
        </div>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ↻ Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm theo mã người dùng, chi tiết..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-gray-600"
        >
          <option value="">Tất cả hành động</option>
          {Object.keys(actionColors).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Không có log nào</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Người dùng</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Hành động</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Loại</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Chi tiết</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {log.created_at?.substring(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{log.user_id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.resource_type}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.details || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
