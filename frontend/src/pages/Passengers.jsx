
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { CLASS_LABEL, seatText } from '../api/labels'

export default function Passengers() {
  const navigate = useNavigate()
  const saved = sessionStorage.getItem('booking')
  const booking = saved ? JSON.parse(saved) : null

  const [forms, setForms] = useState(() =>
    booking ? booking.seats.map(() => ({ name: '', age: '', gender: '' })) : []
  )
  const [errors, setErrors] = useState([])
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedList, setSavedList] = useState([])

  useEffect(() => {
    api.get('/users/me/passengers')
      .then((res) => setSavedList(res.data))
      .catch(() => setSavedList([]))
  }, [])

  if (!booking) return <Navigate to="/" replace />

  const update = (i, field, value) => {
    setForms((prev) =>
      prev.map((f, idx) =>
        idx === i ? { ...f, [field]: value } : f
      )
    )
  }

  const fillSavedPassenger = (i, id) => {
    const passenger = savedList.find((p) => String(p.id) === id)
    if (!passenger) return

    setForms((prev) =>
      prev.map((f, idx) =>
        idx === i
          ? {
              name: passenger.name,
              age: String(passenger.age),
              gender: passenger.gender,
            }
          : f
      )
    )

    setErrors((prev) =>
      prev.map((e, idx) => idx === i ? {} : e)
    )
    setApiError('')
  }

  const validate = () => {
    const errs = forms.map((f) => {
      const e = {}

      if (!f.name.trim()) e.name = 'Name is required'
      else if (!/^[A-Za-z ]+$/.test(f.name.trim())) {
        e.name = 'Letters and spaces only'
      }

      const age = Number(f.age)
      if (!f.age) e.age = 'Age is required'
      else if (!Number.isInteger(age) || age < 1 || age > 120) {
        e.age = 'Age must be 1 to 120'
      }

      if (!f.gender) e.gender = 'Select gender'

      return e
    })

    setErrors(errs)
    return errs.every((e) => Object.keys(e).length === 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    setApiError('')

    if (!validate()) return

    setLoading(true)

    try {
      const res = await api.post('/bookings', {
        runId: Number(booking.runId),
        from: booking.from,
        to: booking.to,
        passengers: forms.map((f, i) => ({
          name: f.name.trim(),
          age: Number(f.age),
          gender: f.gender,
          seatId: booking.seats[i].id,
        })),
      })

      sessionStorage.setItem('pendingBooking', JSON.stringify(res.data))
      navigate('/payment', { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Booking failed. Please try again'

      setApiError(msg)

      if (err.response?.status === 409) {
        setTimeout(() => {
          navigate(
            `/seats/${booking.runId}/${booking.classType}?from=${booking.from}&to=${booking.to}`
          )
        }, 2500)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (hasError) =>
    `w-full bg-white border px-4 py-3 text-sm text-[#25313B] rounded-sm outline-none transition focus:border-[#A48648] focus:ring-1 focus:ring-[#A48648] ${
      hasError ? 'border-red-400' : 'border-[#D8D9D6]'
    }`

  const total = booking.fare * booking.seats.length

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[2px] text-[#A48648] mb-2">
          Complete your reservation
        </p>

        <h1 className="text-3xl font-bold text-[#25313B]">
          Passenger Details
        </h1>

        <p className="text-sm text-slate-500 mt-2">
          Enter the details of each passenger travelling on this journey.
        </p>
      </div>

      <div className="bg-white border border-[#E1DED5] px-7 py-5 mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { number: '01', label: 'Select seats', done: true },
            { number: '02', label: 'Passengers', active: true },
            { number: '03', label: 'Payment' },
          ].map((step, index) => (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.active
                      ? 'bg-[#D6B875] text-[#25313B]'
                      : step.done
                        ? 'bg-[#25313B] text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {step.done ? '✓' : step.number}
                </div>

                <span className={`text-sm hidden sm:block ${
                  step.active ? 'font-bold text-[#25313B]' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>

              {index !== 2 && (
                <div className="h-px bg-[#DEDAD0] flex-1 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7 items-start">
        <section className="bg-white border border-[#E1DED5] shadow-sm">
          <div className="bg-[#25313B] text-white px-7 py-5">
            <p className="text-xs uppercase tracking-widest text-[#D6B875]">
              Travellers
            </p>

            <h2 className="text-xl font-semibold mt-1">
              Passenger information
            </h2>

            <p className="text-sm text-slate-300 mt-1">
              {booking.seats.length} passenger{booking.seats.length > 1 ? 's' : ''} selected
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-7">
            {booking.seats.map((seat, i) => (
              <div
                key={seat.id}
                className="border border-[#E1DED5] mb-5 last:mb-0"
              >
                <div className="bg-[#F7F6F2] px-5 py-4 flex items-center justify-between border-b border-[#E1DED5]">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#A48648] font-semibold">
                      Passenger {String(i + 1).padStart(2, '0')}
                    </p>

                    <h3 className="font-semibold text-[#25313B] mt-1">
                      Passenger details · {seatText(seat)}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">Allocated berth</p>
                    <p className="text-lg font-bold text-[#25313B]">
                      {seatText(seat)}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  {savedList.length > 0 && (
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fill from saved passengers
                      </label>

                      <select
                        defaultValue=""
                        onChange={(e) => fillSavedPassenger(i, e.target.value)}
                        className={inputClass(false)}
                      >
                        <option value="">Choose a saved passenger</option>

                        {savedList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {p.age} · {p.gender}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1.2fr] gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Full name
                      </label>

                      <input
                        type="text"
                        placeholder="Enter passenger name"
                        value={forms[i].name}
                        onChange={(e) => update(i, 'name', e.target.value)}
                        className={inputClass(errors[i]?.name)}
                      />

                      {errors[i]?.name && (
                        <p className="text-red-600 text-xs mt-2">
                          {errors[i].name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Age
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Age"
                        value={forms[i].age}
                        onChange={(e) => update(i, 'age', e.target.value)}
                        className={inputClass(errors[i]?.age)}
                      />

                      {errors[i]?.age && (
                        <p className="text-red-600 text-xs mt-2">
                          {errors[i].age}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Gender
                      </label>

                      <select
                        value={forms[i].gender}
                        onChange={(e) => update(i, 'gender', e.target.value)}
                        className={inputClass(errors[i]?.gender)}
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>

                      {errors[i]?.gender && (
                        <p className="text-red-600 text-xs mt-2">
                          {errors[i].gender}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mt-6 text-sm">
                {apiError}
              </div>
            )}

            <div className="mt-7 pt-6 border-t border-[#E1DED5] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/seats/${booking.runId}/${booking.classType}?from=${booking.from}&to=${booking.to}`
                  )
                }
                className="text-sm font-medium text-slate-600 hover:text-[#A48648] transition"
              >
                ← Back to seats
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#25313B] text-white px-7 py-3 text-sm font-semibold hover:bg-[#344451] transition disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Proceed to payment →'}
              </button>
            </div>
          </form>
        </section>

        <aside className="bg-white border border-[#E1DED5] shadow-sm">
          <div className="bg-[#25313B] text-white px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-[#D6B875]">
              Reservation summary
            </p>
            <h2 className="text-lg font-semibold mt-1">
              Fare details
            </h2>
          </div>

          <div className="p-6">
            <div className="pb-5 border-b border-[#E1DED5]">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Travel class
              </p>
              <p className="font-semibold text-[#25313B] mt-1">
                {CLASS_LABEL[booking.classType] || booking.classType}
              </p>
            </div>

            <div className="py-5 border-b border-[#E1DED5]">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Coach and berth details
              </p>

              <div className="flex flex-wrap gap-2">
                {booking.seats.map((seat) => (
                  <span
                    key={seat.id}
                    className="bg-[#F7F6F2] border border-[#DEDAD0] px-3 py-2 text-sm font-semibold text-[#25313B]"
                  >
                    {seatText(seat)}
                  </span>
                ))}
              </div>
            </div>

            <div className="py-5 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Passengers</span>
                <span>{booking.seats.length}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Fare per passenger</span>
                <span>₹{booking.fare}</span>
              </div>
            </div>

            <div className="border-t border-[#DEDAD0] pt-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Total payable
              </p>

              <p className="text-3xl font-bold text-[#25313B] mt-2">
                ₹{total}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Final amount for all selected passengers.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
