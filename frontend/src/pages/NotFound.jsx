
import { Link } from 'react-router-dom'
import { TrainFront } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-blue-100 text-blue-700 p-5 rounded-full mb-5">
        <TrainFront size={48} />
      </div>

      <p className="text-6xl font-bold text-blue-700">404</p>

      <h2 className="text-2xl font-semibold text-slate-800 mt-3">
        This track leads nowhere
      </h2>

      <p className="text-slate-500 mt-2">
        The page you are looking for does not exist.
      </p>

      <Link
        to="/"
        className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Back to home
      </Link>
    </div>
  )
}
