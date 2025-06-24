const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    image: {
      type: String,
      default: "",
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v) || v.startsWith("/placeholder.svg"),
        message: "Image must be a valid URL",
      },
    },
    startingBid: {
      type: Number,
      required: [true, "Starting bid is required"],
      min: [1, "Starting bid must be at least $1"],
    },
    currentBid: {
      type: Number,
      required: true,
      min: [1, "Current bid must be at least $1"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
      validate: {
        validator: function (v) {
          return v > this.startTime
        },
        message: "End time must be after start time",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["upcoming", "active", "ended"],
        message: "Status must be upcoming, active, or ended",
      },
      default: "upcoming",
    },
    totalBids: {
      type: Number,
      default: 0,
      min: [0, "Total bids cannot be negative"],
    },
    category: {
      type: String,
      default: "General",
      enum: ["Electronics", "Fashion", "Home", "Sports", "Books", "Art", "Jewelry", "Vehicles", "General"],
    },
    seller: {
      type: String,
      default: "Voxta Admin",
    },
    condition: {
      type: String,
      enum: ["New", "Like New", "Good", "Fair", "Poor"],
      default: "Good",
    },
    reservePrice: {
      type: Number,
      default: 0,
      min: [0, "Reserve price cannot be negative"],
    },
    buyNowPrice: {
      type: Number,
      default: null,
      min: [1, "Buy now price must be at least $1"],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, "View count cannot be negative"],
    },
    watchCount: {
      type: Number,
      default: 0,
      min: [0, "Watch count cannot be negative"],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    shippingInfo: {
      cost: {
        type: Number,
        default: 0,
        min: [0, "Shipping cost cannot be negative"],
      },
      method: {
        type: String,
        default: "Standard",
      },
      estimatedDays: {
        type: Number,
        default: 7,
        min: [1, "Estimated shipping days must be at least 1"],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for better query performance
productSchema.index({ status: 1, endTime: 1 })
productSchema.index({ category: 1, status: 1 })
productSchema.index({ currentBid: -1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ name: "text", description: "text" })

// Virtual for time remaining
productSchema.virtual("timeRemaining").get(function () {
  const now = new Date()
  const endTime = new Date(this.endTime)
  const diff = endTime - now

  if (diff <= 0) return "Ended"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

// Virtual for bid increment suggestion
productSchema.virtual("suggestedBid").get(function () {
  const current = this.currentBid
  if (current < 100) return current + 5
  if (current < 500) return current + 10
  if (current < 1000) return current + 25
  return current + 50
})

// Method to update status based on current time
productSchema.methods.updateStatus = function () {
  const now = new Date()
  const startTime = new Date(this.startTime)
  const endTime = new Date(this.endTime)

  if (now < startTime) {
    this.status = "upcoming"
  } else if (now >= this.startTime && now < this.endTime) {
    this.status = "active"
  } else {
    this.status = "ended"
  }

  return this.save()
}

// Method to increment view count
productSchema.methods.incrementViews = function () {
  this.viewCount += 1
  return this.save()
}

// Method to check if bid is valid
productSchema.methods.isValidBid = function (bidAmount) {
  return bidAmount > this.currentBid && this.status === "active" && new Date() < new Date(this.endTime)
}

// Static method to get active auctions
productSchema.statics.getActiveAuctions = function () {
  return this.find({ status: "active" }).sort({ endTime: 1 })
}

// Static method to get ending soon auctions
productSchema.statics.getEndingSoon = function (hours = 24) {
  const now = new Date()
  const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000)

  return this.find({
    status: "active",
    endTime: { $lte: endTime },
  }).sort({ endTime: 1 })
}

// Pre-save middleware to validate business rules
productSchema.pre("save", function (next) {
  // Ensure current bid is at least starting bid
  if (this.currentBid < this.startingBid) {
    this.currentBid = this.startingBid
  }

  // Auto-update status
  const now = new Date()
  if (now < this.startTime) {
    this.status = "upcoming"
  } else if (now >= this.startTime && now < this.endTime) {
    this.status = "active"
  } else {
    this.status = "ended"
  }

  next()
})

// Post-save middleware for logging
productSchema.post("save", (doc) => {
  console.log(`📦 Product ${doc.name} saved with status: ${doc.status}`)
})

module.exports = mongoose.model("Product", productSchema)
