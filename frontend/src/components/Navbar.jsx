"use client"
import { Link, useLocation } from "react-router-dom"
import { useSocket } from "../contexts/SocketContext"
import { useAI } from "../contexts/AIContext"
import { Gavel, Mic, Activity, BarChart3, Bot, Zap } from "lucide-react"

const Navbar = () => {
  const { isConnected, latency } = useSocket()
  const { isActive, isProcessing } = useAI()
  const location = useLocation()

  const isActiveRoute = (path) => location.pathname === path

  const navItems = [
    { path: "/", label: "Live Auctions", icon: Activity },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/voice", label: "Voice Control", icon: Mic },
  ]

  return (
    <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/50">
                <Gavel className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Voxta
              </h1>
              <p className="text-xs text-purple-300/80 font-medium">Premium AI Auctions</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                    isActiveRoute(item.path)
                      ? "bg-white/15 text-white shadow-lg backdrop-blur-sm border border-white/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">{item.label}</span>
                  {isActiveRoute(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-500/30"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {/* AI Status */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isProcessing ? "bg-yellow-400 animate-pulse" : isActive ? "bg-green-400" : "bg-gray-400"
                  }`}
                />
                {isProcessing && <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping"></div>}
              </div>
              <Bot className="h-4 w-4 text-white/70" />
              <span className="text-sm font-medium text-white">
                {isProcessing ? "Processing" : isActive ? "Active" : "Ready"}
              </span>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
                {isConnected && <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>}
              </div>
              <Activity className="h-4 w-4 text-white/70" />
              <span className="text-sm font-medium text-white">{isConnected ? `${latency}ms` : "Offline"}</span>
            </div>

            {/* Quick Voice Trigger */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("startVoiceInterface"))}
              className="group relative p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="h-5 w-5 text-white" />
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
