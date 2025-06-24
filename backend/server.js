const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const mongoose = require("mongoose")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config()

const productRoutes = require("./routes/productRoutes")
const bidRoutes = require("./routes/bidRoutes")
const statsRoutes = require("./routes/statsRoutes")
const authRoutes = require("./routes/authRoutes")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling']
})

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for better UX
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware
app.use(limiter)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Enhanced security headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff")
  res.header("X-Frame-Options", "DENY")
  res.header("X-XSS-Protection", "1; mode=block")
  res.header("Referrer-Policy", "strict-origin-when-cross-origin")
  res.header("X-Powered-By", "Voxta")
  next()
})

// MongoDB Connection with enhanced retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Voxta", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    
    // Seed database if empty
    const Product = require("./models/Product")
    const productCount = await Product.countDocuments()
    if (productCount === 0) {
      console.log("🌱 Seeding database with sample data...")
      const { seedDatabase } = require("./seedData")
      await seedDatabase()
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    setTimeout(connectDB, 5000)
  }
}

connectDB()

// Enhanced Socket.IO Connection Management
const activeUsers = new Map()
const auctionRooms = new Map()
const voiceConnections = new Map()

io.on("connection", (socket) => {
  console.log(`🔗 User connected: ${socket.id}`)
  
  activeUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    currentAuction: null,
    isVoiceEnabled: false,
    lastActivity: new Date(),
  })

  // Enhanced auction room management
  socket.on("joinAuction", (auctionId) => {
    socket.join(auctionId)
    
    const user = activeUsers.get(socket.id)
    if (user) {
      user.currentAuction = auctionId
      user.lastActivity = new Date()
    }

    if (!auctionRooms.has(auctionId)) {
      auctionRooms.set(auctionId, new Set())
    }
    auctionRooms.get(auctionId).add(socket.id)

    console.log(`👥 User ${socket.id} joined auction ${auctionId}`)
    
    socket.to(auctionId).emit("userJoined", {
      userId: socket.id,
      timestamp: new Date(),
      userCount: auctionRooms.get(auctionId).size
    })
  })

  socket.on("leaveAuction", (auctionId) => {
    socket.leave(auctionId)
    
    const user = activeUsers.get(socket.id)
    if (user) {
      user.currentAuction = null
    }

    if (auctionRooms.has(auctionId)) {
      auctionRooms.get(auctionId).delete(socket.id)
      if (auctionRooms.get(auctionId).size === 0) {
        auctionRooms.delete(auctionId)
      }
    }

    console.log(`👋 User ${socket.id} left auction ${auctionId}`)
  })

  // Enhanced voice command handling
  socket.on("voiceCommand", (data) => {
    console.log(`🎤 Voice command from ${socket.id}:`, data.command)
    
    const user = activeUsers.get(socket.id)
    if (user) {
      user.isVoiceEnabled = true
      user.lastActivity = new Date()
    }

    // Broadcast voice activity to other users in the same auction
    if (user && user.currentAuction) {
      socket.to(user.currentAuction).emit("voiceActivity", {
        userId: socket.id,
        command: data.command,
        timestamp: new Date(),
      })
    }

    socket.emit("voiceResponse", {
      command: data.command,
      response: "Voice command received and processed",
      timestamp: new Date(),
      confidence: data.confidence || 0.8
    })
  })

  // Enhanced AI interaction handling
  socket.on("aiInteraction", (data) => {
    console.log(`🧠 AI interaction from ${socket.id}:`, data.intent)
    
    // Broadcast AI insights to interested users
    socket.broadcast.emit("aiInsight", {
      intent: data.intent,
      confidence: data.confidence,
      timestamp: new Date(),
    })
  })

  // Ping/pong for latency measurement
  socket.on("ping", (timestamp) => {
    socket.emit("pong", timestamp)
  })

  // Enhanced disconnect handling
  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`)
    
    const user = activeUsers.get(socket.id)
    if (user && user.currentAuction) {
      if (auctionRooms.has(user.currentAuction)) {
        auctionRooms.get(user.currentAuction).delete(socket.id)
        if (auctionRooms.get(user.currentAuction).size === 0) {
          auctionRooms.delete(user.currentAuction)
        }
      }
    }

    activeUsers.delete(socket.id)
    voiceConnections.delete(socket.id)
  })
})

// Make enhanced socket data accessible to routes
app.set("io", io)
app.set("activeUsers", activeUsers)
app.set("auctionRooms", auctionRooms)
app.set("voiceConnections", voiceConnections)

// Enhanced health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeConnections: activeUsers.size,
    activeAuctions: auctionRooms.size,
    voiceConnections: voiceConnections.size,
    memory: process.memoryUsage(),
    version: "2.0.0"
  })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api", productRoutes)
app.use("/api", bidRoutes)
app.use("/api", statsRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'))
  })
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🎯 Voxta API Server - Enhanced Voice-Powered Auction Platform",
    version: "2.0.0",
    status: "Running",
    features: [
      "Enhanced Voice Recognition",
      "AI-Powered Bidding",
      "Real-time Socket.IO",
      "Advanced Analytics",
      "Multi-language Support"
    ],
    endpoints: {
      health: "/health",
      products: "/api/products",
      bids: "/api/bid",
      stats: "/api/stats",
      auth: "/api/auth",
    },
    websocket: "Socket.IO enabled",
    activeConnections: activeUsers.size,
  })
})

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack)
  
  const isDevelopment = process.env.NODE_ENV === "development"
  
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    error: isDevelopment ? err.message : "Internal server error",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
    method: req.method,
    availableRoutes: ["/api/products", "/api/bid", "/api/stats", "/health"],
    timestamp: new Date().toISOString()
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`
🚀 Enhanced Voxta Server Started Successfully!
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || "development"}
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}
📊 MongoDB: ${process.env.MONGODB_URI ? "Connected" : "Local"}
🎤 Voice Integration: Enhanced & Active
🧠 AI Processing: Enabled
⚡ Socket.IO: Active with Enhanced Features
🔒 Security: Enhanced Headers & Rate Limiting
📈 Version: 2.0.0
  `)
})

// Enhanced graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...")
  server.close(() => {
    console.log("✅ HTTP server closed")
    mongoose.connection.close(false, () => {
      console.log("✅ MongoDB connection closed")
      process.exit(0)
    })
  })
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...")
  server.close(() => {
    console.log("✅ HTTP server closed")
    mongoose.connection.close(false, () => {
      console.log("✅ MongoDB connection closed")
      process.exit(0)
    })
  })
})
