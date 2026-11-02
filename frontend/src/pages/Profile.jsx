
import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/useAuth'

export default function Profile() {
  const { updateUser } = useAuth()

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  })

  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
  })

  const [passenger, setPassenger] = useState({
    name: '',
    age: '',
    gender: '',
  })

  const [passengers, setPassengers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/users/me'),
      api.get('/users/me/passengers'),
    ])
      .then(([profileRes, passengerRes]) => {
        if (!active) return

        setProfile(profileRes.data)
        setPassengers(passengerRes.data)
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || 'Could not load profile'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const res = await api.put('/users/me', {
        name: profile.name,
        phone: profile.phone,
      })

      setProfile(res.data)
      updateUser({ name: res.data.name })
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not update profile'
      )
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      await api.put('/users/me/password', password)

      setPassword({
        currentPassword: '',
        newPassword: '',
      })

      setMessage('Password changed successfully')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not change password'
      )
    }
  }

  const savePassenger = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const data = {
      name: passenger.name.trim(),
      age: Number(passenger.age),
      gender: passenger.gender,
    }

    try {
      if (editingId) {
        await api.put(`/users/me/passengers/${editingId}`, data)
        setMessage('Passenger updated successfully')
      } else {
        await api.post('/users/me/passengers', data)
        setMessage('Passenger saved successfully')
      }

      setPassenger({
        name: '',
        age: '',
        gender: '',
      })

      setEditingId(null)

      const res = await api.get('/users/me/passengers')
      setPassengers(res.data)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not save passenger'
      )
    }
  }

  const editPassenger = (p) => {
    setPassenger({
      name: p.name,
      age: String(p.age),
      gender: p.gender,
    })

    setEditingId(p.id)
    setMessage('')
    setError('')
  }

  const deletePassenger = async (id) => {
    if (!window.confirm('Delete this saved passenger?')) return

    setError('')
    setMessage('')

    try {
      await api.delete(`/users/me/passengers/${id}`)

      setPassengers((prev) =>
        prev.filter((p) => p.id !== id)
      )

      setMessage('Passenger deleted')

      if (editingId === id) {
        setPassenger({
          name: '',
          age: '',
          gender: '',
        })
        setEditingId(null)
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not delete passenger'
      )
    }
  }

  const cancelEdit = () => {
    setPassenger({
      name: '',
      age: '',
      gender: '',
    })
    setEditingId(null)
  }

  const inputClass =
    'w-full border border-[#D8D9D6] rounded-sm px-4 py-3 text-sm outline-none focus:border-[#A48648] focus:ring-1 focus:ring-[#A48648]'

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-12">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[2px] text-[#A48648] mb-2">
          Account settings
        </p>

        <h1 className="text-3xl font-bold text-[#25313B]">
          My Profile
        </h1>

        <p className="text-sm text-slate-500 mt-2">
          Manage your personal details, password and saved passengers.
        </p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-5 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <section className="bg-white border border-[#E1DED5] p-6 mb-7">
        <h2 className="text-xl font-semibold text-[#25313B] mb-5">
          Personal information
        </h2>

        <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Full name
            </label>

            <input
              className={inputClass}
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Email
            </label>

            <input
              className={`${inputClass} bg-slate-100`}
              value={profile.email}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Phone number
            </label>

            <input
              className={inputClass}
              type="tel"
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="10-digit phone number"
              value={profile.phone || ''}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Account role
            </label>

            <input
              className={`${inputClass} bg-slate-100`}
              value={profile.role}
              disabled
            />
          </div>

          <div className="sm:col-span-2">
            <button className="bg-[#25313B] text-white px-6 py-3 text-sm font-semibold hover:bg-[#344451]">
              Save profile
            </button>
          </div>
        </form>
      </section>

      {/* Change Password */}
      <section className="bg-white border border-[#E1DED5] p-6 mb-7">
        <h2 className="text-xl font-semibold text-[#25313B] mb-5">
          Change password
        </h2>

        <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Current password
            </label>

            <input
              className={inputClass}
              type="password"
              value={password.currentPassword}
              onChange={(e) =>
                setPassword({
                  ...password,
                  currentPassword: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              New password
            </label>

            <input
              className={inputClass}
              type="password"
              minLength={6}
              value={password.newPassword}
              onChange={(e) =>
                setPassword({
                  ...password,
                  newPassword: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button className="bg-[#25313B] text-white px-6 py-3 text-sm font-semibold hover:bg-[#344451]">
              Change password
            </button>
          </div>
        </form>
      </section>

      {/* Saved Passengers */}
      <section className="bg-white border border-[#E1DED5] p-6">
        <div className="flex justify-between items-center gap-3 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-[#25313B]">
              Saved passengers
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Save up to 10 passengers for faster bookings.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {passengers.length}/10
          </span>
        </div>

        <form onSubmit={savePassenger} className="grid sm:grid-cols-3 gap-4 mb-6">
          <input
            className={inputClass}
            placeholder="Passenger name"
            value={passenger.name}
            onChange={(e) =>
              setPassenger({ ...passenger, name: e.target.value })
            }
            required
          />

          <input
            className={inputClass}
            type="number"
            min="1"
            max="120"
            placeholder="Age"
            value={passenger.age}
            onChange={(e) =>
              setPassenger({ ...passenger, age: e.target.value })
            }
            required
          />

          <select
            className={inputClass}
            value={passenger.gender}
            onChange={(e) =>
              setPassenger({ ...passenger, gender: e.target.value })
            }
            required
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <div className="sm:col-span-3 flex gap-3">
            <button
              disabled={!editingId && passengers.length >= 10}
              className="bg-[#25313B] text-white px-6 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {editingId ? 'Update passenger' : 'Save passenger'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="border border-slate-300 px-6 py-3 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {passengers.length === 0 ? (
          <p className="text-sm text-slate-500 border-t border-[#E1DED5] pt-5">
            No saved passengers yet.
          </p>
        ) : (
          <div className="border-t border-[#E1DED5] divide-y divide-[#E1DED5]">
            {passengers.map((p) => (
              <div
                key={p.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-[#25313B]">
                    {p.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    Age {p.age} · {p.gender}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editPassenger(p)}
                    className="p-2 text-slate-600 hover:text-[#A48648]"
                    title="Edit passenger"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deletePassenger(p.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Delete passenger"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
