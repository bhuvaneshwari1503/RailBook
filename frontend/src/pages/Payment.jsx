
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { CLASS_LABEL, seatText } from '../api/labels'

const pad = (n) => String(n).padStart(2, '0')

const STATION_NAMES = {
  MAS: 'Chennai Central',
  SBC: 'Bengaluru City',
  CBE: 'Coimbatore Junction',
  MDU: 'Madurai Junction',
  TVC: 'Thiruvananthapuram Central',
  HYB: 'Hyderabad Deccan',
  NDLS: 'New Delhi',
  BCT: 'Mumbai Central',
}

const getCityName = (code) => {
  const station = STATION_NAMES[code] || code
  return station.replace(' Central', '').replace(' Junction', '').replace(' City', '')
}

export default function Payment() {
  const navigate = useNavigate()
  const saved = sessionStorage.getItem('pendingBooking')
  const booking = saved ? JSON.parse(saved) : null

  const [secondsLeft, setSecondsLeft] = useState(() =>
    booking
      ? Math.max(
          0,
          Math.floor((new Date(booking.heldUntil) - new Date()) / 1000)
        )
      : 0
  )

  useEffect(() => {
    if (!booking) return

    const timer = setInterval(() => {
      const left = Math.max(
        0,
        Math.floor((new Date(booking.heldUntil) - new Date()) / 1000)
      )

      setSecondsLeft(left)

      if (left === 0) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!booking) return <Navigate to="/" replace />

  const expired = secondsLeft === 0
  const urgent = secondsLeft <= 60

  const handlePay = () => {
    navigate('/payment-options')
  }

  const handleCancel = async () => {
    try {
      await api.put(`/bookings/${booking.id}/cancel`)
    } catch {
      // The scheduler will release expired holds.
    }

    sessionStorage.removeItem('pendingBooking')
    navigate('/')
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-6 mb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#A48648] mb-1">
              RailBook · Checkout
            </p>
            <h1 className="text-3xl font-bold text-[#25313B]">
              Review & Pay
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your seats are reserved. Complete your payment to confirm the booking.
            </p>
          </div>

          <div className={`shrink-0 text-right ${
            urgent ? 'text-red-700' : 'text-[#25313B]'
          }`}>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              {expired ? 'Reservation expired' : 'Complete payment within'}
            </p>
            <p className="text-3xl font-bold tabular-nums mt-1">
              {expired
                ? '00:00'
                : `${pad(Math.floor(secondsLeft / 60))}:${pad(secondsLeft % 60)}`}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2DED4] shadow-sm">
          <div className="grid grid-cols-[1fr_330px]">
            <section className="p-8 border-r border-[#E2DED4]">
              <div className="flex justify-between items-start gap-4 mb-7">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A48648] font-semibold">
                    Your journey
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Train No. {booking.trainNumber}
                  </p>
                </div>

                <span className="text-xs font-semibold bg-[#F4F0E5] text-[#806632] px-3 py-2">
                  {CLASS_LABEL[booking.classType] || booking.classType}
                </span>
              </div>

              <div className="flex items-center gap-6 py-5 border-y border-[#EAE7DF]">
                <div className="min-w-0 flex-1">
                  <h2 className="text-3xl font-bold text-[#25313B] leading-tight">
                    {getCityName(booking.from)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {STATION_NAMES[booking.from] || booking.from}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Departure · {booking.from}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-8 h-px bg-[#C9B783]" />
                  <span className="text-[#A48648] text-xl">→</span>
                  <span className="w-8 h-px bg-[#C9B783]" />
                </div>

                <div className="min-w-0 flex-1 text-right">
                  <h2 className="text-3xl font-bold text-[#25313B] leading-tight">
                    {getCityName(booking.to)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {STATION_NAMES[booking.to] || booking.to}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Arrival · {booking.to}
                  </p>
                </div>
              </div>

              <div className="py-4 border-b border-[#EAE7DF]">
                <p className="text-base font-semibold text-[#25313B]">
                  {booking.trainName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Train No. {booking.trainNumber}
                </p>
              </div>

              <div className="flex items-center gap-12 py-5 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Journey date</p>
                  <p className="font-semibold text-[#25313B]">{booking.date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">PNR</p>
                  <p className="font-semibold text-[#25313B]">{booking.pnr}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Passengers</p>
                  <p className="font-semibold text-[#25313B]">
                    {booking.passengers.length}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#EAE7DF] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#25313B]">
                    Passenger details
                  </h3>
                  <span className="text-xs text-slate-400">
                    {booking.passengers.length} passenger(s)
                  </span>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-[#EAE7DF]">
                      <th className="font-medium py-3">Passenger</th>
                      <th className="font-medium py-3">Age</th>
                      <th className="font-medium py-3">Gender</th>
                      <th className="font-medium py-3 text-right">Coach / Berth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.passengers.map((p, i) => (
                      <tr key={i} className="border-b border-[#F0EEE8] last:border-0">
                        <td className="py-3 font-semibold text-[#25313B]">
                          {p.name}
                        </td>
                        <td className="py-3 text-slate-600">{p.age}</td>
                        <td className="py-3 text-slate-600">{p.gender}</td>
                        <td className="py-3 text-right font-semibold text-[#25313B]">
                          {seatText(p)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="bg-[#FBFAF7] p-7 flex flex-col">
              <p className="text-xs uppercase tracking-widest text-[#A48648] font-semibold">
                Fare summary
              </p>

              <h2 className="text-xl font-bold text-[#25313B] mt-1 mb-7">
                Payment details
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Travel class</span>
                  <span className="font-medium text-[#25313B] text-right">
                    {CLASS_LABEL[booking.classType] || booking.classType}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Passengers</span>
                  <span className="font-medium text-[#25313B]">
                    {booking.passengers.length}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Coach / Berths</span>
                  <span className="font-medium text-[#25313B] text-right">
                    {booking.passengers.map((p) => seatText(p)).join(', ')}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#DEDAD0] mt-7 pt-6">
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Total amount payable
                </p>
                <p className="text-3xl font-bold text-[#25313B] mt-2">
                  ₹{booking.totalFare}
                </p>
              </div>

              <div className="mt-auto pt-8 space-y-3">
                {expired ? (
                  <button
                    onClick={() => {
                      sessionStorage.removeItem('pendingBooking')
                      navigate('/')
                    }}
                    className="w-full bg-[#25313B] text-white py-3 text-sm font-semibold hover:bg-[#344451] transition"
                  >
                    Search trains again
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handlePay}
                      className="w-full bg-[#D6B875] text-[#25313B] py-3 text-sm font-bold hover:bg-[#E4CB91] transition"
                    >
                      Proceed to payment →
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full border border-[#D8D5CC] text-slate-600 py-3 text-sm font-semibold hover:bg-white transition"
                    >
                      Cancel reservation
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400 text-center mt-5">
                Simulated payment · No real money is charged
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}
