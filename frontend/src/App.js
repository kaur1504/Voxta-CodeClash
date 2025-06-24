import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { SocketProvider } from "./contexts/SocketContext"
import { AuctionProvider } from "./contexts/AuctionContext"
import { VoiceProvider } from "./contexts/VoiceContext"
import { AIProvider } from "./contexts/AIContext"
import Navbar from "./components/Navbar"
import LoadingScreen from "./components/LoadingScreen"
import VoiceInterface from "./components/VoiceInterface"
import NotificationSystem from "./components/NotificationSystem"
import ErrorBoundary from "./components/ErrorBoundary"
import { Toaster } from "react-hot-toast"

// Lazy load components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"))
const AuctionDetail = lazy(() => import("./pages/AuctionDetail"))
const Analytics = lazy(() => import("./pages/Analytics"))
const VoiceControl = lazy(() => import("./pages/VoiceControl"))

function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <AuctionProvider>
          <VoiceProvider>
            <AIProvider>
              <Router>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
                  {/* Enhanced animated background */}
                  <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/10 to-transparent"></div>
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600/30 to-teal-600/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600/30 to-purple-600/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
                  </div>

                  {/* Grid pattern overlay */}
                  <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                  {/* Main content */}
                  <div className="relative z-10">
                    <Navbar />

                    <main className="container mx-auto px-4 py-8">
                      <Suspense fallback={<LoadingScreen />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/auction/:id" element={<AuctionDetail />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/voice" element={<VoiceControl />} />
                        </Routes>
                      </Suspense>
                    </main>

                    <VoiceInterface />
                    <NotificationSystem />

                    <Toaster
                      position="top-right"
                      toastOptions={{
                        className: "bg-white/10 backdrop-blur-md border border-white/20 text-white",
                        duration: 4000,
                        style: {
                          background: "rgba(255, 255, 255, 0.1)",
                          backdropFilter: "blur(16px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "16px",
                        },
                      }}
                    />
                  </div>
                </div>
              </Router>
            </AIProvider>
          </VoiceProvider>
        </AuctionProvider>
      </SocketProvider>
    </ErrorBoundary>
  )
}

export default App
