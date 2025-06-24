const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const Bid = require("../models/Bid")

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const { timeRange = "24h" } = req.query

    // Calculate time filter
    let timeFilter = {}
    const now = new Date()

    switch (timeRange) {
      case "1h":
        timeFilter = { createdAt: { $gte: new Date(now - 60 * 60 * 1000) } }
        break
      case "24h":
        timeFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } }
        break
      case "7d":
        timeFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } }
        break
      case "30d":
        timeFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } }
        break
      default:
        timeFilter = {}
    }

    // Parallel queries for better performance
    const [
      totalAuctions,
      activeAuctions,
      upcomingAuctions,
      endedAuctions,
      totalBids,
      recentBids,
      topBidders,
      categoryStats,
      revenueStats,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "upcoming" }),
      Product.countDocuments({ status: "ended" }),
      Bid.countDocuments({ isValid: true }),
      Bid.countDocuments({ ...timeFilter, isValid: true }),
      Bid.aggregate([
        { $match: { isValid: true } },
        { $group: { _id: "$bidderName", totalBids: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
      ]),
      Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, totalValue: { $sum: "$currentBid" } } },
        { $sort: { totalValue: -1 } },
      ]),
      Product.aggregate([
        { $group: { _id: null, totalValue: { $sum: "$currentBid" }, avgBid: { $avg: "$currentBid" } } },
      ]),
    ])

    // Calculate additional metrics
    const totalValue = revenueStats[0]?.totalValue || 0
    const averageBid = revenueStats[0]?.avgBid || 0
    const conversionRate = totalAuctions > 0 ? (totalBids / totalAuctions) * 100 : 0

    res.json({
      overview: {
        totalAuctions,
        activeAuctions,
        upcomingAuctions,
        endedAuctions,
        totalBids,
        recentBids,
        totalValue,
        averageBid: Math.round(averageBid),
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      topBidders: topBidders.map((bidder) => ({
        name: bidder._id,
        totalBids: bidder.totalBids,
        totalAmount: bidder.totalAmount,
        averageBid: Math.round(bidder.totalAmount / bidder.totalBids),
      })),
      categoryStats: categoryStats.map((cat) => ({
        category: cat._id || "General",
        count: cat.count,
        totalValue: cat.totalValue,
        averageValue: Math.round(cat.totalValue / cat.count),
      })),
      timeRange,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Get real-time metrics
router.get("/stats/realtime", async (req, res) => {
  try {
    const now = new Date()
    const oneMinuteAgo = new Date(now - 60 * 1000)
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000)

    const [bidsLastMinute, bidsLast5Minutes, endingSoonCount] = await Promise.all([
      Bid.countDocuments({
        timestamp: { $gte: oneMinuteAgo },
        isValid: true,
      }),
      Bid.countDocuments({
        timestamp: { $gte: fiveMinutesAgo },
        isValid: true,
      }),
      Product.countDocuments({
        status: "active",
        endTime: { $lte: new Date(now.getTime() + 60 * 60 * 1000) }, // ending in 1 hour
      }),
    ])

    const activeUsers = req.app.get("activeUsers")?.size || 0

    res.json({
      bidsLastMinute,
      bidsLast5Minutes,
      activeUsers,
      endingSoonCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching real-time stats:", error)
    res.status(500).json({
      message: "Failed to fetch real-time statistics",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

module.exports = router