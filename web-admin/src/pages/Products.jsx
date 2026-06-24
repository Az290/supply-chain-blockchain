import { useEffect, useState } from 'react'
import { getProducts, getProductHistory } from '../api/products'
 
const statusLabels = {
  CREATED: 'Khởi tạo', HARVESTED: 'Đã thu hoạch', PROCESSED: 'Đã chế biến',
  PACKAGED: 'Đã đóng gói', IN_TRANSIT: 'Đang vận chuyển', WAREHOUSED: 'Đã nhập kho',
  DISTRIBUTED: 'Đã phân phối', IN_STORE: 'Tại cửa hàng', SOLD: 'Đã bán'
}
 
const statusColors = {
  CREATED: 'bg-blue-100 text-blue-700',
  HARVESTED: 'bg-green-100 text-green-700',
  PROCESSED: 'bg-teal-100 text-teal-700',
  PACKAGED: 'bg-cyan-100 text-cyan-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  WAREHOUSED: 'bg-yellow-100 text-yellow-700',
  DISTRIBUTED: 'bg-pink-100 text-pink-700',
  IN_STORE: 'bg-orange-100 text-orange-700',
  SOLD: 'bg-red-100 text-red-700',
}
 
function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
      {statusLabels[status] || status}
    </span>
  )
}
 
function HistoryModal({ productId, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    getProductHistory(productId)
      .then(res => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [productId])
 
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Lịch sử Blockchain</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sản phẩm: {productId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Đang tải...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có lịch sử</p>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((record, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-500">
                      TX: {record.txId?.substring(0, 24)}...
                    </span>
                    <span className="text-xs text-gray-400">
                      {record.timestamp?.substring(0, 19).replace('T', ' ')}
                    </span>
                  </div>
                  {record.product && (
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={record.product.currentStatus} />
                      <span className="text-xs text-gray-500">
                        Chủ sở hữu: {record.product.currentOwner}
                      </span>
                    </div>
                  )}
                  {record.isDelete && (
                    <span className="text-xs font-medium text-red-500">ĐÃ XÓA</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
 
export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [historyProductId, setHistoryProductId] = useState(null)
 
  const load = () => {
    setLoading(true)
    setError('')
    getProducts()
      .then(res => setProducts(res.data || []))
      .catch(() => setError('Không tải được sản phẩm'))
      .finally(() => setLoading(false))
  }
 
  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.origin || '').toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || p.currentStatus === statusFilter)
  )
 
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} sản phẩm trên blockchain</p>
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
          placeholder="Tìm theo tên, mã, xuất xứ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-gray-600"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([k, v]) => (
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
        <div className="text-center py-16 text-gray-400 text-sm">Không có sản phẩm nào</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Mã SP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tên</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Xuất xứ</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Chủ sở hữu</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Số lượng</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.origin}</td>
                    <td className="px-4 py-3 text-gray-600">{p.currentOwner}</td>
                    <td className="px-4 py-3 text-gray-600">{p.quantity} {p.unit}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.currentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setHistoryProductId(p.id)}
                        className="text-xs px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Lịch sử
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* History Modal */}
      {historyProductId && (
        <HistoryModal
          productId={historyProductId}
          onClose={() => setHistoryProductId(null)}
        />
      )}
    </div>
  )
}
