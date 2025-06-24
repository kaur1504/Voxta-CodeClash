const mongoose = require("mongoose")

const bidSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },
    bidderName: {
      type: String,
      required: [true, "Bidder name is required"],
      trim: true,
      maxlength: [50, "Bidder name cannot exceed 50 characters"],
    },
    bidderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
        message: "Please enter a valid email address",
      },
    },
    bidderPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^\+?[\d\s\-()]{10,}$/.test(v),
        message: "Please enter a valid phone number",
      },
    },
    amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [1, "Bid amount must be at least $1"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isWinning: {
      type: Boolean,
      default: false,
      index: true,
    },
    bidType: {
      type: String,
      enum: ["manual", "voice", "auto", "proxy"],
      default: "manual",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    sessionId: {
      type: String,
      default: "",
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    validationErrors: [
      {
        type: String,
      },
    ],
    processingTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    source: {
      type: String,
      enum: ["web", "mobile", "voice", "api"],
      default: "web",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Compound indexes for better query performance
bidSchema.index({ productId: 1, timestamp: -1 })
bidSchema.index({ productId: 1, isWinning: 1 })
bidSchema.index({ bidderEmail: 1, timestamp: -1 })
bidSchema.index({ amount: -1, timestamp: -1 })

// Virtual for formatted amount
bidSchema.virtual("formattedAmount").get(function () {
  return `$${this.amount.toLocaleString()}`
})

// Virtual for time since bid
bidSchema.virtual("timeSince").get(function () {
  const now = new Date()
  const diff = now - this.timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  return "Just now"
})

// Static method to get highest bid for a product
bidSchema.statics.getHighestBid = function (productId) {
  return this.findOne({ productId, isValid: true }).sort({ amount: -1 }).populate("productId", "name")
}

// Static method to get bid history for a product
bidSchema.statics.getBidHistory = function (productId, limit = 20) {
  return this.find({ productId, isValid: true }).sort({ timestamp: -1 }).limit(limit).populate("productId", "name")
}

// Static method to get user's bids
bidSchema.statics.getUserBids = function (bidderEmail, limit = 50) {
  return this.find({ bidderEmail, isValid: true })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("productId", "name status endTime")
}

// Static method to get winning bids
bidSchema.statics.getWinningBids = function () {
  return this.find({ isWinning: true, isValid: true })
    .populate("productId", "name status endTime")
    .sort({ timestamp: -1 })
}

// Method to validate bid against product
bidSchema.methods.validateBid = async function () {
  const Product = mongoose.model("Product")
  const product = await Product.findById(this.productId)

  if (!product) {
    this.isValid = false
    this.validationErrors.push("Product not found")
    return false
  }

  if (product.status !== "active") {
    this.isValid = false
    this.validationErrors.push("Auction is not active")
    return false
  }

  if (new Date() > new Date(product.endTime)) {
    this.isValid = false
    this.validationErrors.push("Auction has ended")
    return false
  }

  if (this.amount <= product.currentBid) {
    this.isValid = false
    this.validationErrors.push(`Bid must be higher than current bid of $${product.currentBid}`)
    return false
  }

  return true
}

// Pre-save middleware for validation
bidSchema.pre("save", async function (next) {
  if (this.isNew) {
    const isValid = await this.validateBid()
    if (!isValid) {
      const error = new Error(this.validationErrors.join(", "))
      error.name = "ValidationError"
      return next(error)
    }
  }
  next()
})

// Post-save middleware for updating product and notifications
bidSchema.post("save", async (doc) => {
  if (doc.isNew && doc.isValid) {
    try {
      const Product = mongoose.model("Product")

      // Mark previous winning bids as not winning
      await mongoose
        .model("Bid")
        .updateMany({ productId: doc.productId, isWinning: true, _id: { $ne: doc._id } }, { isWinning: false })

      // Update product with new highest bid
      await Product.findByIdAndUpdate(doc.productId, {
        currentBid: doc.amount,
        $inc: { totalBids: 1 },
      })

      console.log(`💰 New bid placed: $${doc.amount} on product ${doc.productId}`)
    } catch (error) {
      console.error("Error updating product after bid:", error)
    }
  }
})

module.exports = mongoose.model("Bid", bidSchema)
