import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api/axios'

const METHODS = [
  { id: 'UPI', title: 'UPI Payment', subtitle: 'Google Pay, PhonePe, etc.', icon: '◈' },
  { id: 'CARD', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, etc.', icon: '▤' },
  { id: 'OTHER', title: 'Other Options', subtitle: 'Wallets and net banking', icon: '▣' },
]

const OTHER_OPTIONS = [
  { id: 'RAZORPAY', label: 'Razorpay' },
  { id: 'NETBANKING', label: 'Net banking' },
  { id: 'PAYTM', label: 'Paytm wallet' },
  { id: 'PHONEPE', label: 'PhonePe wallet' },
]

const field =
  'w-full border border-[#DCD9D0] bg-white px-4 py-3 text-sm text-[#25313B] outline-none transition focus:border-[#A48648] focus:ring-1 focus:ring-[#D6B875]'

export default function PaymentOptions() {
  const navigate = useNavigate()

  const [booking] = useState(() => {
    const saved = sessionStorage.getItem('pendingBooking')
    return saved ? JSON.parse(saved) : null
  })

  const [method, setMethod] = useState('UPI')
  const [stage, setStage] = useState('form')
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)

  const [upiId, setUpiId] = useState('')
  const [scanned, setScanned] = useState(false)

  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  })

  const [other, setOther] = useState('')

  if (!booking) return <Navigate to="/" replace />

  const upiLink = `upi://pay?pa=railbook@upi&pn=RailBook&am=${booking.totalFare}&cu=INR&tn=PNR${booking.pnr}`

  const setCardField = (key, value) =>
    setCard((prev) => ({ ...prev, [key]: value }))

  const formatNumber = (value) =>
    value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    return digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits
  }

  const validate = () => {
    if (method === 'UPI') {
      const validId = /^[\w.-]{2,}@[A-Za-z]{2,}$/.test(upiId.trim())

      if (!validId && !scanned) {
        return 'Enter a valid UPI ID or confirm that you have scanned the QR code.'
      }
    }

    if (method === 'CARD') {
      if (card.number.replace(/\s/g, '').length !== 16) {
        return 'Card number must contain 16 digits.'
      }

      if (!/^[A-Za-z ]{3,}$/.test(card.name.trim())) {
        return 'Enter a valid cardholder name.'
      }

      const match = card.expiry.match(/^(\d{2})\/(\d{2})$/)

      if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) {
        return 'Expiry must be in MM/YY format.'
      }

      const now = new Date()
      const expiryDate = new Date(
        2000 + Number(match[2]),
        Number(match[1]),
        0,
        23,
        59
      )

      if (expiryDate < now) return 'Card has expired.'
      if (!/^\d{3}$/.test(card.cvv)) return 'CVV must contain 3 digits.'
    }

    if (method === 'OTHER' && !other) {
      return 'Select a payment option.'
    }

    return ''
  }

  const handleConfirm = async () => {
    const message = validate()

    if (message) {
      setError(message)
      return
    }

    setError('')
    setStage('processing')

    try {
      const res = await api.post('/payments/simulate', {
        bookingId: booking.id,
      })

      sessionStorage.setItem(
        'confirmedBooking',
        JSON.stringify(res.data)
      )

      sessionStorage.setItem('paymentMethod', method)
      sessionStorage.removeItem('pendingBooking')

      setStage('success')
      setTimeout(() => navigate('/payment-success'), 1800)
    } catch (err) {
      setStage('form')

      if (err.response?.status === 410) {
        setExpired(true)
        setError('Your seat hold expired. Please book again.')
      } else {
        setError(
          err.response?.data?.message ||
          'Payment failed. Please try again.'
        )
      }
    }
  }

  // Processing screen
  if (stage === 'processing') {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-8 py-16">
        <div className="max-w-lg mx-auto bg-white border border-[#E2DED4] p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto border-[5px] border-[#EAE5D8] border-t-[#A48648] rounded-full animate-spin" />

          <h2 className="text-2xl font-bold text-[#25313B] mt-7">
            Processing payment
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Please wait while we confirm your booking.
          </p>

          <p className="text-xs text-slate-400 mt-6">
            Please do not refresh or close this page.
          </p>
        </div>
      </main>
    )
  }

  // Success screen
  if (stage === 'success') {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-8 py-16">
        <div className="max-w-lg mx-auto bg-white border border-[#E2DED4] p-12 text-center shadow-sm">
          <svg viewBox="0 0 52 52" className="w-24 h-24 mx-auto">
            <circle
              className="tick-circle"
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="#A48648"
              strokeWidth="3"
            />
            <path
              className="tick-check"
              fill="none"
              stroke="#A48648"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27 l8 8 l16-17"
            />
          </svg>

          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#A48648] mt-5">
            RailBook
          </p>

          <h2 className="text-2xl font-bold text-[#25313B] mt-2">
            Payment received
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Your payment has been processed. Confirming your ticket...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F7F6F2] px-8 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Page heading */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#A48648] mb-1">
              RailBook · Secure checkout
            </p>

            <h1 className="text-3xl font-bold text-[#25313B]">
              Choose Payment Method
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Select how you would like to complete your booking.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/payment')}
            className="text-sm font-semibold text-[#806632] hover:text-[#25313B] transition"
          >
            ← Back to booking
          </button>
        </div>

        {/* Booking strip */}
        <div className="bg-[#25313B] text-white px-7 py-5 flex items-center justify-between gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D6B875]">
              Booking payment
            </p>

            <h2 className="text-lg font-semibold mt-1">
              {booking.trainName}
            </h2>

            <p className="text-sm text-slate-300 mt-1">
              PNR: {booking.pnr}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-slate-300">
              Amount payable
            </p>
            <p className="text-3xl font-bold text-[#D6B875] mt-1">
              ₹{booking.totalFare}
            </p>
          </div>
        </div>

        {/* Payment area */}
        <div className="bg-white border border-[#E2DED4] shadow-sm grid grid-cols-[280px_1fr]">

          {/* Method selector */}
          <aside className="bg-[#FBFAF7] border-r border-[#E2DED4] p-5">
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-4">
              Payment options
            </p>

            <div className="space-y-2">
              {METHODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMethod(item.id)
                    setError('')
                  }}
                  className={`w-full text-left p-4 border transition ${
                    method === item.id
                      ? 'border-[#B99A5B] bg-[#F4F0E5]'
                      : 'border-transparent hover:bg-white hover:border-[#E2DED4]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl text-[#A48648]">
                      {item.icon}
                    </span>

                    <div>
                      <p className={`text-sm font-semibold ${
                        method === item.id
                          ? 'text-[#25313B]'
                          : 'text-slate-700'
                      }`}>
                        {item.title}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-7 pt-5 border-t border-[#E2DED4]">
              <p className="text-xs text-slate-500 leading-relaxed">
                This is a simulated payment experience for the RailBook project.
                No actual payment will be collected.
              </p>
            </div>
          </aside>

          {/* Selected method content */}
          <section className="p-8">

            {method === 'UPI' && (
              <div>
                <h2 className="text-xl font-bold text-[#25313B]">
                  Pay using UPI
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Scan the QR code or enter your UPI ID.
                </p>

                <div className="flex items-center gap-10 mt-7">
                  <div className="shrink-0 text-center">
                    <div className="inline-block border border-[#E2DED4] p-4 bg-white">
                      <QRCodeSVG value={upiLink} size={165} />
                    </div>

                    <p className="text-xs font-semibold text-[#25313B] mt-3">
                      RailBook demo QR
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Demo only · No real transfer
                    </p>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-3">
                      Enter UPI details
                    </p>

                    <input
                      type="text"
                      placeholder="Enter UPI ID (name@okaxis)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className={field}
                    />

                    <p className="text-xs text-slate-400 mt-2">
                      Example: yourname@bank
                    </p>

                    <div className="border-t border-[#EAE7DF] mt-5 pt-4">
                      <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scanned}
                          onChange={(e) => setScanned(e.target.checked)}
                          className="accent-[#A48648] w-4 h-4"
                        />
                        I have scanned the demo QR code
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {method === 'CARD' && (
              <div className="max-w-xl">
                <h2 className="text-xl font-bold text-[#25313B]">
                  Card details
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter sample details to test the payment flow.
                </p>

                <div className="mt-7 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Card number
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) =>
                        setCardField('number', formatNumber(e.target.value))
                      }
                      className={field}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Cardholder name
                    </label>

                    <input
                      type="text"
                      placeholder="Name on card"
                      value={card.name}
                      onChange={(e) => setCardField('name', e.target.value)}
                      className={field}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        Expiry date
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(e) =>
                          setCardField('expiry', formatExpiry(e.target.value))
                        }
                        className={field}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        CVV
                      </label>

                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="123"
                        maxLength={3}
                        value={card.cvv}
                        onChange={(e) =>
                          setCardField('cvv', e.target.value.replace(/\D/g, ''))
                        }
                        className={field}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Demo only. Do not enter real card details. These fields are
                    not sent to the backend or stored.
                  </p>
                </div>
              </div>
            )}

            {method === 'OTHER' && (
              <div>
                <h2 className="text-xl font-bold text-[#25313B]">
                  Other payment options
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Choose one of the available demo payment methods.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-7">
                  {OTHER_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 border p-5 cursor-pointer transition ${
                        other === option.id
                          ? 'border-[#B99A5B] bg-[#F4F0E5]'
                          : 'border-[#E2DED4] hover:bg-[#FBFAF7]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="other"
                        checked={other === option.id}
                        onChange={() => setOther(option.id)}
                        className="accent-[#A48648]"
                      />

                      <span className="text-sm font-semibold text-[#25313B]">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mt-7 text-sm">
                {error}
              </div>
            )}

            <div className="border-t border-[#EAE7DF] mt-8 pt-6 flex items-center justify-between gap-5">
              <div>
                <p className="text-xs text-slate-500">
                  Amount to be paid
                </p>

                <p className="text-xl font-bold text-[#25313B] mt-1">
                  ₹{booking.totalFare}
                </p>
              </div>

              {expired ? (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('pendingBooking')
                    navigate('/')
                  }}
                  className="bg-[#25313B] text-white px-8 py-3 text-sm font-semibold hover:bg-[#344451] transition"
                >
                  Search trains again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="bg-[#D6B875] text-[#25313B] px-9 py-3 text-sm font-bold hover:bg-[#E4CB91] transition"
                >
                  Confirm payment · ₹{booking.totalFare}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 text-right mt-3">
              Simulated payment · No real money is charged
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}