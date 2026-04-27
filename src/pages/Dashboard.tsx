import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ---- Mock data ----
const monthlyData = [
  { month: 'Jan', sales: 42000, revenue: 38500, orders: 312 },
  { month: 'Feb', sales: 38000, revenue: 35200, orders: 278 },
  { month: 'Mar', sales: 55000, revenue: 51800, orders: 401 },
  { month: 'Apr', sales: 61000, revenue: 58300, orders: 445 },
  { month: 'May', sales: 49000, revenue: 46100, orders: 360 },
  { month: 'Jun', sales: 72000, revenue: 68900, orders: 524 },
  { month: 'Jul', sales: 68000, revenue: 65400, orders: 496 },
  { month: 'Aug', sales: 75000, revenue: 71200, orders: 548 },
  { month: 'Sep', sales: 63000, revenue: 59800, orders: 462 },
  { month: 'Oct', sales: 81000, revenue: 77600, orders: 591 },
  { month: 'Nov', sales: 94000, revenue: 89300, orders: 684 },
  { month: 'Dec', sales: 108000, revenue: 103100, orders: 786 },
]

const totalRevenue    = monthlyData.reduce((s, d) => s + d.revenue, 0)
const totalOrders     = monthlyData.reduce((s, d) => s + d.orders, 0)
const totalCustomers  = 3_847
const avgOrderValue   = Math.round(totalRevenue / totalOrders)

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}

// ---- Stat Card ----
interface StatCardProps {
  label: string
  value: string
  change: string
  direction: 'up' | 'down'
  iconEmoji: string
  iconClass: string
}

function StatCard({ label, value, change, direction, iconEmoji, iconClass }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{iconEmoji}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${direction}`}>
          {direction === 'up' ? '▲' : '▼'} {change} vs last year
        </div>
      </div>
    </div>
  )
}

// ---- Custom Tooltip ----
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: '0.85rem',
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 6, color: '#16213e' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
            ? formatCurrency(p.value)
            : typeof p.value === 'number' && p.name.toLowerCase().includes('sales')
            ? formatCurrency(p.value)
            : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ---- Page ----
export default function Dashboard() {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change="18.4%"
          direction="up"
          iconEmoji="💰"
          iconClass="revenue"
        />
        <StatCard
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          change="12.1%"
          direction="up"
          iconEmoji="📦"
          iconClass="orders"
        />
        <StatCard
          label="Customers"
          value={totalCustomers.toLocaleString()}
          change="8.7%"
          direction="up"
          iconEmoji="👥"
          iconClass="customers"
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          change="3.2%"
          direction="down"
          iconEmoji="🛒"
          iconClass="avg"
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Bar Chart — Monthly Sales */}
        <div className="chart-card">
          <h3>Monthly Sales</h3>
          <p className="chart-subtitle">Gross sales per month (current year)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f0f2f5' }} />
              <Legend
                wrapperStyle={{ fontSize: '0.8rem', paddingTop: 12 }}
                formatter={() => 'Sales ($)'}
              />
              <Bar dataKey="sales" name="Sales" fill="#0f3460" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart — Monthly Revenue */}
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <p className="chart-subtitle">Net revenue over the year</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '0.8rem', paddingTop: 12 }}
                formatter={() => 'Revenue ($)'}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#e94560"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#e94560', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
