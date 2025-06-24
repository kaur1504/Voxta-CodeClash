"use client"

import { useState } from "react"
import { useAuction } from "../contexts/AuctionContext"
import { useAI } from "../contexts/AIContext"
import AuctionCard from "../components/AuctionCard"
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Bot,
  AlertCircle,
  Filter,
  Search,
  Star,
  Activity,
  Mic,
} from "lucide-react"

const Dashboard = () => {
  const { auctions, stats, loading, error } = useAuction()
  const { isActive, isProcessing } = useAI()
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const safeAuctions = Array.isArray(auctions) ? auctions : []

  const filteredAuctions = safeAuctions
    .filter((auction) => {
      if (filter !== "all" && auction.status !== filter) return false
      if (searchTerm && !auction.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-high":
          return b.currentBid - a.currentBid
        case "price-low":
          return a.currentBid - b.currentBid
        case "ending-soon":
          return new Date(a.endTime) - new Date(b.endTime)
        case "popular":
          return b.totalBids - a.totalBids
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
    })

  const activeAuctions = safeAuctions.filter((auction) => auction.status === "active")
  const upcomingAuctions = safeAuctions.filter((auction) => auction.status === "upcoming")

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-80 bg-white/5 rounded-3xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-white/5 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white/5 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto p-8 bg-red-500/10 backdrop-blur-xl rounded-3xl border border-red-500/20">
          <AlertCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Connection Error</h2>
          <p className="text-white/70 mb-8 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to Voxta</h1>
        <p className="text-xl text-white/70 mb-8">
          The future of voice-powered auctions. Bid with your voice, win with ease.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("startVoiceInterface"))}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
          >
            <Mic className="h-5 w-5" />
            <span>Start Voice Bidding</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300">
            <TrendingUp className="h-5 w-5" />
            <span>View Analytics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-green-400 mb-2">{stats.activeAuctions}+</div>
            <div className="text-white/70">Active Auctions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalBids}+</div>
            <div className="text-white/70">Happy Bidders</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400 mb-2">${stats.totalValue?.toLocaleString() || 0}+</div>
            <div className="text-white/70">Total Sales</div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Auctions",
            value: stats.totalAuctions,
            icon: <Activity className="h-7 w-7" />,
            gradient: "from-blue-500 to-cyan-500",
            trend: "+12%",
            bg: "bg-blue-500/10",
          },
          {
            title: "Active Auctions",
            value: stats.activeAuctions,
            icon: <Clock className="h-7 w-7" />,
            gradient: "from-green-500 to-emerald-500",
            trend: "+5%",
            bg: "bg-green-500/10",
          },
          {
            title: "Total Bids",
            value: stats.totalBids,
            icon: <Users className="h-7 w-7" />,
            gradient: "from-purple-500 to-pink-500",
            trend: "+23%",
            bg: "bg-purple-500/10",
          },
          {
            title: "Total Value",
            value: `$${stats.totalValue?.toLocaleString() || 0}`,
            icon: <DollarSign className="h-7 w-7" />,
            gradient: "from-orange-500 to-red-500",
            trend: "+18%",
            bg: "bg-orange-500/10",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`group p-6 ${stat.bg} backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-4 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform text-white`}
              >
                {stat.icon}
              </div>
              <span className="text-sm text-green-400 font-bold bg-green-500/20 px-3 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-sm font-medium text-white/70 mb-2">{stat.title}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Enhanced AI Status */}
      {(isActive || isProcessing) && (
        <div className="p-8 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl border border-purple-500/30">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl shadow-lg">
              <Bot className={`h-8 w-8 text-white ${isProcessing ? "animate-pulse" : ""}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-2xl mb-2">AI Assistant Active</h3>
              <p className="text-white/80 text-lg">
                {isProcessing ? "Processing your voice command..." : "Ready for voice commands"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`w-6 h-6 rounded-full ${isProcessing ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`}
              ></div>
              <span className="text-white font-bold text-lg">{isProcessing ? "Processing" : "Online"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-white/50" />
          <input
            type="text"
            placeholder="Search auctions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-lg"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 bg-white/10 rounded-2xl p-2 backdrop-blur-sm border border-white/20">
          {[
            { key: "all", label: "All", count: safeAuctions.length },
            { key: "active", label: "Live", count: activeAuctions.length },
            { key: "upcoming", label: "Upcoming", count: upcomingAuctions.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                filter === key
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm appearance-none pr-12 text-lg font-medium"
          >
            <option value="newest" className="bg-gray-800">
              Newest First
            </option>
            <option value="price-high" className="bg-gray-800">
              Price: High to Low
            </option>
            <option value="price-low" className="bg-gray-800">
              Price: Low to High
            </option>
            <option value="ending-soon" className="bg-gray-800">
              Ending Soon
            </option>
            <option value="popular" className="bg-gray-800">
              Most Popular
            </option>
          </select>
          <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
        </div>
      </div>

      {/* Featured Auctions */}
      {filteredAuctions.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <Star className="h-8 w-8 text-yellow-400" />
            <h2 className="text-4xl font-bold text-white">Featured Auctions</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
            <div className="text-white/70 text-lg font-medium">{filteredAuctions.length} results</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAuctions.length === 0 && (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto p-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
            <Clock className="h-20 w-20 text-white/50 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">No {filter === "all" ? "" : filter} auctions found</h3>
            <p className="text-white/70 text-lg mb-8">
              {searchTerm
                ? `No auctions match "${searchTerm}"`
                : filter === "active"
                  ? "All auctions have ended or are upcoming."
                  : filter === "upcoming"
                    ? "No upcoming auctions scheduled."
                    : "No auctions available at the moment."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
