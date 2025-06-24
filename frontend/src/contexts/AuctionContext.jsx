import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSocket } from "./SocketContext"
import toast from "react-hot-toast"

const AuctionContext = createContext()

export const useAuction = () => {
  const context = useContext(AuctionContext)
  if (!context) {
    throw new Error("useAuction must be used within an AuctionProvider")
  }
  return context
}

export const AuctionProvider = ({ children }) => {
  const [auctions, setAuctions] = useState([])
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const { socket } = useSocket()

  const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"

  // Enhanced fetch auctions with better error handling and retry logic
  const fetchAuctions = useCallback(
    async (retryCount = 0) => {
      try {
        setLoading(true)
        setError(null)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${API_BASE}/api/products`, {
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const auctionsArray = Array.isArray(data) ? data : data.products || []

        // Enhanced auction data processing
        const processedAuctions = auctionsArray.map((auction) => ({
          _id: auction._id || auction.id,
          name: auction.name || "Unnamed Auction",
          description: auction.description || "No description available",
          currentBid: Number.parseFloat(auction.currentBid || auction.current_bid || 0),
          totalBids: Number.parseInt(auction.totalBids || auction.total_bids || 0),
          status: auction.status || "unknown",
          category: auction.category || "General",
          endTime: auction.endTime || auction.end_time,
          startingBid: Number.parseFloat(auction.startingBid || auction.starting_bid || 0),
          image: auction.image || `/placeholder.svg?height=200&width=300`,
          createdAt: auction.createdAt || auction.created_at || new Date().toISOString(),
        }))

        setAuctions(processedAuctions)
        setError(null)
        setLastUpdate(new Date())

        return processedAuctions
      } catch (err) {
        console.error("Error fetching auctions:", err)

        if (err.name === 'AbortError') {
          console.log("Request was aborted")
          return
        }

        if (retryCount < 2) {
          console.log(`Retrying fetch auctions... (${retryCount + 1}/3)`)
          setTimeout(() => fetchAuctions(retryCount + 1), Math.pow(2, retryCount) * 1000)
          return
        }

        setError(err.message)
        setAuctions([])
        
        // Only show toast error on final retry
        if (retryCount >= 2) {
          toast.error(`Failed to load auctions: ${err.message}`)
        }
      } finally {
        setLoading(false)
      }
    },
    [API_BASE],
  )

  // Enhanced stats fetching
  const fetchStats = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${API_BASE}/api/stats`, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setStats(data.overview || data)
      } else {
        // Calculate stats from auctions if API endpoint doesn't exist
        if (auctions.length > 0) {
          const calculatedStats = {
            totalAuctions: auctions.length,
            activeAuctions: auctions.filter((a) => a.status === "active").length,
            totalBids: auctions.reduce((sum, a) => sum + a.totalBids, 0),
            totalValue: auctions.reduce((sum, a) => sum + a.currentBid, 0),
          }
          setStats(calculatedStats)
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
      // Fallback to calculated stats
      if (auctions.length > 0) {
        const calculatedStats = {
          totalAuctions: auctions.length,
          activeAuctions: auctions.filter((a) => a.status === "active").length,
          totalBids: auctions.reduce((sum, a) => sum + a.totalBids, 0),
          totalValue: auctions.reduce((sum, a) => sum + a.currentBid, 0),
        }
        setStats(calculatedStats)
      }
    }
  }, [API_BASE, auctions])

  // Enhanced bid placement
  const placeBid = useCallback(
    async (productId, bidAmount, bidderName = "Web User") => {
      try {
        // Client-side validation
        const auction = auctions.find((a) => a._id === productId)
        if (!auction) {
          throw new Error("Auction not found")
        }

        if (auction.status !== "active") {
          throw new Error("Auction is not active")
        }

        if (bidAmount <= auction.currentBid) {
          throw new Error(`Bid must be higher than current bid of $${auction.currentBid}`)
        }

        // Check if auction has ended
        const now = new Date()
        const endTime = new Date(auction.endTime)
        if (now >= endTime) {
          throw new Error("Auction has ended")
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${API_BASE}/api/bid`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            bidAmount,
            bidderName,
            timestamp: new Date().toISOString(),
            source: "web",
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || "Failed to place bid")
        }

        // Update local state immediately for better UX
        setAuctions((prev) =>
          prev.map((auction) =>
            auction._id === productId
              ? { ...auction, currentBid: bidAmount, totalBids: auction.totalBids + 1 }
              : auction,
          ),
        )

        toast.success(`🎉 Bid placed successfully: $${bidAmount}`)
        return { success: true, data: result }
      } catch (err) {
        console.error("Error placing bid:", err)
        toast.error(err.message)
        return { success: false, error: err.message }
      }
    },
    [auctions, API_BASE],
  )

  // Get auction by ID
  const getAuctionById = useCallback(
    (id) => {
      return auctions.find((auction) => auction._id === id)
    },
    [auctions],
  )

  // Get auctions by status
  const getAuctionsByStatus = useCallback(
    (status) => {
      return auctions.filter((auction) => auction.status === status)
    },
    [auctions],
  )

  // Enhanced socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleBidUpdate = (data) => {
      setAuctions((prev) =>
        prev.map((auction) =>
          auction._id === data.productId
            ? {
                ...auction,
                currentBid: data.newBid,
                totalBids: data.totalBids,
              }
            : auction,
        ),
      )

      // Show notification for other users' bids
      if (data.bidderName !== "AI Voice User") {
        toast(`💰 New bid: $${data.newBid} on ${data.productName}`, {
          icon: "🔥",
          duration: 3000,
        })
      }

      fetchStats()
    }

    const handleAuctionEnded = (data) => {
      setAuctions((prev) =>
        prev.map((auction) => (auction._id === data.productId ? { ...auction, status: "ended" } : auction)),
      )

      toast(`⏰ Auction ended: ${data.productName}`, {
        icon: "🏁",
        duration: 5000,
      })
    }

    // Voice command integration
    const handleVoiceCommand = (data) => {
      toast(`🎤 Voice command: ${data.command}`, {
        icon: "🤖",
        duration: 2000,
      })
    }

    socket.on("bidUpdate", handleBidUpdate)
    socket.on("auctionEnded", handleAuctionEnded)
    socket.on("voiceCommand", handleVoiceCommand)

    return () => {
      socket.off("bidUpdate", handleBidUpdate)
      socket.off("auctionEnded", handleAuctionEnded)
      socket.off("voiceCommand", handleVoiceCommand)
    }
  }, [socket, fetchStats])

  // Initial data fetch and periodic updates
  useEffect(() => {
    fetchAuctions()
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchAuctions()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchAuctions])

  // Fetch stats when auctions change
  useEffect(() => {
    if (auctions.length > 0) {
      fetchStats()
    }
  }, [auctions, fetchStats])

  const value = {
    auctions,
    stats,
    loading,
    error,
    lastUpdate,
    fetchAuctions,
    fetchStats,
    placeBid,
    getAuctionById,
    getAuctionsByStatus,
  }

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>
}
