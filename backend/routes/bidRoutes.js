const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const Bid = require("../models/Bid")

// Input validation middleware
const validateBidInput = (req, res, next) => {
  const { productId, bidAmount, bidderName } = req.body

  if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Valid product ID is required" })
  }

  if (!bidAmount || typeof bidAmount !== "number" || bidAmount <= 0) {
    return res.status(400).json({ message: "Valid bid amount is required" })
  }

  if (!bidderName || bidderName.trim().length === 0) {
    return res.status(400).json({ message: "Bidder name is required" })
  }

  next()
}

// Rate limiting for bids (prevent spam)
const bidRateLimit = {}
const BID_RATE_LIMIT = 5 // max 5 bids per minute per IP
const BID_RATE_WINDOW = 60 * 1000 // 1 minute

const checkBidRateLimit = (req, res, next) => {
  const ip = req.ip
  const now = Date.now()

  if (!bidRateLimit[ip]) {
    bidRateLimit[ip] = []
  }

  // Remove old entries
  bidRateLimit[ip] = bidRateLimit[ip].filter((time) => now - time < BID_RATE_WINDOW)

  if (bidRateLimit[ip].length >= BID_RATE_LIMIT) {
    return res.status(429).json({
      message: "Too many bids. Please wait before placing another bid.",
    })
  }

  bidRateLimit[ip].push(now)
  next()
}

// Place a bid
router.post("/bid", checkBidRateLimit, validateBidInput, async (req, res) => {
  const startTime = Date.now()

  try {
    const { productId, bidAmount, bidderName, bidderEmail, bidderPhone } = req.body

    // Find the product
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Update product status
    await product.updateStatus()

    // Check if auction is active
    if (product.status !== "active") {
      return res.status(400).json({
        message: `Auction is ${product.status}. Only active auctions accept bids.`,
      })
    }

    // Check if auction has ended
    if (new Date() >= new Date(product.endTime)) {
      return res.status(400).json({ message: "Auction has ended" })
    }

    // Check if bid is higher than current bid
    if (bidAmount <= product.currentBid) {
      return res.status(400).json({
        message: `Bid must be higher than current bid of $${product.currentBid}`,
        currentBid: product.currentBid,
        minimumBid: product.currentBid + 1,
      })
    }

    // Check reserve price if set
    if (product.reservePrice > 0 && bidAmount < product.reservePrice) {
      return res.status(400).json({
        message: `Bid must meet reserve price of $${product.reservePrice}`,
        reservePrice: product.reservePrice,
      })
    }

    // Mark previous winning bids as not winning
    await Bid.updateMany({ productId: productId, isWinning: true }, { isWinning: false })

    // Create new bid
    const bid = new Bid({
      productId,
      bidderName: bidderName.trim(),
      bidderEmail: bidderEmail?.trim(),
      bidderPhone: bidderPhone?.trim(),
      amount: bidAmount,
      isWinning: true,
      bidType: req.body.bidType || "manual",
      source: req.body.source || "web",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      sessionId: req.sessionID || "",
      processingTime: Date.now() - startTime,
    })

    await bid.save()

    // Update product with new bid
    product.currentBid = bidAmount
    product.totalBids += 1
    await product.save()

    // Emit socket events
    const io = req.app.get("io")
    if (io) {
      // Emit to auction room
      io.to(productId).emit("bidUpdate", {
        productId,
        productName: product.name,
        newBid: bidAmount,
        totalBids: product.totalBids,
        bidderName: bid.bidderName,
        timestamp: bid.timestamp,
      })

      // Emit to all connected users
      io.emit("globalBidUpdate", {
        productId,
        productName: product.name,
        newBid: bidAmount,
        category: product.category,
      })

      // Check if auction is ending soon (less than 5 minutes)
      const timeLeft = new Date(product.endTime) - new Date()
      if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
        io.to(productId).emit("auctionEndingSoon", {
          productId,
          productName: product.name,
          timeLeft: Math.floor(timeLeft / 1000),
        })
      }
    }

    res.json({
      message: "Bid placed successfully",
      bid: {
        id: bid._id,
        amount: bid.amount,
        timestamp: bid.timestamp,
        isWinning: bid.isWinning,
      },
      product: {
        id: product._id,
        name: product.name,
        currentBid: product.currentBid,
        totalBids: product.totalBids,
        timeRemaining: product.timeRemaining,
      },
      processingTime: Date.now() - startTime,
    })
  } catch (error) {
    console.error("Error placing bid:", error)

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        message: "Bid validation failed",
        errors,
      })
    }

    res.status(500).json({
      message: "Failed to place bid",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Get user's bid history
router.get("/bids/user/:email", async (req, res) => {
  try {
    const { email } = req.params
    const { page = 1, limit = 20 } = req.query

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" })
    }

    const skip = (Number(page) - 1) * Number(limit)

    const bids = await Bid.find({ bidderEmail: email, isValid: true })
      .populate("productId", "name status endTime image")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Bid.countDocuments({ bidderEmail: email, isValid: true })

    res.json({
      bids,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching user bids:", error)
    res.status(500).json({
      message: "Failed to fetch bid history",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Get winning bids
router.get("/bids/winning", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const winningBids = await Bid.find({ isWinning: true, isValid: true })
      .populate("productId", "name status endTime image category")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Bid.countDocuments({ isWinning: true, isValid: true })

    res.json({
      bids: winningBids,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching winning bids:", error)
    res.status(500).json({
      message: "Failed to fetch winning bids",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

module.exports = router