import { useEffect, useState } from 'react'
import { getStatistics } from '../api/products'
import { getParticipants } from '../api/participants'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const statusLabels = {
  CREATED: 'Khởi tạo', HARVESTED: 'Đã thu hoạch', PROCESSED: 'Đã chế biến',
  PACKAGED: 'Đã đóng gói', IN_TRANSIT: 'Đang vận chuyển', WAREHOUSED: 'Đã nhập kho',
  DISTRIBUTED: 'Đã phân phối', IN_STORE: 'Tại cửa hàng', SOLD: 'Đã bán'
}

const statusColors = {
  CREATED: '#3B82F6', HARVESTED: '#22C55E', PROCESSED: '#F97316',
  PACKAGED: '#06B6D4', IN_TRANSIT: '#8B5CF6', WAREHOUSED: '#EAB308',
  DISTRIBUTED: '#EC4899', IN_STORE: '#F59E0B', SOLD: '#EF4444'
}

const roleLabels = {
  PRODUCER: 'Nhà sản xuất', PROCESSOR: 'Nhà chế biến',
  TRANSPORTER: 'Vận chuyển', DISTRIBUTOR: 'Phân phối',
  RETAILER: 'Bán lẻ', ADMIN: 'Quản trị'
}

// Thứ tự cố định theo quy trình chuỗi cung ứng (tránh thứ tự ngẫu nhiên từ object)
const STATUS_ORDER = ['CREATED', 'HARVESTED', 'PROCESSED', 'PACKAGED', 'IN_TRANSIT', 'WAREHOUSED', 'DISTRIBUTED', 'IN_STORE', 'SOLD']
const ROLE_ORDER = ['PRODUCER', 'PROCESSOR', 'TRANSPORTER', 'DISTRIBUTOR', 'RETAILER']

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getStatistics(), getParticipants()])
      .then(([statsRes, partRes]) => {
        setStats(statsRes.data)
        setParticipants(partRes.data || [])
      })
      .catch(() => setError('Không tải được dữ liệu. Kiểm tra kết nối backend.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Đang tải dữ liệu...
    </div>
  )

  if (error) return (
    <div className="m-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
      {error}
    </div>
  )

  const byStatus = stats?.productsByStatus || {}
  const byRole = stats?.participantsByRole || {}

  const statusChartData = {
    labels: STATUS_ORDER.map(k => statusLabels[k] || k),
    datasets: [{
      label: 'Số sản phẩm',
      data: STATUS_ORDER.map(k => byStatus[k] || 0),
      backgroundColor: STATUS_ORDER.map(k => statusColors[k]),
      borderRadius: 6,
    }]
  }

  const roleChartData = {
    labels: ROLE_ORDER.map(k => roleLabels[k] || k),
    datasets: [{
      label: 'Số thành viên',
      data: ROLE_ORDER.map(k => byRole[k] || 0),
      backgroundColor: '#3B82F6',
      borderRadius: 6,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Tổng quan hệ thống</h2>
        <p className="text-sm text-gray-400 mt-0.5">Dữ liệu realtime từ Hyperledger Fabric</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng sản phẩm"
          value={stats?.totalProducts || 0}
          sub="trên blockchain"
          color="blue"
        />
        <StatCard
          label="Tổng thành viên"
          value={stats?.totalParticipants || participants.length}
          sub="đã đăng ký"
          color="green"
        />
        <StatCard
          label="Tổng số lượng"
          value={(stats?.totalQuantity || 0).toLocaleString()}
          sub="đơn vị hàng hóa"
          color="orange"
        />
        <StatCard
          label="Tổng giá trị"
          value={(stats?.totalValue || 0).toLocaleString('vi-VN') + ' đ'}
          sub="VNĐ"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Sản phẩm theo trạng thái
          </h3>
          {Object.keys(byStatus).length > 0
            ? <Bar data={statusChartData} options={chartOptions} />
            : <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          }
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Thành viên theo vai trò
          </h3>
          {Object.keys(byRole).length > 0
            ? <Bar data={roleChartData} options={chartOptions} />
            : <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          }
        </div>
      </div>
    </div>
  )
}
