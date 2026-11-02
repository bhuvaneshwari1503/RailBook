
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  LayoutDashboard,
  Ticket,
  TrainFront,
  Users,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import api from '../api/axios'
import { CLASS_LABEL } from '../api/labels'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const today = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

const BADGE = {
  CONFIRMED: 'bg-green-50 text-green-700 ring-green-200',
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 ring-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
  WAITLISTED: 'bg-orange-50 text-orange-700 ring-orange-200',
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
  { id: 'occupancy', label: 'Occupancy', icon: TrainFront },
]

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
          {eyebrow}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 mt-2">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

function Panel({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

function Card({
  label,
  value,
  icon: Icon,
  accent = 'text-slate-800',
  iconStyle = 'bg-slate-100 text-slate-600',
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyle}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold mt-4 ${accent}`}>
        {value ?? 0}
      </p>
    </div>
  )
}

function Loading({ label = 'Loading data...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
      <RefreshCw size={17} className="animate-spin text-orange-500" />
      {label}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
        <TrainFront size={22} />
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  )
}

function Overview() {
  const [s, setS] = useState(null)

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setS(r.data))
      .catch(() => toast.error('Could not load stats'))
  }, [])

  if (!s) return <Loading label="Loading dashboard statistics..." />

  const chart = s.daily.map((d) => ({
    day: d.date.slice(5),
    amount: Number(d.amount),
  }))

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card label="Total bookings" value={s.totalBookings} icon={Ticket} iconStyle="bg-blue-50 text-blue-700" />
        <Card label="Confirmed bookings" value={s.confirmed} icon={Ticket} accent="text-green-700" iconStyle="bg-green-50 text-green-700" />
        <Card label="Cancelled bookings" value={s.cancelled} icon={RefreshCw} accent="text-red-600" iconStyle="bg-red-50 text-red-600" />
        <Card label="Waitlisted bookings" value={s.waitlisted} icon={Users} accent="text-amber-600" iconStyle="bg-amber-50 text-amber-600" />
        <Card label="Registered users" value={s.totalUsers} icon={Users} iconStyle="bg-indigo-50 text-indigo-700" />
        <Card label="Total revenue" value={inr(s.revenue)} icon={IndianRupee} accent="text-blue-700" iconStyle="bg-blue-50 text-blue-700" />
        <Card label="Total refunds" value={inr(s.refunds)} icon={RefreshCw} accent="text-red-600" iconStyle="bg-red-50 text-red-600" />
        <Card label="Net revenue" value={inr(s.netRevenue)} icon={TrendingUp} accent="text-green-700" iconStyle="bg-green-50 text-green-700" />
      </div>

      <Panel>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Revenue analytics
          </p>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            Revenue over the last 7 days
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Daily booking revenue performance
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }} />
              <Bar dataKey="amount" name="Revenue" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Performance
          </p>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            Top trains by revenue
          </h3>
        </div>

        {s.topTrains.length === 0 ? (
          <EmptyState message="No confirmed bookings yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold">Train</th>
                  <th className="py-3 pr-4 font-semibold">Bookings</th>
                  <th className="py-3 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {s.topTrains.map((t) => (
                  <tr key={t.trainNumber} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-800">{t.trainName}</p>
                      <p className="text-xs text-slate-400 mt-1">#{t.trainNumber}</p>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{t.bookings}</td>
                    <td className="py-4 text-right font-bold text-green-700">{inr(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Bookings() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [text, setText] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api.get('/admin/bookings', {
      params: { page, status, q, size: 10 },
    })
      .then((r) => setData(r.data))
      .catch(() => toast.error('Could not load bookings'))
  }, [page, status, q])

  const search = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(text)
  }

  const inputClass = 'w-full border border-slate-200 rounded-lg px-4 py-3 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500'

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Booking management"
        title="All bookings"
        description="Search and review customer train reservations."
      />

      <Panel>
        <form onSubmit={search} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 mb-5">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search PNR, name or email"
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            className={inputClass}
          >
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition">
            <Search size={16} />
            Search
          </button>
        </form>

        {!data ? (
          <Loading label="Loading bookings..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No bookings found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold">PNR</th>
                  <th className="pr-4 font-semibold">Customer</th>
                  <th className="pr-4 font-semibold">Train</th>
                  <th className="pr-4 font-semibold">Journey</th>
                  <th className="pr-4 font-semibold">Class</th>
                  <th className="pr-4 font-semibold">Fare</th>
                  <th className="font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="py-4 pr-4 font-bold text-blue-800">{b.pnr}</td>
                    <td className="pr-4">
                      <p className="font-medium text-slate-800">{b.userName}</p>
                      <p className="text-xs text-slate-400 mt-1">{b.userEmail}</p>
                    </td>
                    <td className="pr-4">
                      <p className="font-medium text-slate-800">{b.trainName}</p>
                      <p className="text-xs text-slate-400 mt-1">#{b.trainNumber}</p>
                    </td>
                    <td className="pr-4">
                      <p className="font-medium text-slate-700">{b.from} → {b.to}</p>
                      <p className="text-xs text-slate-400 mt-1">{b.date}</p>
                    </td>
                    <td className="pr-4 text-slate-600">{CLASS_LABEL[b.classType] || b.classType}</td>
                    <td className="pr-4 font-semibold text-slate-800">{inr(b.totalFare)}</td>
                    <td>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${BADGE[b.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                        {b.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 text-sm">
            <span className="text-slate-500">{data.totalElements} bookings</span>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-orange-50 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="text-slate-600">
                Page {data.totalPages === 0 ? 0 : page + 1} of {data.totalPages}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-orange-50 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Occupancy() {
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState(null)

  useEffect(() => {
    api.get('/admin/occupancy', { params: { date } })
      .then((r) => setRows(r.data))
      .catch(() => toast.error('Could not load occupancy'))
  }, [date])

  const trains = []
  const index = {}

  ;(rows || []).forEach((r) => {
    if (!(r.trainNumber in index)) {
      index[r.trainNumber] = trains.length
      trains.push({
        number: r.trainNumber,
        name: r.trainName,
        classes: {},
      })
    }
    trains[index[r.trainNumber]].classes[r.classType] = r
  })

  const cell = (c) => {
    if (!c) return <span className="text-slate-300">—</span>

    const used = c.booked + c.held
    const pct = c.total > 0 ? Math.round((used / c.total) * 100) : 0
    const bar = pct >= 90
      ? 'bg-red-500'
      : pct >= 60
        ? 'bg-amber-500'
        : 'bg-green-500'

    return (
      <div className="min-w-[115px]">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          <span className="font-semibold text-slate-700">{used}/{c.total}</span>
          {' · '}{pct}%
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Seat availability"
        title="Train occupancy"
        description="Review booked and held seats across travel classes."
        action={
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
            <CalendarDays size={17} className="text-orange-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm text-slate-700 bg-transparent outline-none"
            />
          </div>
        }
      />

      <Panel>
        {!rows ? (
          <Loading label="Loading occupancy..." />
        ) : trains.length === 0 ? (
          <EmptyState message="No train runs on this date." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-5 font-semibold">Train</th>
                  {Object.keys(CLASS_LABEL).map((c) => (
                    <th key={c} className="pr-5 pb-3 font-semibold">
                      {CLASS_LABEL[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trains.map((t) => (
                  <tr key={t.number} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-4 pr-5">
                      <p className="font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-1">#{t.number}</p>
                    </td>
                    {Object.keys(CLASS_LABEL).map((c) => (
                      <td key={c} className="pr-5 py-4">
                        {cell(t.classes[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Below 60%
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          60–89%
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          90% and above
        </span>
      </div>
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="w-full pb-12">
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-lg mb-8">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1800&q=85"
            alt="Railway journey"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-900/30" />
        </div>

        <div className="relative z-10 px-6 py-9 sm:px-9 sm:py-11">
          <p className="text-orange-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            RailBook administration
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-3 max-w-xl">
            Manage bookings, monitor train occupancy and keep track of your railway operations.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mb-7 border-b border-slate-200 pb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              tab === id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'bookings' && <Bookings />}
      {tab === 'occupancy' && <Occupancy />}
    </div>
  )
}

