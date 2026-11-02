
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Search as SearchIcon,
  SlidersHorizontal,
} from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../api/axios'
import TrainCard from '../components/TrainCard'
import { CLASS_LABEL } from '../api/labels'

const today = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

const getMaxDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 6)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

const popularRoutes = [
  { from: 'MAS', to: 'SBC', label: 'Chennai → Bengaluru' },
  { from: 'MAS', to: 'AJJ', label: 'Chennai → Arakkonam' },
  { from: 'SBC', to: 'MAS', label: 'Bengaluru → Chennai' },
]

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="space-y-3 w-1/3">
          <div className="h-5 bg-slate-200 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-20 bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function Search() {
  const [stations, setStations] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState(today())
  const [trains, setTrains] = useState(null)
  const [loading, setLoading] = useState(false)

  const [selectedClass, setSelectedClass] = useState('ALL')
  const [selectedTime, setSelectedTime] = useState('ALL')
  const [sortBy, setSortBy] = useState('departure')

  useEffect(() => {
    api.get('/stations')
      .then((res) => setStations(res.data))
      .catch(() => toast.error('Could not load stations'))
  }, [])

  const handleSearch = async (e) => {
    e?.preventDefault()

    if (!from || !to) {
      toast.error('Please select both stations')
      return
    }

    if (from === to) {
      toast.error('Source and destination must be different')
      return
    }

    setLoading(true)
    setTrains(null)
    setSelectedClass('ALL')
    setSelectedTime('ALL')

    try {
      const res = await api.get('/trains/search', {
        params: { from, to, date },
      })
      setTrains(res.data)
    } catch {
      toast.error('Search failed. Please try again')
    } finally {
      setLoading(false)
    }
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  const choosePopularRoute = (route) => {
    setFrom(route.from)
    setTo(route.to)
  }

  const filteredTrains = useMemo(() => {
    if (!trains) return []

    let result = trains.filter((train) => {
      const departureHour = Number(train.departureTime.slice(0, 2))

      const matchesTime =
        selectedTime === 'ALL' ||
        (selectedTime === 'MORNING' && departureHour >= 5 && departureHour < 12) ||
        (selectedTime === 'AFTERNOON' && departureHour >= 12 && departureHour < 17) ||
        (selectedTime === 'EVENING' && departureHour >= 17 && departureHour < 21) ||
        (selectedTime === 'NIGHT' && (departureHour >= 21 || departureHour < 5))

      const matchesClass =
  selectedClass === 'ALL' ||
  train.classes.some(
    (c) => c.classType === selectedClass
  )

      return matchesTime && matchesClass
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'duration') {
        return a.durationMinutes - b.durationMinutes
      }

      if (sortBy === 'fare') {
        const getFare = (train) =>
          Math.min(
            ...train.classes
              .filter((c) => c.available > 0)
              .map((c) => Number(c.fare))
              .concat([Infinity])
          )

        return getFare(a) - getFare(b)
      }

      return a.departureTime.localeCompare(b.departureTime)
    })

    return result
  }, [trains, selectedClass, selectedTime, sortBy])

  const inputClass =
    'w-full border border-slate-200 rounded-lg px-4 py-3 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500'

  return (
    <div className="w-full pb-12">
      {/* Hero and search */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-lg">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1800&q=85"
            alt="Passenger train travelling through the countryside"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/75 to-slate-900/20" />
        </div>

        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16">
          <p className="text-orange-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Welcome to RailBook
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight max-w-xl">
            Every journey starts with a search.
          </h1>

          <p className="mt-4 text-slate-200 max-w-lg text-sm sm:text-base">
            Find your train, choose your seat and book your next journey with ease.
          </p>
        </div>
      </section>

      {/* Search form */}
      <section className="relative bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-7 -mt-5 mx-2 sm:mx-5">
        <div className="mb-6">
          <p className="text-orange-600 text-xs font-bold uppercase tracking-widest">
            Plan your journey
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Search trains
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Select your route and preferred travel date.
          </p>
        </div>

        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                From
              </label>
              <select
                required
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
              >
                <option value="">Select departure station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swap}
              title="Swap stations"
              className="hidden lg:flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition"
            >
              <ArrowLeftRight size={19} />
            </button>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                To
              </label>
              <select
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputClass}
              >
                <option value="">Select destination station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Journey date
              </label>
              <input
                type="date"
                required
                value={date}
                min={today()}
                max={getMaxDate()}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 flex items-center justify-center gap-2 rounded-lg bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition disabled:opacity-50"
            >
              <SearchIcon size={17} />
              {loading ? 'Searching...' : 'Search trains'}
            </button>
          </div>

          <div className="lg:hidden mt-3">
            <button
              type="button"
              onClick={swap}
              className="text-sm font-medium text-orange-600 flex items-center gap-2"
            >
              <ArrowLeftRight size={16} />
              Swap stations
            </button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Popular routes
          </p>
          <div className="flex flex-wrap gap-2">
            {popularRoutes.map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                type="button"
                onClick={() => choosePopularRoute(route)}
                className="px-3 py-2 rounded-full border border-slate-200 text-xs sm:text-sm text-slate-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 transition"
              >
                {route.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading skeletons */}
      {loading && (
        <section className="mt-9 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
          {[1, 2, 3].map((item) => (
            <LoadingSkeleton key={item} />
          ))}
        </section>
      )}

      {/* Results and filters */}
      {!loading && trains !== null && (
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                Available services
              </p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">
                Train results
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {filteredTrains.length} of {trains.length} trains shown
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={17} className="text-slate-500" />
              <label htmlFor="sort" className="text-sm text-slate-600">
                Sort by
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="departure">Departure</option>
                <option value="duration">Shortest duration</option>
                <option value="fare">Lowest fare</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Travel class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={inputClass}
              >
                <option value="ALL">All classes</option>
                {Object.entries(CLASS_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Departure time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className={inputClass}
              >
                <option value="ALL">Any time</option>
                <option value="MORNING">Morning (5 AM–12 PM)</option>
                <option value="AFTERNOON">Afternoon (12–5 PM)</option>
                <option value="EVENING">Evening (5–9 PM)</option>
                <option value="NIGHT">Night (9 PM–5 AM)</option>
              </select>
            </div>
          </div>

          {filteredTrains.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-xl font-semibold text-slate-800">
                No trains match these filters
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Try changing the class or departure time filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedClass('ALL')
                  setSelectedTime('ALL')
                }}
                className="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrains.map((train) => (
                <TrainCard key={train.runId} train={train} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
