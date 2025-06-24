"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSocket } from "../contexts/SocketContext"
import { useAuction } from "../contexts/AuctionContext"
import { Clock, Users, DollarSign, Mic, Send, ArrowLeft, Heart, Share2, Eye } from "lucide-react"
import toast from "react-hot-toast"

const AuctionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [auction, setAuction] = useState(null)
  const [bidAmount, setBidAmount] = useState("")
  const [bidHistory, setBidHistory] = useState([])
  const [timeLeft, setTimeLeft] = useState("")
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const { socket } = useSocket()
  const { placeBid } = useAuction()

  const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"

  useEffect(() => {
    fetchAuctionDetails()
    fetchBidHistory()
  }, [id])

  useEffect(() => {
    if (socket && auction) {
      socket.emit("joinAuction", auction._id)

      socket.on("bidUpdate", (data) => {
        if (data.productId === auction._id) {
          setAuction((prev) => ({
            ...prev,
            currentBid: data.newBid,
            totalBids: data.totalBids,
          }))
          fetchBidHistory()
          toast.success(`New bid: $${data.newBid}`)
        }
      })

      socket.on("auctionEnded", (data) => {
        if (data.productId === auction._id) {
          setAuction((prev) => ({ ...prev, status: "ended" }))
          toast.info("This auction has ended")
        }
      })

      return () => {
        socket.emit("leaveAuction", auction._id)
        socket.off("bidUpdate")
        socket.off("auctionEnded")
      }
    }
  }, [socket, auction])

  useEffect(() => {
    if (auction) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const endTime = new Date(auction.endTime).getTime()
        const distance = endTime - now

        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)

          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
          } else {
            setTimeLeft(`${minutes}m ${seconds}s`)
          }
        } else {
          setTimeLeft("Ended")
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [auction])

  const fetchAuctionDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/product/${id}`)
      if (!response.ok) throw new Error("Auction not found")
      const data = await response.json()
      setAuction(data)
      setViewCount(Math.floor(Math.random() * 100) + 50) // Simulate view count
    } catch (error) {
      console.error("Error fetching auction details:", error)
      toast.error("Failed to load auction details")
    } finally {
      setLoading(false)
    }
  }

  const fetchBidHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/product/${id}/bids`)
      if (response.ok) {
        const data = await response.json()
        setBidHistory(data)
      }
    } catch (error) {
      console.error("Error fetching bid history:", error)
    }
  }

  const handleBid = async (e) => {
    e.preventDefault()

    const bid = Number.parseFloat(bidAmount)
    if (!bid || bid <= auction.currentBid) {
      toast.error(`Bid must be higher than $${auction.currentBid}`)
      return
    }

    const result = await placeBid(auction._id, bid, "Web User")

    if (result.success) {
      toast.success("Bid placed successfully!")
      setBidAmount("")
    } else {
      toast.error(result.error || "Failed to place bid")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${auction.name} - Voxta Auction`,
          text: `Check out this auction: ${auction.name} - Current bid: $${auction.currentBid}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Auction Not Found</h2>
          <p className="text-red-500 dark:text-red-300 mb-4">
            The auction you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Auctions</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image and Details */}
        <div className="space-y-6">
          {/* Main Image */}
          <div className="relative group">
            <img
              src={auction.image || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(auction.name)}`}
              alt={auction.name}
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />

            {/* Image Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl"></div>

            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  auction.status === "active"
                    ? "bg-green-500 text-white"
                    : auction.status === "upcoming"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 text-white"
                }`}
              >
                {auction.status === "active" && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Live Auction</span>
                  </div>
                )}
                {auction.status === "upcoming" && "Upcoming"}
                {auction.status === "ended" && "Ended"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                  isLiked
                    ? "bg-red-500 text-white"
                    : "bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Auction Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{auction.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <Eye className="h-4 w-4" />
                <span>{viewCount} views</span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">{auction.description}</p>

            {/* Auction Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Starting Bid</span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  ${auction.startingBid.toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Bids</span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{auction.totalBids}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Bidding Panel */}
        <div className="space-y-6">
          {/* Current Bid Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 mb-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-lg font-medium">Current Highest Bid</span>
              </div>
              <p className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
                ${auction.currentBid.toLocaleString()}
              </p>

              <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span
                    className={`font-medium ${
                      timeLeft === "Ended"
                        ? "text-red-500"
                        : timeLeft.includes("m") && !timeLeft.includes("h") && !timeLeft.includes("d")
                          ? "text-orange-500"
                          : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {timeLeft}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{auction.totalBids} bids</span>
                </div>
              </div>
            </div>

            {/* Bidding Form */}
            {auction.status === "active" && timeLeft !== "Ended" && (
              <form onSubmit={handleBid} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Bid Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Minimum: $${auction.currentBid + 1}`}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-lg"
                      min={auction.currentBid + 1}
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <Send className="h-4 w-4" />
                    <span>Place Bid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => document.dispatchEvent(new CustomEvent("startVoiceInterface"))}
                    className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Use voice to bid"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
              </form>
            )}

            {/* Auction Ended Message */}
            {(auction.status === "ended" || timeLeft === "Ended") && (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Auction Ended</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Final winning bid: <span className="font-bold">${auction.currentBid.toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Bid History</span>
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {bidHistory.length > 0 ? (
                bidHistory.map((bid, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      index === 0
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-slate-50 dark:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-green-500 text-white"
                            : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{bid.bidderName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(bid.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          index === 0 ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        ${bid.amount.toLocaleString()}
                      </p>
                      {index === 0 && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Highest Bid</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bids yet. Be the first to bid!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionDetail
