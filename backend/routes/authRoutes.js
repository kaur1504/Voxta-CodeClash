const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Simple user store (in production, use a proper database)
const users = new Map()

// Register user (simplified for demo)
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" })
    }

    if (users.has(email)) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    users.set(email, {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      isActive: true,
    })

    const token = jwt.sign({ email, name }, process.env.JWT_SECRET || "Voxta-secret", { expiresIn: "24h" })

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { email, name },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Registration failed" })
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = users.get(email)
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET || "Voxta-secret", {
      expiresIn: "24h",
    })

    res.json({
      message: "Login successful",
      token,
      user: { email: user.email, name: user.name },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Login failed" })
  }
})

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Voxta-secret")
    req.user = decoded
    next()
  } catch (error) {
    res.status(400).json({ message: "Invalid token" })
  }
}

// Get user profile
router.get("/profile", verifyToken, (req, res) => {
  const user = users.get(req.user.email)
  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  res.json({
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  })
})

module.exports = router