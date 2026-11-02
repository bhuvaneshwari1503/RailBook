
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import SeatGrid from '../components/SeatGrid'
import { CLASS_LABEL, seatText } from '../api/labels'
import toast from 'react-hot-toast'

const emptyPassenger = () => ({
  name: '',
  age: '',
  gender: 'MALE',
})

export default function Seats() {
  const { runId, classType } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const [seats, setSeats] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coach, setCoach] = useState('')
  const [joiningWaitlist, setJoiningWaitlist] = useState(false)

  const [passengers, setPassengers] = useState([emptyPassenger()])

  useEffect(() => {
    let active = true

    const loadSeats = async () => {
      setLoading(true)
      setError('')
      setSelected([])
      setCoach('')

      try {
        const response = await api.get(`/runs/${runId}/seats`, {
          params: { classType, from, to },
        })

        if (active) {
          setSeats(response.data)
        }
      } catch {
        if (active) {
          setError('Could not load seats. Please try again.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSeats()

    return () => {
      active = false
    }
  }, [runId, classType, from, to])

  const toggleSeat = (id) => {
    setSelected((previous) => {
      if (previous.includes(id)) {
        setError('')
        return previous.filter((seatId) => seatId !== id)
      }

      if (previous.length >= 6) {
        setError('You can select a maximum of 6 seats.')
        return previous
      }

      setError('')
      return [...previous, id]
    })
  }

  const available = seats.filter(
    (s) => s.status === 'AVAILABLE'
  ).length

  const soldOut = !loading && seats.length > 0 && available === 0

  const coaches = [...new Set(seats.map((s) => s.coach).filter(Boolean))]
  const activeCoach = coaches.includes(coach) ? coach : coaches[0]
  const coachSeats = seats.filter((s) => s.coach === activeCoach)
  const chosenSeats = seats.filter((s) => selected.includes(s.id))

  const updatePassenger = (index, field, value) => {
    setPassengers((previous) =>
      previous.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger
      )
    )
  }

  const addPassenger = () => {
    if (passengers.length >= 6) return

    setPassengers((previous) => [...previous, emptyPassenger()])
    setError('')
  }

  const removePassenger = (index) => {
    if (passengers.length <= 1) return

    setPassengers((previous) =>
      previous.filter((_, i) => i !== index)
    )
    setError('')
  }

  const continueBooking = () => {
    if (selected.length === 0) {
      setError('Please select at least one seat.')
      return
    }

    const selectedSeats = chosenSeats.map((s) => ({
      id: s.id,
      seatNo: s.seatNo,
      coach: s.coach,
      berth: s.berth,
      classType: s.classType,
      fare: s.fare,
      status: s.status,
    }))

    const booking = {
      runId: Number(runId),
      classType,
      from,
      to,
      seats: selectedSeats,
      fare: selectedSeats[0]?.fare ?? 0,
    }

    sessionStorage.setItem('booking', JSON.stringify(booking))
    navigate('/passengers')
  }

  const joinWaitlist = async () => {
    const validPassengers = passengers.every((passenger) => {
      const age = Number(passenger.age)

      return (
        passenger.name.trim().length > 0 &&
        passenger.age !== '' &&
        Number.isInteger(age) &&
        age >= 1 &&
        age <= 120 &&
        ['MALE', 'FEMALE', 'OTHER'].includes(passenger.gender)
      )
    })

    if (!validPassengers) {
      setError('Enter a valid name, age (1–120), and gender for every passenger.')
      return
    }

    setJoiningWaitlist(true)
    setError('')

    try {
      const payload = {
        runId: Number(runId),
        classType,
        from,
        to,
        passengers: passengers.map((passenger) => ({
          name: passenger.name.trim(),
          age: Number(passenger.age),
          gender: passenger.gender,
        })),
      }

      const response = await api.post('/bookings/waitlist', payload)

      if (response.data?.pnr) {
        toast.success(`Joined waitlist! PNR: ${response.data.pnr}`)
      } else {
        toast.success('Successfully joined the waitlist!')
      }

      navigate('/my-bookings')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Could not join the waitlist. Please try again.'
      )
    } finally {
      setJoiningWaitlist(false)
    }
  }

  const legendItems = [
    { label: 'Available', color: 'bg-green-100 border-green-400' },
    { label: 'Selected', color: 'bg-blue-600 border-blue-700' },
    { label: 'Held', color: 'bg-yellow-100 border-yellow-300' },
    { label: 'Booked', color: 'bg-gray-300 border-gray-400' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[2px] text-[#A48648] mb-2">
          Your journey
        </p>

        <h1 className="text-3xl font-bold text-[#25313B]">
          Select Your Seats
        </h1>

        <p className="text-slate-500 mt-2">
          Choose your preferred seats before continuing with your booking.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm">
        <div className="bg-[#25313B] text-white px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D6B875] mb-1">
              Selected travel class
            </p>
            <h2 className="text-xl font-semibold">
              {CLASS_LABEL[classType] || classType}
            </h2>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-300">Maximum selection</p>
            <p className="text-lg font-semibold">6 seats</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center flex-wrap gap-7 mb-8 pb-6 border-b border-slate-200">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-5 h-5 border rounded-sm ${item.color}`} />
                <span className="text-sm text-slate-600">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading available seats...
            </div>
          ) : error && seats.length === 0 ? (
            <div className="py-12 text-center text-red-700">
              {error}
            </div>
          ) : seats.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No seats found for this class and journey.
            </div>
          ) : soldOut ? (
            <div className="py-8">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">⌛</div>

                <h3 className="text-xl font-bold text-[#25313B]">
                  All berths are booked
                </h3>

                <p className="text-slate-500 mt-2">
                  Join the waitlist for {CLASS_LABEL[classType] || classType}.
                </p>

                <p className="text-sm text-slate-400 mt-2">
                  If berths become available, your waitlist booking may be promoted automatically.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-[#25313B] mb-2">
                  Passenger details
                </h3>

                <p className="text-sm text-slate-500 mb-6">
                  Add the passengers you want to include in this waitlist booking.
                  You can add up to 6 passengers.
                </p>

                <div className="space-y-5">
                  {passengers.map((passenger, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-[#25313B]">
                          Passenger {index + 1}
                        </h4>

                        {passengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePassenger(index)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            Full name
                          </label>
                          <input
                            type="text"
                            value={passenger.name}
                            onChange={(e) =>
                              updatePassenger(index, 'name', e.target.value)
                            }
                            placeholder="Passenger name"
                            maxLength={100}
                            className="w-full border border-slate-300 px-3 py-2 outline-none focus:border-[#A48648]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            Age
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            step="1"
                            value={passenger.age}
                            onChange={(e) =>
                              updatePassenger(index, 'age', e.target.value)
                            }
                            placeholder="Age"
                            className="w-full border border-slate-300 px-3 py-2 outline-none focus:border-[#A48648]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            Gender
                          </label>
                          <select
                            value={passenger.gender}
                            onChange={(e) =>
                              updatePassenger(index, 'gender', e.target.value)
                            }
                            className="w-full border border-slate-300 px-3 py-2 outline-none focus:border-[#A48648]"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {passengers.length < 6 && (
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="mt-5 border border-[#A48648] text-[#8d703b] px-5 py-2 text-sm font-semibold hover:bg-amber-50"
                  >
                    + Add another passenger
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                {available} berths available · ₹{seats[0]?.fare ?? 0} per berth
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {coaches.map((c) => {
                  const free = seats.filter(
                    (s) => s.coach === c && s.status === 'AVAILABLE'
                  ).length

                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoach(c)}
                      className={`px-3 py-2 rounded border text-sm ${
                        c === activeCoach
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      {c}{' '}
                      <span className="text-xs opacity-70">
                        ({free} free)
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mb-5 text-center">
                <span className="inline-block border border-slate-300 rounded-t-lg px-10 py-2 text-xs uppercase tracking-widest text-slate-500">
                  {activeCoach} · Seat layout
                </span>
              </div>

              <div className="max-w-2xl mx-auto">
                <SeatGrid
                  seats={coachSeats}
                  selected={selected}
                  onToggle={toggleSeat}
                />
              </div>

              <p className="text-xs text-gray-400 mt-3">
                LB Lower · MB Middle · UB Upper · SL Side Lower · SU Side Upper
              </p>
            </>
          )}

          {error && seats.length > 0 && (
            <p className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mt-6 text-sm">
              {error}
            </p>
          )}

          <div className="mt-9 pt-6 border-t border-slate-200 flex items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Your selection
              </p>

              <p className="text-lg font-semibold text-[#25313B] mt-1">
                {soldOut ? passengers.length : selected.length}{' '}
                <span className="text-slate-400 font-normal">
                  / 6 {soldOut ? 'passengers' : 'seats'}
                </span>
              </p>

              {chosenSeats.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 break-words">
                  {chosenSeats.map((s) => seatText(s)).join(', ')}
                </p>
              )}
            </div>

            {soldOut ? (
              <button
                type="button"
                onClick={joinWaitlist}
                disabled={joiningWaitlist}
                className="shrink-0 bg-[#A48648] text-white px-8 py-3 font-semibold text-sm hover:bg-[#8d703b] transition disabled:opacity-50"
              >
                {joiningWaitlist ? 'Joining...' : 'Join Waitlist →'}
              </button>
            ) : (
              <button
                type="button"
                onClick={continueBooking}
                disabled={loading || selected.length === 0}
                className="shrink-0 bg-[#25313B] text-white px-8 py-3 font-semibold text-sm hover:bg-[#344451] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Passengers →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


