import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import Seats from './pages/Seats'
import Passengers from './pages/Passengers'
import Payment from './pages/Payment'
import PaymentOptions from './pages/PaymentOptions'
import PaymentSuccess from './pages/PaymentSuccess'
import Ticket from './pages/Ticket'
import MyBookings from './pages/MyBookings'
import PnrStatus from './pages/PnrStatus'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-100 flex flex-col">
          <Toaster position="top-right" />

          <Navbar />

          <main className="max-w-5xl w-full mx-auto px-4 py-6 flex-1">
            <Routes>
              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* PNR Status */}
              <Route path="/pnr" element={<PnrStatus />} />

              {/* Search - homepage and search URL */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />

              {/* Seat Selection */}
              <Route
                path="/seats/:runId/:classType"
                element={
                  <ProtectedRoute>
                    <Seats />
                  </ProtectedRoute>
                }
              />

              {/* Passengers */}
              <Route
                path="/passengers"
                element={
                  <ProtectedRoute>
                    <Passengers />
                  </ProtectedRoute>
                }
              />

              {/* Payment */}
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payment-options"
                element={
                  <ProtectedRoute>
                    <PaymentOptions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payment-success"
                element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                }
              />

              {/* Ticket */}
              <Route
                path="/ticket"
                element={
                  <ProtectedRoute>
                    <Ticket />
                  </ProtectedRoute>
                }
              />

              {/* My Bookings */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <footer className="text-center text-xs text-gray-400 py-6">
            RailBook · Demo project. Not affiliated with Indian Railways or IRCTC.
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
