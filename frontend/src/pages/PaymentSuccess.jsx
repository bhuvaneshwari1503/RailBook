
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const METHOD_LABEL = {
  UPI: 'Google Pay / UPI',
  CARD: 'Credit or debit card',
  OTHER: 'Other payment option',
}

const getSeatLabel = (p) => {
  const seatName = p.coach
    ? `${p.coach}-${p.seatNo}`
    : p.seatNo

  return p.berth
    ? `${seatName} (${p.berth})`
    : seatName
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
}

const getCityName = (code) => {
  const station = STATION_NAMES[code] || code
  return station.replace(' Central', '').replace(' Junction', '').replace(' City', '')
}

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const saved = sessionStorage.getItem('confirmedBooking')
  const booking = saved ? JSON.parse(saved) : null
  const method = sessionStorage.getItem('paymentMethod')

  if (!booking) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-8 py-12">
      <div className="max-w-4xl mx-auto">

        <div className="bg-[#25313B] text-white px-10 py-9 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#D6B875] text-[#D6B875] flex items-center justify-center text-3xl font-semibold">
            ✓
          </div>

          <p className="text-xs uppercase tracking-[3px] text-[#D6B875] mt-5">
            RailBook · Booking confirmed
          </p>

          <h1 className="text-3xl font-bold mt-2">
            Payment Successful!
          </h1>

          <p className="text-sm text-slate-300 mt-2">
            Your payment has been received and your train ticket is confirmed.
          </p>

          {user?.email && (
            <p className="text-xs text-slate-300 mt-3">
              A confirmation email is on its way to {user.email}.
            </p>
          )}
        </div>

        <div className="bg-white border border-[#E2DED4] shadow-sm">

          <div className="px-9 py-6 bg-[#FBFAF7] border-b border-[#E2DED4] flex items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Your booking reference
              </p>

              <p className="text-2xl font-bold tracking-widest text-[#25313B] mt-2">
                {booking.pnr}
              </p>
            </div>

            <span className="bg-[#E8F0E9] text-[#315C43] px-4 py-2 text-xs font-bold uppercase tracking-wider">
              Confirmed
            </span>
          </div>

          <div className="p-9">

            <div className="flex items-start justify-between gap-5 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A48648] font-semibold">
                  Your journey
                </p>

                <h2 className="text-xl font-bold text-[#25313B] mt-2">
                  {booking.trainName}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Train No. {booking.trainNumber}
                </p>
              </div>

              <span className="bg-[#F4F0E5] text-[#806632] px-3 py-2 text-xs font-semibold">
                {booking.classType}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 py-7 border-y border-[#EAE7DF]">
              <div>
                <h3 className="text-2xl font-bold text-[#25313B]">
                  {getCityName(booking.from)}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {STATION_NAMES[booking.from] || booking.from}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#A48648]">
                <span className="w-8 h-px bg-[#C9B783]" />
                <span className="text-xl">→</span>
                <span className="w-8 h-px bg-[#C9B783]" />
              </div>

              <div className="text-right">
                <h3 className="text-2xl font-bold text-[#25313B]">
                  {getCityName(booking.to)}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {STATION_NAMES[booking.to] || booking.to}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 py-6 border-b border-[#EAE7DF]">
              <div>
                <p className="text-xs text-slate-500">Journey date</p>
                <p className="font-semibold text-[#25313B] mt-2">
                  {booking.date}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Payment method</p>
                <p className="font-semibold text-[#25313B] mt-2">
                  {METHOD_LABEL[method] || 'Simulated payment'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Amount paid</p>
                <p className="text-xl font-bold text-[#25313B] mt-1">
                  ₹{booking.totalFare}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-sm font-bold text-[#25313B] mb-3">
                Confirmed passengers
              </h3>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[#EAE7DF]">
                    <th className="py-3 font-medium">Name</th>
                    <th className="py-3 font-medium">Age</th>
                    <th className="py-3 font-medium">Gender</th>
                    <th className="py-3 font-medium text-right">Seat</th>
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
                        {getSeatLabel(p)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-9 py-6 bg-[#FBFAF7] border-t border-[#E2DED4] flex items-center justify-between gap-5">
            <p className="text-xs text-slate-500">
              Keep your PNR handy for your journey.
            </p>

            <button
              onClick={() => navigate('/ticket')}
              className="bg-[#D6B875] text-[#25313B] px-8 py-3 text-sm font-bold hover:bg-[#E4CB91] transition"
            >
              View E-ticket →
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}


