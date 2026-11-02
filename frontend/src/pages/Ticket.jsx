
import { Navigate, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { CLASS_LABEL, seatText } from '../api/labels'

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
  return station
    .replace(' Central', '')
    .replace(' Junction', '')
    .replace(' City', '')
}

export default function Ticket() {
  const navigate = useNavigate()
  const saved = sessionStorage.getItem('confirmedBooking')
  const t = saved ? JSON.parse(saved) : null

  if (!t) return <Navigate to="/my-bookings" replace />

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#E9E8E3] px-6 py-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-5 print:hidden">
          <div>
            <p className="text-xs uppercase tracking-[2px] text-[#A48648] font-semibold">
              RailBook · E-ticket
            </p>
            <h1 className="text-2xl font-bold text-[#25313B] mt-1">
              Booking confirmed
            </h1>
          </div>
          <span className="bg-[#E0EBE2] text-[#315C43] px-4 py-2 text-xs font-bold uppercase">
            {t.status || 'Confirmed'}
          </span>
        </div>

        <div
          id="ticket"
          className="bg-white border border-[#D8D5CC] shadow-lg overflow-hidden"
        >
          <div className="grid grid-cols-[1fr_230px]">

            <section className="p-7">

              <div className="flex justify-between items-start border-b border-[#E9E5DC] pb-4">
                <div>
                  <p className="text-xs tracking-[3px] font-bold text-[#A48648]">
                    RAILBOOK
                  </p>
                  <h2 className="text-xl font-bold text-[#25313B] mt-1">
                    Electronic Travel Ticket
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Confirmed railway reservation
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    PNR Number
                  </p>
                  <p className="text-xl font-bold tracking-widest text-[#A48648] mt-1">
                    {t.pnr}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px_1fr] items-center gap-3 py-6 border-b border-[#E9E5DC]">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    From
                  </p>
                  <h2 className="text-3xl font-bold text-[#25313B] mt-1">
                    {getCityName(t.from)}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {STATION_NAMES[t.from] || t.from}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t.from}
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl text-[#A48648]">→</div>
                  <div className="h-px bg-[#C9B783] mt-1" />
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-2">
                    Journey
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    To
                  </p>
                  <h2 className="text-3xl font-bold text-[#25313B] mt-1">
                    {getCityName(t.to)}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {STATION_NAMES[t.to] || t.to}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t.to}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 py-5 border-b border-[#E9E5DC]">
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Train
                  </p>
                  <p className="text-sm font-bold text-[#25313B] mt-1">
                    {t.trainName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Train No. {t.trainNumber}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Journey date
                  </p>
                  <p className="text-sm font-bold text-[#25313B] mt-1">
                    {t.date}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Class
                  </p>
                  <p className="text-sm font-bold text-[#25313B] mt-1">
                    {CLASS_LABEL[t.classType] || t.classType}
                  </p>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#25313B]">
                    Passenger details
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {t.passengers.length} passenger(s)
                  </p>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#E9E5DC]">
                      <th className="py-2">No.</th>
                      <th className="py-2">Passenger</th>
                      <th className="py-2">Age</th>
                      <th className="py-2">Gender</th>
                      <th className="py-2 text-right">Coach / Berth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.passengers.map((p, i) => (
                      <tr key={i} className="border-b border-[#F0EEE8] last:border-0">
                        <td className="py-2 text-slate-500">{i + 1}</td>
                        <td className="py-2 font-semibold text-[#25313B]">
                          {p.name}
                        </td>
                        <td className="py-2 text-slate-600">{p.age}</td>
                        <td className="py-2 text-slate-600">{p.gender}</td>
                        <td className="py-2 text-right font-bold text-[#25313B]">
                          {seatText(p)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </section>

            <aside className="bg-[#F7F6F2] border-l border-dashed border-[#CFC9BC] p-6 flex flex-col items-center justify-between text-center">
              <div>
                <p className="text-xs font-bold tracking-[2px] text-[#A48648]">
                  RAILBOOK
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                  Boarding details
                </p>
              </div>

              <div className="my-5">
                <div className="bg-white border border-[#DEDAD0] p-3">
                  <QRCodeSVG value={t.pnr} size={125} />
                </div>
                <p className="text-[10px] font-semibold text-[#25313B] mt-2">
                  Booking QR
                </p>
                <p className="text-[9px] text-slate-400">
                  PNR reference
                </p>
              </div>

              <div className="w-full border-t border-[#DEDAD0] pt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">
                  Total fare
                </p>
                <p className="text-2xl font-bold text-[#25313B] mt-1">
                  ₹{t.totalFare}
                </p>
                <p className="text-[10px] text-[#315C43] font-bold mt-2">
                  {t.status || 'CONFIRMED'}
                </p>
              </div>

              <p className="text-[9px] text-slate-400 leading-relaxed mt-5">
                Carry a valid government-issued photo ID during your journey.
                <br /><br />
                Demo ticket · Not an official railway ticket
              </p>
            </aside>
          </div>

          <div className="bg-[#25313B] text-white px-7 py-3 flex justify-between items-center">
            <p className="text-[10px] text-slate-300">
              Thank you for booking with RailBook
            </p>
            <p className="text-[10px] tracking-[2px] text-[#D6B875] font-bold">
              RAILBOOK
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5 print:hidden">
          <button
            onClick={() => navigate('/my-bookings')}
            className="border border-[#D8D5CC] bg-white text-[#25313B] px-5 py-2.5 text-sm font-semibold hover:bg-[#FBFAF7]"
          >
            My bookings
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="border border-[#D8D5CC] bg-white text-[#25313B] px-5 py-2.5 text-sm font-semibold hover:bg-[#FBFAF7]"
            >
              Book another
            </button>

            <button
              onClick={() => window.print()}
              className="bg-[#D6B875] text-[#25313B] px-6 py-2.5 text-sm font-bold hover:bg-[#E4CB91]"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
