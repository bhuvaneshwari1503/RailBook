
import { BERTH_LABEL } from '../api/labels'

// Berths in one bay, side berths, and rows in the main block
const LAYOUT = {
  SL: { bay: 8, side: 2, rows: 3 },
  AC3: { bay: 8, side: 2, rows: 3 },
  AC2: { bay: 6, side: 2, rows: 2 },
  AC1: { bay: 2, side: 0, rows: 2 },
}

function Berth({ s, selected, onToggle }) {
  const style = selected.includes(s.id)
    ? 'bg-blue-600 text-white border-blue-700'
    : s.status === 'AVAILABLE'
    ? 'bg-green-100 text-green-800 border-green-400 hover:bg-green-200'
    : s.status === 'HELD'
    ? 'bg-yellow-100 text-yellow-700 border-yellow-300 cursor-not-allowed'
    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'

  return (
    <button
      type="button"
      disabled={s.status !== 'AVAILABLE'}
      onClick={() => onToggle(s.id)}
      title={`${s.coach}-${s.seatNo} · ${BERTH_LABEL[s.berth] || s.berth}`}
      className={`w-12 h-11 border rounded flex flex-col items-center justify-center leading-tight ${style}`}
    >
      <span className="text-sm font-semibold">{s.seatNo}</span>
      <span className="text-[10px] opacity-80">{s.berth}</span>
    </button>
  )
}

export default function SeatGrid({ seats, selected, onToggle }) {
  if (!seats || seats.length === 0) return null

  const cfg = LAYOUT[seats[0].classType]

  if (!cfg) {
    return <p className="text-sm text-red-600">Unknown coach layout.</p>
  }

  const bays = []

  for (let i = 0; i < seats.length; i += cfg.bay) {
    bays.push(seats.slice(i, i + cfg.bay))
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {bays.map((bay, i) => {
        const main = cfg.side > 0
          ? bay.slice(0, bay.length - cfg.side)
          : bay

        const side = cfg.side > 0
          ? bay.slice(bay.length - cfg.side)
          : []

        return (
          <div key={i} className="border rounded-lg p-2 bg-slate-50">
            <p className="text-[11px] text-gray-400 mb-1">
              Bay {i + 1}
            </p>

            <div className="flex items-stretch justify-between gap-3">
              <div
                className="grid grid-flow-col gap-1"
                style={{ gridTemplateRows: `repeat(${cfg.rows}, auto)` }}
              >
                {main.map((s) => (
                  <Berth
                    key={s.id}
                    s={s}
                    selected={selected}
                    onToggle={onToggle}
                  />
                ))}
              </div>

              {side.length > 0 && (
                <>
                  <div
                    className="border-l border-dashed"
                    title="Aisle"
                  />

                  <div className="flex flex-col gap-1 justify-center">
                    {side.map((s) => (
                      <Berth
                        key={s.id}
                        s={s}
                        selected={selected}
                        onToggle={onToggle}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
