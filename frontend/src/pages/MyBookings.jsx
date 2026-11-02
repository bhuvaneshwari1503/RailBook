
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import api from '../api/axios'
import { CLASS_LABEL, seatText } from '../api/labels'

const BADGE = {
  CONFIRMED: 'bg-[#E5EFE7] text-[#315C43]',
  PENDING_PAYMENT: 'bg-[#F8EED8] text-[#94651C]',
  WAITLISTED: 'bg-[#F8EED8] text-[#94651C]',
  CANCELLED: 'bg-[#F5E5E3] text-[#A34840]',
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

export default function MyBookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    let active = true

    api.get('/bookings/my')
      .then((res) => {
        if (active) {
          setBookings(res.data)
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Could not load bookings')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const load = async () => {
    try {
      const res = await api.get('/bookings/my')
      setBookings(res.data)
      return true
    } catch {
      toast.error('Could not refresh bookings')
      return false
    }
  }

  const viewTicket = (b) => {
    sessionStorage.setItem('confirmedBooking', JSON.stringify(b))
    navigate('/ticket')
  }

  const cancel = async (b) => {
    const text = b.status === 'CONFIRMED'
      ? `Cancel booking ${b.pnr}? A refund will be calculated based on the time left before departure.`
      : `Cancel booking ${b.pnr}?`

    if (!window.confirm(text)) return

    setCancellingId(b.id)

    try {
      const res = await api.put(`/bookings/${b.id}/cancel`)
      const refund = Number(res.data.refundAmount || 0)

      toast.success(
        refund > 0
          ? `Booking ${b.pnr} cancelled. Refund of ₹${refund} will be credited to your original payment method.`
          : `Booking ${b.pnr} cancelled.`
      )

      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-8 py-12">
        <div className="max-w-6xl mx-auto text-sm text-[#69737B]">
          Loading your bookings...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-4 sm:px-8 py-9">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[2px] font-semibold text-[#A48648]">
              RailBook · Travel account
            </p>

            <h1 className="text-3xl font-bold text-[#25313B] mt-1">
              My Bookings
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              View and manage your train reservations.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="bg-[#25313B] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#344451] transition"
          >
            + Book a train
          </button>
        </div>

        {bookings.length === 0 && (
          <div className="bg-white border border-[#E1DED5] p-12 text-center">
            <p className="text-lg font-semibold text-[#25313B]">
              No bookings yet
            </p>

            <p className="text-sm text-slate-500 mt-2">
              Your train reservations will appear here after booking.
            </p>

            <button
              onClick={() => navigate('/')}
              className="mt-5 bg-[#D6B875] text-[#25313B] px-6 py-2.5 text-sm font-bold hover:bg-[#E4CB91] transition"
            >
              Search trains
            </button>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-[#DEDAD0] shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_245px]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-lg font-bold text-[#25313B]">
                      {b.trainName}
                    </h2>

                    <span className="text-xs text-slate-400">
                      #{b.trainNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_65px_1fr] sm:grid-cols-[1fr_100px_1fr] items-center gap-3 sm:gap-4">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-[#25313B]">
                        {getCityName(b.from)}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {STATION_NAMES[b.from] || b.from}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1">
                        {b.from}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="text-xl text-[#A48648]">→</div>
                      <div className="h-px bg-[#D6C69C] mt-1" />
                    </div>

                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-bold text-[#25313B]">
                        {getCityName(b.to)}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {STATION_NAMES[b.to] || b.to}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1">
                        {b.to}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-6 pt-4 border-t border-[#EEECE6]">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Journey date
                      </p>

                      <p className="text-sm font-semibold text-[#25313B] mt-1">
                        {b.date}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Class
                      </p>

                      <p className="text-sm font-semibold text-[#25313B] mt-1">
                        {CLASS_LABEL[b.classType] || b.classType}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Passengers
                      </p>

                      <p className="text-sm font-semibold text-[#25313B] mt-1">
                        {b.passengers.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F9F8F4] border-t md:border-t-0 md:border-l border-[#E5E1D7] p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        Booking status
                      </p>

                      <span
                        className={`text-[10px] font-bold uppercase px-3 py-1 ${
                          BADGE[b.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {(b.status || 'UNKNOWN').replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-5">
                      PNR number
                    </p>

                    <p className="text-xl font-bold tracking-widest text-[#A48648] mt-1">
                      {b.pnr}
                    </p>

                    <div className="mt-5 pt-4 border-t border-[#E5E1D7]">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        Total fare
                      </p>

                      <p className="text-2xl font-bold text-[#25313B] mt-1">
                        ₹{b.totalFare}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-5">
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => viewTicket(b)}
                        className="w-full bg-[#25313B] text-white py-2.5 text-xs font-semibold hover:bg-[#344451] transition"
                      >
                        View ticket
                      </button>
                    )}

                    {b.status !== 'CANCELLED' && (
                      <button
                        onClick={() => cancel(b)}
                        disabled={cancellingId === b.id}
                        className="w-full border border-[#C77A70] text-[#A34840] py-2.5 text-xs font-semibold hover:bg-[#F9EDEA] disabled:opacity-50 transition"
                      >
                        {cancellingId === b.id
                          ? 'Cancelling...'
                          : 'Cancel booking'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#FCFBF8] border-t border-[#EAE7DF] px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Passengers
                  </span>

                  {b.passengers.map((p, i) => (
                    <span key={i} className="text-xs text-[#46515A]">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-slate-400">
                        {' '}· {seatText(p)}
                      </span>
                    </span>
                  ))}
                </div>

                {b.status === 'CANCELLED' &&
                  Number(b.refundAmount) > 0 && (
                    <p className="text-xs font-semibold text-[#315C43]">
                      Refund: ₹{b.refundAmount}
                    </p>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
