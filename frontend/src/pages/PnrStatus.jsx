
import { useState } from 'react'
import { Search, ArrowRight, TrainFront } from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../api/axios'
import { CLASS_LABEL, BERTH_LABEL } from '../api/labels'

const BADGE = {
  CONFIRMED: 'bg-[#E5EFE7] text-[#315C43]',
  WAITLISTED: 'bg-[#F8EED8] text-[#94651C]',
  CANCELLED: 'bg-[#F5E5E3] text-[#A34840]',
  PENDING_PAYMENT: 'bg-[#F8EED8] text-[#94651C]',
}

const STATION_NAMES = {
  MAS: 'Chennai Central',
  SBC: 'Bengaluru City',
  CBE: 'Coimbatore Junction',
  MDU: 'Madurai Junction',
  TVC: 'Thiruvananthapuram Central',
  HYB: 'Hyderabad Deccan',
  NDLS: 'New Delhi',
  BCT: 'Mumbai Central',
  KPD: 'Katpadi Junction',
}

const getCityName = (code) => {
  const station = STATION_NAMES[code] || code

  return station
    .replace(' Central', '')
    .replace(' Junction', '')
    .replace(' City', '')
}

export default function PnrStatus() {
  const [pnr, setPnr] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const check = async (e) => {
    e.preventDefault()
    setError('')
    setData(null)

    if (!/^\d{10}$/.test(pnr)) {
      setError('Please enter a valid 10-digit PNR number.')
      return
    }

    setLoading(true)

    try {
      const res = await api.get(`/pnr/${pnr}`)
      setData(res.data)
    } catch (err) {
      const message = err.response?.status === 404
        ? 'No booking found for this PNR.'
        : 'Could not fetch booking status. Please try again.'

      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = data
    ? data.status === 'CONFIRMED'
      ? 'CONFIRMED'
      : data.status === 'WAITLISTED'
        ? `WAITLISTED · WL/${data.waitlistPosition}`
        : data.status.replace('_', ' ')
    : ''

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-4 sm:px-8 py-9">
      <div className="max-w-6xl mx-auto">

        {/* Page heading */}
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[2px] font-semibold text-[#A48648]">
            RailBook · Booking enquiry
          </p>

          <h1 className="text-3xl font-bold text-[#25313B] mt-1">
            PNR Status
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Check your train reservation and current booking status.
          </p>
        </div>

        {/* Search card */}
        <div className="bg-white border border-[#DEDAD0] shadow-sm p-5 sm:p-7">
          <form onSubmit={check}>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Enter your 10-digit PNR number
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={pnr}
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter PNR number"
                onChange={(e) =>
                  setPnr(e.target.value.replace(/\D/g, ''))
                }
                className="flex-1 border border-[#DAD6CC] bg-[#FCFBF8] px-4 py-3 text-sm tracking-[3px] text-[#25313B] focus:outline-none focus:border-[#A48648]"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[#25313B] text-white px-7 py-3 text-sm font-semibold hover:bg-[#344451] disabled:opacity-50 transition"
              >
                <Search size={16} />
                {loading ? 'Checking...' : 'Check PNR'}
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 bg-[#F5E5E3] text-[#A34840] px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        {/* Booking result */}
        {data && (
          <div className="mt-5 bg-white border border-[#DEDAD0] shadow-sm">

            {/* Train heading */}
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-[#F7F6F2] p-3 text-[#A48648]">
                    <TrainFront size={25} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[#25313B]">
                      {data.trainName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Train No. {data.trainNumber}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase px-3 py-2 ${
                  BADGE[data.status] || 'bg-gray-100 text-gray-700'
                }`}>
                  {statusLabel}
                </span>
              </div>

              {/* Journey route */}
              <div className="grid grid-cols-[1fr_65px_1fr] items-center gap-3 mt-8">
                <div>
                  <p className="text-2xl font-bold text-[#25313B]">
                    {getCityName(data.from)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {STATION_NAMES[data.from] || data.from}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {data.from}
                  </p>
                </div>

                <div className="text-center">
                  <ArrowRight className="mx-auto text-[#A48648]" size={23} />
                  <div className="h-px bg-[#D6C69C] mt-1" />
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-[#25313B]">
                    {getCityName(data.to)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {STATION_NAMES[data.to] || data.to}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {data.to}
                  </p>
                </div>
              </div>

              {/* Journey details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-7 pt-5 border-t border-[#EEECE6]">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Journey date
                  </p>
                  <p className="text-sm font-semibold text-[#25313B] mt-1">
                    {data.date}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Departure
                  </p>
                  <p className="text-sm font-semibold text-[#25313B] mt-1">
                    {data.departureTime?.slice(0, 5)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Class
                  </p>
                  <p className="text-sm font-semibold text-[#25313B] mt-1">
                    {CLASS_LABEL[data.classType] || data.classType}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    PNR number
                  </p>
                  <p className="text-sm font-bold tracking-wider text-[#A48648] mt-1">
                    {data.pnr}
                  </p>
                </div>
              </div>
            </div>

            {/* Passenger details */}
            <div className="border-t border-[#EAE7DF]">
              <div className="bg-[#F9F8F4] px-5 sm:px-7 py-3">
                <p className="text-xs uppercase tracking-widest font-semibold text-[#A48648]">
                  Passenger details
                </p>
              </div>

              <div className="px-5 sm:px-7 py-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#EEECE6]">
                      <th className="py-3 font-semibold">Passenger</th>
                      <th className="py-3 font-semibold">Age</th>
                      <th className="py-3 font-semibold">Seat status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.passengers.map((p, i) => (
                      <tr key={i} className="border-b last:border-0 border-[#EEECE6]">
                        <td className="py-4 font-semibold text-[#25313B]">
                          {p.name}
                        </td>

                        <td className="py-4 text-[#46515A]">
                          {p.age}
                        </td>

                        <td className="py-4 text-[#46515A]">
                          {p.coach
                            ? `CNF · ${p.coach}-${p.seatNo} · ${BERTH_LABEL[p.berth] || p.berth}`
                            : data.status === 'WAITLISTED'
                              ? `WL/${data.waitlistPosition}`
                              : data.status === 'CANCELLED'
                                ? 'Cancelled'
                                : 'Not assigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="text-[10px] text-slate-400 mt-3">
                  Passenger names are partly hidden for privacy.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
