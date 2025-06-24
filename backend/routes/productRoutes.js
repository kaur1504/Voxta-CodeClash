const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const Bid = require("../models/Bid")

// Input validation middleware
const validateProductInput = (req, res, next) => {
  const { name, description, startingBid, startTime, endTime } = req.body

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: "Product name is required" })
  }

  if (!description || description.trim().length === 0) {
    return res.status(400).json({ message: "Product description is required" })
  }

  if (!startingBid || startingBid < 1) {
    return res.status(400).json({ message: "Starting bid must be at least $1" })
  }

  if (!startTime || !endTime) {
    return res.status(400).json({ message: "Start time and end time are required" })
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return res.status(400).json({ message: "End time must be after start time" })
  }

  next()
}

// Get all products with filtering and pagination
router.get("/products", async (req, res) => {
  try {
    const {
      status,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query

    // Build filter object
    const filter = {}

    if (status) filter.status = status
    if (category && category !== "all") filter.category = category
    if (minPrice || maxPrice) {
      filter.currentBid = {}
      if (minPrice) filter.currentBid.$gte = Number(minPrice)
      if (maxPrice) filter.currentBid.$lte = Number(maxPrice)
    }

    // Text search
    if (search) {
      filter.$text = { $search: search }
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit)

    // Execute query
    const products = await Product.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean()

    // Update status for each product
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        const productDoc = await Product.findById(product._id)
        await productDoc.updateStatus()
        return productDoc.toObject()
      }),
    )

    // Get total count for pagination
    const total = await Product.countDocuments(filter)

    res.json({
      products: updatedProducts,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Get single product with detailed information
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update status and increment view count
    await product.updateStatus();
    await product.incrementViews();

    // Get related products (same category, excluding current)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: { $in: ["active", "upcoming"] },
    })
      .limit(4)
      .select("name currentBid image status");

    res.json({
      ...product.toObject(),
      relatedProducts,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({
      message: "Failed to fetch product details",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
});

// Get bid history for a product
router.get("/product/:id/bids", async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 20, page = 1 } = req.query

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid product ID format" })
    }

    const skip = (Number(page) - 1) * Number(limit)

    const bids = await Bid.find({ productId: id, isValid: true })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("bidderName amount timestamp bidType source")
      .lean()

    const total = await Bid.countDocuments({ productId: id, isValid: true })

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
    console.error("Error fetching bid history:", error)
    res.status(500).json({
      message: "Failed to fetch bid history",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Get featured products
router.get("/products/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({
      isFeatured: true,
      status: { $in: ["active", "upcoming"] },
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    res.json(featuredProducts)
  } catch (error) {
    console.error("Error fetching featured products:", error)
    res.status(500).json({
      message: "Failed to fetch featured products",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Get ending soon products
router.get("/products/ending-soon", async (req, res) => {
  try {
    const { hours = 24 } = req.query
    const endingSoon = await Product.getEndingSoon(Number(hours))

    res.json(endingSoon)
  } catch (error) {
    console.error("Error fetching ending soon products:", error)
    res.status(500).json({
      message: "Failed to fetch ending soon products",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

module.exports = router