"use client"

import { useState } from "react"
import { useAuction } from "../contexts/AuctionContext"
import { Clock, Users, DollarSign, Gavel, Eye, Heart, TrendingUp, Zap } from "lucide-react"
import { Link } from "react-router-dom"

const AuctionCard = ({ auction }) => {
  const { placeBid } = useAuction()
  const [bidAmount, setBidAmount] = useState("")
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handlePlaceBid = async (e) => {
    e.preventDefault()
    if (!bidAmount || Number.parseFloat(bidAmount) <= auction.currentBid) return

    setIsPlacingBid(true)
    try {
      await placeBid(auction._id, Number.parseFloat(bidAmount), "Web User")
      setBidAmount("")
    } catch (error) {
      console.error("Bid failed:", error)
    } finally {
      setIsPlacingBid(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "from-green-500 to-emerald-500"
      case "upcoming":
        return "from-blue-500 to-cyan-500"
      case "ended":
        return "from-gray-500 to-slate-500"
      default:
        return "from-gray-500 to-slate-500"
    }
  }

  const timeRemaining = () => {
    if (!auction.endTime) return "Unknown"
    const end = new Date(auction.endTime)
    const now = new Date()
    const diff = end - now

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={auction.image || "/placeholder.svg?height=200&width=300"}
          alt={auction.name}
          className="w-full h-52 object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <div
            className={`px-4 py-2 bg-gradient-to-r ${getStatusColor(auction.status)} rounded-full text-white text-sm font-bold shadow-lg flex items-center space-x-2`}
          >
            {auction.status === "active" && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
            <span className="capitalize">{auction.status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isLiked ? "bg-red-500 text-white scale-110" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          </button>
          <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
            <Eye className="h-5 w-5" />
          </button>
        </div>

        {/* Enhanced Price Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs text-white/80 mb-1">Current Bid</p>
                <p className="text-2xl font-bold">${auction.currentBid.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80 mb-1">Time Left</p>
                <p className="text-lg font-bold">{timeRemaining()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-4">
        <div>
          <h3 className="font-bold text-white text-xl mb-3 line-clamp-2 group-hover:text-purple-200 transition-colors">
            {auction.name}
          </h3>
          <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">{auction.description}</p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-lg font-bold text-white">${auction.currentBid}</div>
            <div className="text-xs text-white/60">Current</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white">{auction.totalBids}</div>
            <div className="text-xs text-white/60">Bids</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-lg font-bold text-white">{timeRemaining()}</div>
            <div className="text-xs text-white/60">Left</div>
          </div>
        </div>

        {/* Enhanced Bidding Form */}
        {auction.status === "active" && (
          <form onSubmit={handlePlaceBid} className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Min: $${auction.currentBid + 1}`}
                  min={auction.currentBid + 1}
                  step="0.01"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isPlacingBid || !bidAmount || Number.parseFloat(bidAmount) <= auction.currentBid}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Gavel className="h-4 w-4" />
                <span>{isPlacingBid ? "Bidding..." : "Bid"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Enhanced View Details Button */}
        <Link
          to={`/auction/${auction._id}`}
          className="block w-full py-4 text-center bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm group-hover:border-purple-500/50 group-hover:bg-gradient-to-r group-hover:from-purple-500/20 group-hover:to-cyan-500/20"
        >
          Explore Details
        </Link>
      </div>

      {/* Trending Indicator */}
      {auction.totalBids > 10 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold rounded-full shadow-lg">
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
            <Zap className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  )
}

export default AuctionCard
