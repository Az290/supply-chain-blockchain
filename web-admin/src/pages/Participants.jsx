import { useEffect, useState } from 'react'
import { getParticipants, registerParticipant, deleteParticipant } from '../api/participants'

const roleLabels = {
  PRODUCER: 'Nhà sản xuất', PROCESSOR: 'Nhà chế biến',
  TRANSPORTER: 'Vận chuyển', DISTRIBUTOR: 'Phân phối',
  RETAILER: 'Bán lẻ', ADMIN: 'Quản trị'
}

const roleColors = {
  PRODUCER: 'bg-blue-100 text-blue-700',
  PROCESSOR: 'bg-teal-100 text-teal-700',
  TRANSPORTER: 'bg-purple-100 text-purple-700',
  DISTRIBUTOR: 'bg-pink-100 text-pink-700',
  RETAILER: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-red-100 text-red-700',
}

const EMPTY_FORM = {
  id: '', name: '', role: 'PRODUCER',
  organization: '', location: '', phone: '', email: ''
}

function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerParticipant({ ...form, password: '123456' })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Thêm thành viên mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mã thành viên *</label>
              <input
                name="id"
                value={form.id}
                onChange={handleChange}
                required
                placeholder="VD: NSX002"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Tên tổ chức / cá nhân"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vai trò *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-gray-700"
              >
                {Object.entries(roleLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tổ chức *</label>
              <input
                name="organization"
                value={form.organization}
                onChange={handleChange}
                required
                placeholder="VD: Org1"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Địa điểm *</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="VD: Hà Nội"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0901234567"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="email@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            >
              {loading ? 'Đang thêm...' : 'Thêm thành viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Participants() {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    getParticipants()
      .then(res => setParticipants(res.data || []))
      .catch(() => setError('Không tải được danh sách thành viên'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])


  const handleDelete = async (participant) => {
    if (!window.confirm(`Vô hiệu hóa thành viên ${participant.name} (${participant.id})?`)) return
    setDeletingId(participant.id)
    setError('')
    try {
      await deleteParticipant(participant.id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Vô hiệu hóa thành viên thất bại')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = participants.filter(p =>
    (!search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.organization || '').toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || p.role === roleFilter)
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Quản lý thành viên</h2>
          <p className="text-sm text-gray-400 mt-0.5">{participants.length} thành viên trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ↻ Làm mới
          </button>
          <button
            onClick={() => setShowRegister(true)}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Thêm thành viên
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên, mã, tổ chức..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-gray-600"
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(roleLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
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
        <div className="text-center py-16 text-gray-400 text-sm">Không có thành viên nào</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Mã</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tên</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vai trò</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tổ chức</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Địa điểm</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Liên hệ</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Trạng thái</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[p.role] || 'bg-gray-100 text-gray-600'}`}>
                        {roleLabels[p.role] || p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.organization}</td>
                    <td className="px-4 py-3 text-gray-600">{p.location || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{p.phone || '—'}</div>
                      <div>{p.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.isActive !== false ? 'Hoạt động' : 'Đã vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id || p.isActive === false}
                        className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 disabled:text-gray-300 disabled:border-gray-100 disabled:hover:bg-white transition-colors"
                      >
                        {deletingId === p.id ? 'Đang vô hiệu hóa...' : 'Vô hiệu hóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
