
import { useNavigate } from 'react-router-dom'
import { CLASS_LABEL } from '../api/labels'

const duration = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`

export default function TrainCard({ train }) {
  const navigate = useNavigate()

  const selectClass = (c) => {
    navigate(`/seats/${train.runId}/${c.classType}?from=${train.from}&to=${train.to}`)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <h3 className="text-lg font-bold">{train.trainName}</h3>
          <p className="text-sm text-gray-500">#{train.trainNumber} · {train.distanceKm} km</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">
            {train.departureTime.slice(0, 5)} → {train.arrivalTime.slice(0, 5)}
            {train.arrivalDayOffset > 0 && (
              <sup className="text-xs text-red-600 ml-1">+{train.arrivalDayOffset}d</sup>
            )}
          </p>
          <p className="text-sm text-gray-500">
            {train.from} → {train.to} · {duration(train.durationMinutes)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {train.classes.map((c) => (
          <button
            key={c.classType}
            onClick={() => selectClass(c)}
            className="border rounded p-3 text-left hover:border-blue-500 hover:bg-blue-50"
          >
            <p className="font-medium text-sm">{CLASS_LABEL[c.classType]}</p>
            <p className="text-blue-700 font-bold">₹{c.fare}</p>
            <p className={`text-xs ${c.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {c.available > 0 ? `${c.available} available` : 'Sold out · Join waitlist'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
